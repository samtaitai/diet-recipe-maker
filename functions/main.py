import datetime
import json
import os
import google.generativeai as genai
from firebase_admin import initialize_app, firestore, auth
from firebase_functions import https_fn, options
from google.cloud import firestore as google_firestore

# Initialize Firebase Admin
initialize_app()
# Global variables for lazy initialization
_db = None

def get_db():
    global _db
    if _db is None:
        _db = firestore.client()
    return _db

# Configure Gemini
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)


# --- Shared Auth Helper ---

def verify_auth(req):
    """Verify Firebase ID token from the Authorization header.

    Returns (uid, decoded_token) on success.
    Raises ValueError with an error message on failure.
    """
    auth_header = req.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise ValueError("Unauthorized: Missing or invalid token")

    parts = auth_header.split(" ")
    if len(parts) != 2:
        raise ValueError("Unauthorized: Malformed token")
    id_token = parts[1]

    decoded_token = auth.verify_id_token(id_token)
    uid = decoded_token["uid"]
    return uid, decoded_token


# --- Generate Recipe ---

@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST", "OPTIONS"],
    )
)
def generate_recipe(req: https_fn.Request) -> https_fn.Response:
    """
    Generates a recipe based on dietary rules and user ingredients.
    Verifies Auth token and enforces rate limiting.
    """
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)

    if req.method != "POST":
        return https_fn.Response("Method not allowed", status=405)

    # 2. Authentication
    try:
        uid, decoded_token = verify_auth(req)
    except ValueError as e:
        return https_fn.Response(str(e), status=401)
    except Exception as e:
        return https_fn.Response(f"Unauthorized: Invalid token. {str(e)}", status=401)

    # 3. Rate Limiting Check
    user_ref = get_db().collection("users").document(uid)
    user_doc = user_ref.get()

    now = datetime.datetime.now(datetime.timezone.utc)

    if user_doc.exists:
        user_data = user_doc.to_dict()
        last_request = user_data.get("last_request_timestamp")

        if last_request:
            if isinstance(last_request, datetime.datetime):
                time_diff = (now - last_request).total_seconds()
                if time_diff < 10:
                    return https_fn.Response("Too Many Requests: Please wait 10 seconds.", status=429)

    # Set timestamp immediately to prevent race conditions during generation
    user_ref.set({
        "email": decoded_token.get("email"),
        "last_request_timestamp": now
    }, merge=True)

    # 4. Parse Request Body
    data = req.get_json() or {}
    week = data.get("week")
    ingredients = data.get("ingredients")

    if not week or not ingredients:
         return https_fn.Response("Bad Request: Missing 'week' or 'ingredients'", status=400)

    # 5. RAG Retrieval
    week_doc_id = f"week_{week}"
    rules_ref = get_db().collection("diet_rules").document(week_doc_id)
    rules_doc = rules_ref.get()

    if not rules_doc.exists:
        return https_fn.Response(f"Configuration Error: Diet rules for week {week} not found.", status=500)

    rules_data = rules_doc.to_dict()
    allowed = ", ".join(rules_data.get("allowed_ingredients", []))
    forbidden = ", ".join(rules_data.get("forbidden_ingredients", []))
    rules_text = rules_data.get("rules_text", "")

    # 6. Augmentation & Generation
    system_instruction = (
        f"You are a nutritional expert for the Switch-On Diet. "
        f"Rules for Week {week}: {rules_text}. "
        f"Use ONLY: {allowed}. "
        f"Strictly avoid: {forbidden}. "
        f"User available ingredients: {ingredients}. "
        f"Generate a recipe in JSON format with fields: title, ingredients (list), instructions (list), macros (map)."
    )

    try:
        if not GOOGLE_API_KEY:
            return https_fn.Response("Configuration Error: Missing GOOGLE_API_KEY", status=500)

        model = genai.GenerativeModel("gemini-2.5-pro")

        response = model.generate_content(
            system_instruction,
            generation_config={"response_mime_type": "application/json"}
        )

        if not response.text:
             raise ValueError("Empty response from AI")

        recipe_json = response.text
        return https_fn.Response(recipe_json, status=200, headers={"Content-Type": "application/json"})

    except Exception as e:
        return https_fn.Response(f"AI Generation Error: {str(e)}", status=500)


# --- Ingredient Functions ---

