from unittest.mock import Mock, patch, MagicMock
import pytest
import json
from flask import Flask

# Create a dummy Flask app for context
app = Flask(__name__)

# Import main functions
from main import generate_recipe

@pytest.fixture
def app_context():
    with app.test_request_context():
        yield



@patch("main.verify_auth")
@patch("main.get_db")
@patch("main.genai")
def test_generate_recipe_unauthorized(mock_genai, mock_get_db, mock_verify_auth, app_context):
    mock_verify_auth.side_effect = ValueError("Unauthorized")
    req = Mock(method="POST")
    req.headers = {}
    
    res = generate_recipe(req)
    
    assert res.status_code == 401
    assert "Unauthorized" in res.data.decode()

@patch("main.verify_auth")
@patch("main.get_db")
@patch("main.genai")
@patch("main.GOOGLE_API_KEY", "test_key")
def test_generate_recipe_success(mock_genai, mock_get_db, mock_verify_auth, app_context):
    # Setup mocks
    mock_verify_auth.return_value = ("test_uid", {"email": "test@example.com"})
    
    mock_db = MagicMock()
    mock_get_db.return_value = mock_db
    
    mock_user_doc = MagicMock()
    mock_user_doc.exists = False
    
    mock_rules_doc = MagicMock()
    mock_rules_doc.exists = True
    mock_rules_doc.to_dict.return_value = {
        "allowed_ingredients": ["a"],
        "forbidden_ingredients": ["b"],
        "rules_text": "rules"
    }
    
    def firestore_side_effect(collection_name):
        coll_mock = MagicMock()
        if collection_name == "users":
            coll_mock.document.return_value.get.return_value = mock_user_doc
        elif collection_name == "diet_rules":
            coll_mock.document.return_value.get.return_value = mock_rules_doc
        return coll_mock
        
    mock_db.collection.side_effect = firestore_side_effect

    mock_model = MagicMock()
    mock_genai.GenerativeModel.return_value = mock_model
    mock_model.generate_content.return_value.text = json.dumps({
        "title": "Test Recipe", 
        "health_benefit": "Vitamin Boost",
        "ingredients": ["1 cup A"], 
        "instructions": ["Mix"],
        "macros": {"calories": "200", "protein": "10g", "carbs": "20g", "fat": "5g"},
        "prep_time": "10m",
        "cook_time": "20m",
        "servings": "2",
        "wellness_tip": "Stay hydrated"
    })
    
    # Setup request
    req = Mock(method="POST")
    req.headers = {"Authorization": "Bearer valid_token"}
    req.get_json.return_value = {"week": 1, "ingredients": "chicken"}
    
    # Call
    res = generate_recipe(req)
    
    # Assert
    assert res.status_code == 200
    response_data = json.loads(res.data.decode())
    assert response_data["title"] == "Test Recipe"
    assert response_data["health_benefit"] == "Vitamin Boost"
    assert "calories" in response_data["macros"]
