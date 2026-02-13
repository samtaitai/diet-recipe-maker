import json
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize with the service account
cred = credentials.Certificate("switchon-recipe-maker-2aecb8837fec.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

# Korean translations and categories for seed ingredients
INGREDIENT_META = {
    "tofu": {"name_ko": "두부", "category": "protein"},
    "chicken breast": {"name_ko": "닭가슴살", "category": "protein"},
    "white fish": {"name_ko": "흰살생선", "category": "protein"},
    "leafy greens": {"name_ko": "잎채소", "category": "vegetable"},
    "broccoli": {"name_ko": "브로콜리", "category": "vegetable"},
    "mushrooms": {"name_ko": "버섯", "category": "vegetable"},
    "cucumbers": {"name_ko": "오이", "category": "vegetable"},
    "plain yogurt (low fat)": {"name_ko": "저지방 플레인 요거트", "category": "dairy"},
    "protein powder": {"name_ko": "프로틴 파우더", "category": "protein"},
    "beef (lean)": {"name_ko": "소고기 (저지방)", "category": "protein"},
    "pork (lean)": {"name_ko": "돼지고기 (저지방)", "category": "protein"},
    "brown rice": {"name_ko": "현미", "category": "grain"},
    "sweet potato": {"name_ko": "고구마", "category": "grain"},
    "all green vegetables": {"name_ko": "모든 녹색 채소", "category": "vegetable"},
    "eggs": {"name_ko": "달걀", "category": "protein"},
    "blueberries": {"name_ko": "블루베리", "category": "fruit"},
    "nuts": {"name_ko": "견과류", "category": "other"},
    "whole grain bread": {"name_ko": "통곡물 빵", "category": "grain"},
}

# Normalize ingredient names from diet-rules.json to our canonical names
NORMALIZE_MAP = {
    "brown rice (half bowl)": "brown rice",
    "sweet potato (small)": "sweet potato",
    "nuts (limited)": "nuts",
}

# Non-ingredient entries to skip
SKIP_ENTRIES = {
    "all ingredients from week 2",
    "all ingredients from week 3",
    "most whole foods",
    "moderate fruit",
}


def load_ingredients_from_diet_rules():
    """Extract and deduplicate ingredients from diet-rules.json."""
    with open("diet-rules.json", "r") as f:
        weeks = json.load(f)

    seen = set()
    ingredients = []

    for week in weeks:
        for item in week.get("allowed_ingredients", []):
            normalized = NORMALIZE_MAP.get(item, item)

            if normalized in SKIP_ENTRIES:
                continue
            if normalized in seen:
                continue

            seen.add(normalized)

            meta = INGREDIENT_META.get(normalized, {})
            ingredients.append({
                "name": normalized,
                "name_ko": meta.get("name_ko", ""),
                "category": meta.get("category", "other"),
            })

    return ingredients


def seed_data():
    ingredients = load_ingredients_from_diet_rules()
    collection_ref = db.collection("ingredients")

    for ing in ingredients:
        print(f"Seeding '{ing['name']}'...")
        collection_ref.add({
            "name": ing["name"],
            "name_ko": ing["name_ko"],
            "category": ing["category"],
            "created_by": "system",
            "created_at": firestore.SERVER_TIMESTAMP,
        })

    print(f"Done! Seeded {len(ingredients)} ingredients.")


if __name__ == "__main__":
    seed_data()
