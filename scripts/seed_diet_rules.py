import firebase_admin
from firebase_admin import credentials, firestore

# Initialize with the service account
cred = credentials.Certificate("switchon-recipe-maker-2aecb8837fec.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

diet_rules = {
    "week_1": {
        "allowed_ingredients": ["chicken breast", "white fish", "tofu", "cucumber", "broccoli", "leafy greens", "protein powder"],
        "forbidden_ingredients": ["rice", "bread", "pasta", "fruit", "beef", "pork", "dairy"],
        "rules_text": "Week 1 is strict protein and fiber only. No carbs, no sugar, no fatty meats. 4 meals a day. Protein shake allowed."
    },
    "week_2": {
        "allowed_ingredients": ["chicken breast", "lean beef", "salmon", "berries", "brown rice (lunch only)", "nuts"],
        "forbidden_ingredients": ["white flour", "sugar", "fried food"],
        "rules_text": "Week 2 introduces healthy fats and limited low-GI carbs at lunch. Intermittent fasting 14:10."
    },
    "week_3": {
        "allowed_ingredients": ["all lean meats", "fruits (limited)", "sweed potato", "oats", "avocado"],
        "forbidden_ingredients": ["sugar", "alcohol", "processed snacks"],
        "rules_text": "Week 3 allows more carb variety. Focus on metabolic flexibility. 24h fast once a week."
    },
    "week_4": {
        "allowed_ingredients": ["everything healthy"],
        "forbidden_ingredients": ["junk food", "excessive sugar"],
        "rules_text": "Maintenance phase. 3 meals a day, general healthy eating."
    }
}

def seed_data():
    collection_ref = db.collection("diet_rules")
    for doc_id, data in diet_rules.items():
        print(f"Seeding {doc_id}...")
        collection_ref.document(doc_id).set(data)
    print("Done!")

if __name__ == "__main__":
    seed_data()
