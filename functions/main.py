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
        f"Generate a recipe in STRICT JSON format with the following fields:\n"
        f"- title: string\n"
        f"- health_benefit: string (short subtitle)\n"
        f"- ingredients: list of strings\n"
        f"- instructions: list of strings\n"
        f"- macros: object {{ calories: string, protein: string, carbs: string, fat: string }}\n"
        f"- prep_time: string\n"
        f"- cook_time: string\n"
        f"- servings: string\n"
        f"- wellness_tip: string (custom tip for Week {week})\n"
        f"Ensure values are concise/numeric where appropriate."
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


# --- Shopping List Functions ---

@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST", "OPTIONS"],
    )
)
def get_shopping_list(req: https_fn.Request) -> https_fn.Response:
    """
    Compares recipe ingredients against the user's personal inventory.
    Categorizes items into 'have' and 'need_to_buy'.
    """
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)

    if req.method != "POST":
        return https_fn.Response("Method not allowed", status=405)

    # 1. Authentication
    try:
        uid, _ = verify_auth(req)
    except ValueError as e:
        return https_fn.Response(str(e), status=401)
    except Exception as e:
        return https_fn.Response(f"Unauthorized: Invalid token. {str(e)}", status=401)

    # 2. Parse Input
    data = req.get_json() or {}
    recipe_ingredients = data.get("recipe_ingredients", [])

    if not isinstance(recipe_ingredients, list):
        return https_fn.Response(
            json.dumps({"error": "Field 'recipe_ingredients' must be a list"}),
            status=400,
            headers={"Content-Type": "application/json"},
        )

    # 3. Retrieve User Inventory
    db = get_db()
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()
    
    user_ingredients = []
    if user_doc.exists:
        user_data = user_doc.to_dict()
        # US-1/US-7: ingredient_list is an array of strings
        raw_list = user_data.get("ingredient_list", [])
        if isinstance(raw_list, list):
            user_ingredients = [str(x).lower().strip() for x in raw_list]

    # 4. Comparison Logic
    have = []
    need_to_buy = []

    for recipe_ing in recipe_ingredients:
        recipe_ing_clean = recipe_ing.lower().strip()
        
        found = False
        for user_ing_name in user_ingredients:
            # Check if user's ingredient name is part of the recipe string 
            # (e.g., "chicken" is in "300g chicken breast")
            if user_ing_name and user_ing_name in recipe_ing_clean:
                found = True
                break
        
        if found:
            have.append(recipe_ing)
        else:
            need_to_buy.append(recipe_ing)

    # 5. Response
    return https_fn.Response(
        json.dumps({
            "have": have,
            "need_to_buy": need_to_buy
        }),
        status=200,
        headers={"Content-Type": "application/json"}
    )


# --- Favorites CRUD (US-6) ---

@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST", "OPTIONS"],
    )
)
def save_favorite(req: https_fn.Request) -> https_fn.Response:
    """
    Saves a recipe to the user's favorites sub-collection.
    Expects JSON body: { recipe_title, recipe_content, week }
    """
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)

    if req.method != "POST":
        return https_fn.Response("Method not allowed", status=405)

    # Auth
    try:
        uid, _ = verify_auth(req)
    except ValueError as e:
        return https_fn.Response(str(e), status=401)
    except Exception as e:
        return https_fn.Response(f"Unauthorized: Invalid token. {str(e)}", status=401)

    # Parse body
    data = req.get_json() or {}
    recipe_title = data.get("recipe_title")
    recipe_content = data.get("recipe_content")
    week = data.get("week")

    if not recipe_title or not recipe_content:
        return https_fn.Response(
            json.dumps({"error": "Missing 'recipe_title' or 'recipe_content'"}),
            status=400,
            headers={"Content-Type": "application/json"},
        )

    # Save to Firestore
    db = get_db()
    fav_ref = db.collection("users").document(uid).collection("favorites")

    # Check for duplicate title to prevent accidental re-saves
    existing = fav_ref.where("recipe_title", "==", recipe_title).limit(1).get()
    if len(list(existing)) > 0:
        return https_fn.Response(
            json.dumps({"error": "Recipe already saved to favorites"}),
            status=409,
            headers={"Content-Type": "application/json"},
        )

    now = datetime.datetime.now(datetime.timezone.utc)
    doc_ref = fav_ref.add({
        "recipe_title": recipe_title,
        "recipe_content": recipe_content,
        "week": week,
        "created_at": now,
    })

    return https_fn.Response(
        json.dumps({"id": doc_ref[1].id, "message": "Favorite saved"}),
        status=201,
        headers={"Content-Type": "application/json"},
    )


@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET", "OPTIONS"],
    )
)
def get_favorites(req: https_fn.Request) -> https_fn.Response:
    """
    Returns all favorites for the authenticated user, ordered by created_at descending.
    """
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)

    if req.method != "GET":
        return https_fn.Response("Method not allowed", status=405)

    # Auth
    try:
        uid, _ = verify_auth(req)
    except ValueError as e:
        return https_fn.Response(str(e), status=401)
    except Exception as e:
        return https_fn.Response(f"Unauthorized: Invalid token. {str(e)}", status=401)

    # Fetch favorites
    db = get_db()
    fav_ref = db.collection("users").document(uid).collection("favorites")
    docs = fav_ref.order_by("created_at", direction=google_firestore.Query.DESCENDING).get()

    favorites = []
    for doc in docs:
        fav_data = doc.to_dict()
        # Convert Firestore timestamp for JSON serialization
        created_at = fav_data.get("created_at")
        if created_at and hasattr(created_at, "isoformat"):
            fav_data["created_at"] = created_at.isoformat()
        fav_data["id"] = doc.id
        favorites.append(fav_data)

    return https_fn.Response(
        json.dumps({"favorites": favorites}),
        status=200,
        headers={"Content-Type": "application/json"},
    )


@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["POST", "OPTIONS"],
    )
)
def delete_favorite(req: https_fn.Request) -> https_fn.Response:
    """
    Deletes a specific favorite by its document ID.
    Expects JSON body: { favorite_id }
    Using POST instead of DELETE for broad CORS compatibility.
    """
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)

    if req.method != "POST":
        return https_fn.Response("Method not allowed", status=405)

    # Auth
    try:
        uid, _ = verify_auth(req)
    except ValueError as e:
        return https_fn.Response(str(e), status=401)
    except Exception as e:
        return https_fn.Response(f"Unauthorized: Invalid token. {str(e)}", status=401)

    # Parse body
    data = req.get_json() or {}
    favorite_id = data.get("favorite_id")

    if not favorite_id:
        return https_fn.Response(
            json.dumps({"error": "Missing 'favorite_id'"}),
            status=400,
            headers={"Content-Type": "application/json"},
        )

    # Delete from Firestore
    db = get_db()
    fav_doc_ref = db.collection("users").document(uid).collection("favorites").document(favorite_id)
    doc = fav_doc_ref.get()

    if not doc.exists:
        return https_fn.Response(
            json.dumps({"error": "Favorite not found"}),
            status=404,
            headers={"Content-Type": "application/json"},
        )

    fav_doc_ref.delete()

    return https_fn.Response(
        json.dumps({"message": "Favorite deleted"}),
        status=200,
        headers={"Content-Type": "application/json"},
    )