@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET", "OPTIONS"],
    )
)
def search_ingredients(req: https_fn.Request) -> https_fn.Response:
    """Search ingredients by name prefix."""
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)

    if req.method != "GET":
        return https_fn.Response("Method not allowed", status=405)

    try:
        uid, _ = verify_auth(req)
    except ValueError as e:
        return https_fn.Response(str(e), status=401)
    except Exception as e:
        return https_fn.Response(f"Unauthorized: Invalid token. {str(e)}", status=401)

    q = req.args.get("q", "").strip().lower()
    if not q:
        return https_fn.Response(
            json.dumps({"error": "Query parameter 'q' is required"}),
            status=400,
            headers={"Content-Type": "application/json"},
        )

    db = get_db()
    results = (
        db.collection("ingredients")
        .where("name", ">=", q)
        .where("name", "<", q + "\uf8ff")
        .limit(20)
        .stream()
    )

    ingredients = []
    for doc in results:
        data = doc.to_dict()
        data["id"] = doc.id
        # Convert timestamps to ISO strings for JSON serialization
        if "created_at" in data and data["created_at"]:
            data["created_at"] = data["created_at"].isoformat()
        ingredients.append(data)

    return https_fn.Response(
        json.dumps(ingredients),
        status=200,
        headers={"Content-Type": "application/json"},
    )


@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST", "OPTIONS"],
    )
)
def add_ingredient(req: https_fn.Request) -> https_fn.Response:
    """Add a new ingredient to the global database."""
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)

    if req.method != "POST":
        return https_fn.Response("Method not allowed", status=405)

    try:
        uid, _ = verify_auth(req)
    except ValueError as e:
        return https_fn.Response(str(e), status=401)
    except Exception as e:
        return https_fn.Response(f"Unauthorized: Invalid token. {str(e)}", status=401)

    data = req.get_json() or {}
    name = data.get("name", "").strip().lower()
    name_ko = data.get("name_ko", "").strip()
    category = data.get("category", "other").strip().lower()

    if not name:
        return https_fn.Response(
            json.dumps({"error": "Field 'name' is required"}),
            status=400,
            headers={"Content-Type": "application/json"},
        )

    valid_categories = {"protein", "vegetable", "fruit", "grain", "dairy", "spice", "other"}
    if category not in valid_categories:
        category = "other"

    db = get_db()

    # Check for existing ingredient with the same name
    existing = (
        db.collection("ingredients")
        .where("name", "==", name)
        .limit(1)
        .stream()
    )
    if any(True for _ in existing):
        return https_fn.Response(
            json.dumps({"error": f"Ingredient '{name}' already exists"}),
            status=409,
            headers={"Content-Type": "application/json"},
        )

    doc_ref = db.collection("ingredients").document()
    doc_data = {
        "name": name,
        "name_ko": name_ko,
        "category": category,
        "created_by": uid,
        "created_at": google_firestore.SERVER_TIMESTAMP,
    }
    doc_ref.set(doc_data)

    # Return the created doc (with id, without server timestamp)
    doc_data["id"] = doc_ref.id
    doc_data["created_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

    return https_fn.Response(
        json.dumps(doc_data),
        status=201,
        headers={"Content-Type": "application/json"},
    )


@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["PUT", "OPTIONS"],
    )
)
def update_ingredient(req: https_fn.Request) -> https_fn.Response:
    """Update an existing ingredient."""
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)

    if req.method != "PUT":
        return https_fn.Response("Method not allowed", status=405)

    try:
        uid, _ = verify_auth(req)
    except ValueError as e:
        return https_fn.Response(str(e), status=401)
    except Exception as e:
        return https_fn.Response(f"Unauthorized: Invalid token. {str(e)}", status=401)

    data = req.get_json() or {}
    doc_id = data.get("id", "").strip()
    name = data.get("name", "").strip().lower()
    name_ko = data.get("name_ko", "").strip()
    category = data.get("category", "").strip().lower()

    if not doc_id:
        return https_fn.Response(
            json.dumps({"error": "Field 'id' is required"}),
            status=400,
            headers={"Content-Type": "application/json"},
        )

    db = get_db()
    doc_ref = db.collection("ingredients").document(doc_id)
    doc = doc_ref.get()

    if not doc.exists:
        return https_fn.Response(
            json.dumps({"error": "Ingredient not found"}),
            status=404,
            headers={"Content-Type": "application/json"},
        )

    doc_data = doc.to_dict()
    created_by = doc_data.get("created_by", "")

    # Only allow update if user created it or it's a system ingredient
    if created_by != uid and created_by != "system":
        return https_fn.Response(
            json.dumps({"error": "Forbidden: You can only update your own or system ingredients"}),
            status=403,
            headers={"Content-Type": "application/json"},
        )

    update_fields = {}
    if name:
        update_fields["name"] = name
    if name_ko:
        update_fields["name_ko"] = name_ko
    if category:
        valid_categories = {"protein", "vegetable", "fruit", "grain", "dairy", "spice", "other"}
        if category in valid_categories:
            update_fields["category"] = category

    if not update_fields:
        return https_fn.Response(
            json.dumps({"error": "No valid fields to update"}),
            status=400,
            headers={"Content-Type": "application/json"},
        )

    doc_ref.update(update_fields)

    # Return updated doc
    updated = doc_ref.get().to_dict()
    updated["id"] = doc_id
    if "created_at" in updated and updated["created_at"]:
        updated["created_at"] = updated["created_at"].isoformat()

    return https_fn.Response(
        json.dumps(updated),
        status=200,
        headers={"Content-Type": "application/json"},
    )


