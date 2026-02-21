import json
import os
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize with the service account
# Ensure we're pointing to the correct file location relative to where the script is run
# Assuming script is run from project root
cred_path = "switchon-recipe-maker-2aecb8837fec.json"
if not os.path.exists(cred_path):
    # Try looking in parent directory if run from scripts/
    if os.path.exists(f"../{cred_path}"):
        cred_path = f"../{cred_path}"

cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)

db = firestore.client()

def seed_data():
    file_path = 'diet-rules.json'
    if not os.path.exists(file_path):
        if os.path.exists(f"../{file_path}"):
            file_path = f"../{file_path}"
            
    with open(file_path, 'r') as f:
        diet_rules = json.load(f)

    batch = db.batch()
    collection_ref = db.collection("diet_rules")

    for rule in diet_rules:
        doc_id = rule.get('id')
        if not doc_id:
            continue
            
        # exclude 'id' from the data stored in the document
        doc_data = {k: v for k, v in rule.items() if k != 'id'}
        
        doc_ref = collection_ref.document(doc_id)
        batch.set(doc_ref, doc_data)
        print(f"Added {doc_id} to batch...")

    batch.commit()
    print("Done!")

if __name__ == "__main__":
    seed_data()
