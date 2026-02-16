import datetime
import json
import os
import google.generativeai as genai
from firebase_admin import initialize_app, firestore, auth, app_check
from firebase_functions import https_fn, options
from google.cloud import firestore as google_firestore

# Initialize Firebase Admin
# When running locally without the Firestore emulator, we need a service account
service_account_path = "../switchon-recipe-maker-2aecb8837fec.json"
if os.path.exists(service_account_path):
    from firebase_admin import credentials
    cred = credentials.Certificate(service_account_path)
    initialize_app(cred)
else:
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

def verify_auth(req, optional=False):
    """Verify Firebase ID token from the Authorization header.

    Returns (uid, decoded_token) on success, or (None, None) if optional.
    Raises ValueError with an error message on failure.
    """
    auth_header = req.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        if optional:
            return None, None
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

    # 1. App Check Verification
    app_check_token = req.headers.get("X-Firebase-App-Check")
    if not app_check_token:
         # Optional: Allow skipping in emulator if needed, but safer to enforce
         # if "FUNCTIONS_EMULATOR" not in os.environ:
         return https_fn.Response("Unauthorized: Missing App Check token", status=401)
    
    try:
        app_check.verify_token(app_check_token)
    except Exception as e:
        return https_fn.Response(f"Unauthorized: Invalid App Check token. {str(e)}", status=401)

    # 2. Authentication (Optional for recipe generation)
    try:
        uid, decoded_token = verify_auth(req, optional=True)
    except Exception as e:
        return https_fn.Response(f"Unauthorized: Invalid token. {str(e)}", status=401)

    # 3. Rate Limiting Check (Only for authenticated users)
    if uid:
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
            "email": decoded_token.get("email") if decoded_token else None,
            "last_request_timestamp": now
        }, merge=True)

    # 4. Parse Request Body
    data = req.get_json() or {}
    week = data.get("week")
    ingredients = data.get("ingredients")

    if not week:
         return https_fn.Response("Bad Request: Missing 'week'", status=400)

    # Use empty string if ingredients is missing (Chef mode)
    if ingredients is None:
        ingredients = ""

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
    # Refined prompt for better compliance with user ingredients while respecting rules
    system_instruction = (
        f"You are a nutritional expert for the Switch-On Diet. "
        f"Goal: Generate a healthy recipe for Week {week} of the diet.\n\n"
        f"DIETARY RULES FOR WEEK {week}:\n"
        f"- Core Principle: {rules_text}\n"
        f"- Allowed Ingredients: {allowed}\n"
        f"- FORBIDDEN (Do NOT use): {forbidden}\n\n"
        f"USER'S AVAILABLE INGREDIENTS: {ingredients}\n\n"
        f"INSTRUCTIONS:\n"
        f"1. PRIORITIZE using the ingredients the user has provided, but ONLY if they are allowed in Week {week}.\n"
        f"2. If the user's ingredients are not allowed or are insufficient, you MUST supplement or replace them with other 'Allowed Ingredients' to create a complete, valid Switch-On Diet meal.\n"
        f"3. Generate exactly ONE recipe as a SINGLE JSON object (NOT an array) with exactly these fields:\n"
        f"   - title (string): Creative recipe name.\n"
        f"   - health_benefit (string): One-line summary of why it fits the phase.\n"
        f"   - ingredients (array of strings): List of specific ingredients.\n"
        f"   - instructions (array of strings): Numbered step-by-step guide.\n"
        f"   - macros (object): {{\"calories\": number or string, \"protein\": string, \"carbs\": string, \"fat\": string}}.\n"
        f"   - prep_time (string), cook_time (string), servings (string).\n"
        f"   - wellness_tip (string): A short motivational or diet-related tip.\n"
        f"4. MANDATORY: The 'ingredients' and 'instructions' fields MUST BE ARRAYS OF STRINGS. Do NOT return them as single strings or comma-separated text.\n"
        f"5. Do NOT wrap the entire response in an array. Ensure the response is valid JSON."
    )

    # Added logging for debugging
    print(f"Generating recipe for Week {week}. User has: {ingredients}. Allowed: {allowed[:50]}...")

    try:
        if not GOOGLE_API_KEY:
            return https_fn.Response("Configuration Error: Missing GOOGLE_API_KEY", status=500)

        model = genai.GenerativeModel("gemini-2.0-flash")

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