# --- Personal Ingredient List Functions ---

@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET", "OPTIONS"],
    )
)
def get_ingredient_list(req: https_fn.Request) -> https_fn.Response:
    """Fetch all ingredients in the user's personal list."""
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)

    if req.method != "GET":
        return https_fn.Response("Method not allowed", status=405)

    try:
        uid, _ = verify_auth(req)
    except ValueError as e:
        return https_fn.Response(str(e), status=401)
    except Exception as e:
        return https_fn.Response(f"Unauthorized: Invalid token. {str(e)}", status=401)

    db = get_db()
    docs = (
        db.collection("users").document(uid)
        .collection("ingredient_list")
        .order_by("added_at", direction=google_firestore.Query.DESCENDING)
        .stream()
    )

    items = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        if "added_at" in data and data["added_at"]:
            data["added_at"] = data["added_at"].isoformat()
        items.append(data)

    return https_fn.Response(
        json.dumps(items),
        status=200,
        headers={"Content-Type": "application/json"},
    )


@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST", "OPTIONS"],
    )
)
def add_to_ingredient_list(req: https_fn.Request) -> https_fn.Response:
    """Add an ingredient to the user's personal list."""
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)

    if req.method != "POST":
        return https_fn.Response("Method not allowed", status=405)

    try:
        uid, _ = verify_auth(req)
    except ValueError as e:
        return https_fn.Response(str(e), status=401)
    except Exception as e:
        return https_fn.Response(f"Unauthorized: Invalid token. {str(e)}", status=401)

    data = req.get_json() or {}
    ingredient_id = data.get("ingredient_id", "").strip()
    name = data.get("name", "").strip()
    name_ko = data.get("name_ko", "").strip()
    category = data.get("category", "other").strip()
    quantity = data.get("quantity", "").strip()

    if not ingredient_id or not name:
        return https_fn.Response(
            json.dumps({"error": "Fields 'ingredient_id' and 'name' are required"}),
            status=400,
            headers={"Content-Type": "application/json"},
        )

    db = get_db()
    user_list_ref = db.collection("users").document(uid).collection("ingredient_list")

    # Check for duplicate ingredient_id
    existing = (
        user_list_ref
        .where("ingredient_id", "==", ingredient_id)
        .limit(1)
        .stream()
    )
    if any(True for _ in existing):
        return https_fn.Response(
            json.dumps({"error": "Ingredient already in your list"}),
            status=409,
            headers={"Content-Type": "application/json"},
        )

    doc_ref = user_list_ref.document()
    doc_data = {
        "ingredient_id": ingredient_id,
        "name": name,
        "name_ko": name_ko,
        "category": category,
        "quantity": quantity,
        "added_at": google_firestore.SERVER_TIMESTAMP,
    }
    doc_ref.set(doc_data)

    doc_data["id"] = doc_ref.id
    doc_data["added_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

    return https_fn.Response(
        json.dumps(doc_data),
        status=201,
        headers={"Content-Type": "application/json"},
    )


@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["DELETE", "OPTIONS"],
    )
)
def remove_from_ingredient_list(req: https_fn.Request) -> https_fn.Response:
    """Remove an ingredient from the user's personal list."""
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)

    if req.method != "DELETE":
        return https_fn.Response("Method not allowed", status=405)

    try:
        uid, _ = verify_auth(req)
    except ValueError as e:
        return https_fn.Response(str(e), status=401)
    except Exception as e:
        return https_fn.Response(f"Unauthorized: Invalid token. {str(e)}", status=401)

    data = req.get_json() or {}
    doc_id = data.get("id", "").strip()

    if not doc_id:
        return https_fn.Response(
            json.dumps({"error": "Field 'id' is required"}),
            status=400,
            headers={"Content-Type": "application/json"},
        )

    db = get_db()
    doc_ref = (
        db.collection("users").document(uid)
        .collection("ingredient_list").document(doc_id)
    )
    doc_ref.delete()

    return https_fn.Response(
        json.dumps({"success": True}),
        status=200,
        headers={"Content-Type": "application/json"},
    )
