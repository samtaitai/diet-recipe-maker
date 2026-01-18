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

@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=["*"],  # Allow all origins for now, or restrictive
        cors_methods=["POST", "OPTIONS"],
    )
)
def generate_recipe(req: https_fn.Request) -> https_fn.Response:
    """
    Generates a recipe based on dietary rules and user ingredients.
    Verifies Auth token and enforces rate limiting.
    """
    # 1. CORS Preflight (handled by cors=options.CorsOptions, but sometimes needed explicitly if issues arise)
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)

    if req.method != "POST":
        return https_fn.Response("Method not allowed", status=405)

    # 2. Authentication
    auth_header = req.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return https_fn.Response("Unauthorized: Missing or invalid token", status=401)
    
    id_token = auth_header.split("Bearer ")[1]
    
    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token["uid"]
    except Exception as e:
        return https_fn.Response(f"Unauthorized: Invalid token. {str(e)}", status=401)

    # 3. Rate Limiting
    # Fetch users/{uid}
    user_ref = get_db().collection("users").document(uid)
    user_doc = user_ref.get()
    
    now = datetime.datetime.now(datetime.timezone.utc)
    
    if user_doc.exists:
        user_data = user_doc.to_dict()
        last_request = user_data.get("last_request_timestamp")
        
        if last_request:
            # Timestamp in Firestore is usually a datetime object
            # If it's pure python datetime
             time_diff = (now - last_request).total_seconds()
             if time_diff < 10:
                 return https_fn.Response("Too Many Requests: Please wait 10 seconds.", status=429)

    # Update timestamp (we do this at the end or now? TDD says "Update: Set last_request_timestamp to now". Usually on success)
    # But to prevent spamming while generating, maybe update now? TDD says step 5.
    # I'll stick to step 5.

    # 4. Parse Request Body
    try:
        data = req.get_json()
        week = data.get("week")
        ingredients = data.get("ingredients")
        
        if not week or not ingredients:
             return https_fn.Response("Bad Request: Missing 'week' or 'ingredients'", status=400)
    except Exception:
        return https_fn.Response("Bad Request: Invalid JSON", status=400)

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
        model = genai.GenerativeModel("gemini-2.5-pro")
        # Using Gemini 2.0 Flash as specified in TDD
        
        response = model.generate_content(
            system_instruction,
            generation_config={"response_mime_type": "application/json"}
        )
        
        recipe_json = response.text
        
        # Validate JSON
        # json.loads(recipe_json) 
    except Exception as e:
        return https_fn.Response(f"AI Generation Error: {str(e)}", status=500)

    # 7. Update User Timestamp
    user_ref.set({
        "email": decoded_token.get("email"),
        "last_request_timestamp": now
    }, merge=True)

    return https_fn.Response(recipe_json, status=200, headers={"Content-Type": "application/json"})
