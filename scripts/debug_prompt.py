import os
import json
import google.generativeai as genai

# Manually read GOOGLE_API_KEY from functions/.env
with open("functions/.env", "r") as f:
    for line in f:
        if line.startswith("GOOGLE_API_KEY="):
            api_key = line.split("=")[1].strip().strip('"')
            os.environ["GOOGLE_API_KEY"] = api_key

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

def debug_prompt(week, ingredients):
    # Mock some data that would come from Firestore for Week 1
    if week == 1:
        rules_text = "Phase 1 (Week 1) focuses on resetting insulin sensitivity. Only 4 shakes/liquid meals and 1 solid meal consisting of protein and non-starchy vegetables are allowed. No carbohydrates or intense exercise."
        allowed = "tofu, chicken breast, white fish, leafy greens, broccoli, mushrooms, cucumbers, plain yogurt (low fat), protein powder"
        forbidden = "grains, legumes, fruit, potatoes, sugar, alcohol, caffeine, red meat"
    else:
        rules_text = "Phase 2 (Week 2) introduces a 'stimulus meal' (moderate carbs) for lunch. Intermittent fasting is started (14-16 hours). Red meat is now allowed if lean."
        allowed = "tofu, chicken breast, white fish, beef (lean), pork (lean), brown rice (half bowl), sweet potato (small), all green vegetables, eggs"
        forbidden = "sugar, alcohol, caffeine, processed flour, fried foods"

    system_instruction = (
        f"You are a nutritional expert for the Switch-On Diet. "
        f"Rules for Week {week}: {rules_text}. "
        f"Use ONLY: {allowed}. "
        f"Strictly avoid: {forbidden}. "
        f"User available ingredients: {ingredients}. "
        f"Generate exactly ONE recipe as a SINGLE JSON object (NOT an array) with exactly these fields:\n"
        f"- title: string\n"
        f"- health_benefit: string (short subtitle)\n"
        f"- ingredients: list of strings\n"
        f"- instructions: list of strings\n"
        f"- macros: object {{ calories: string, protein: string, carbs: string, fat: string }}\n"
        f"- prep_time: string\n"
        f"- cook_time: string\n"
        f"- servings: string\n"
        f"- wellness_tip: string (custom tip for Week {week})\n"
        f"Ensure values are concise/numeric where appropriate. Do NOT wrap the object in an array."
    )

    print(f"\n--- DEBUG: Week {week}, Ingredients: {ingredients} ---")
    model = genai.GenerativeModel("gemini-2.0-flash")
    
    try:
        response = model.generate_content(
            system_instruction,
            generation_config={"response_mime_type": "application/json"}
        )
        print(f"AI Selected Title: {json.loads(response.text).get('title')}")
        print(f"AI Selected Ingredients: {json.loads(response.text).get('ingredients')}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_prompt(1, "shrimp, egg")
    debug_prompt(2, "shrimp, egg")
    debug_prompt(2, "chicken, broccoli")
