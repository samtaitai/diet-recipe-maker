from unittest.mock import Mock, patch
import pytest
from main import generate_recipe

@patch("main.auth")
@patch("main.db")
@patch("main.genai")
def test_generate_recipe_unauthorized(mock_genai, mock_db, mock_auth):
    # Setup request without token
    req = Mock(method="POST")
    req.headers = {}
    
    # Call
    res = generate_recipe(req)
    
    # Assert
    assert res.status_code == 401
    assert "Unauthorized" in res.data.decode()

@patch("main.auth")
@patch("main.db")
@patch("main.genai")
def test_generate_recipe_success(mock_genai, mock_db, mock_auth):
    # Setup mocks
    mock_auth.verify_id_token.return_value = {"uid": "test_uid", "email": "test@example.com"}
    
    mock_user_doc = Mock()
    mock_user_doc.exists = False # No previous request
    mock_db.collection.return_value.document.return_value.get.return_value = mock_user_doc
    
    mock_rules_doc = Mock()
    mock_rules_doc.exists = True
    mock_rules_doc.to_dict.return_value = {
        "allowed_ingredients": ["a"],
        "forbidden_ingredients": ["b"],
        "rules_text": "rules"
    }
    # Mock retrieval of rules (week_1)
    # Note: The code calls db.collection("diet_rules").document(...) 
    # and db.collection("users").document(...)
    # We need to be careful with side_effect if we want distinct returns.
    
    def firestore_side_effect(collection_name):
        doc_mock = Mock()
        if collection_name == "users":
            doc_mock.document.return_value.get.return_value = mock_user_doc
        elif collection_name == "diet_rules":
            doc_mock.document.return_value.get.return_value = mock_rules_doc
        return doc_mock
        
    mock_db.collection.side_effect = firestore_side_effect

    mock_model = Mock()
    mock_genai.GenerativeModel.return_value = mock_model
    mock_model.generate_content.return_value.text = '{"title": "Test Recipe"}'
    
    # Setup request
    req = Mock(method="POST")
    req.headers = {"Authorization": "Bearer valid_token"}
    req.get_json.return_value = {"week": 1, "ingredients": "chicken"}
    
    # Call
    res = generate_recipe(req)
    
    # Assert
    assert res.status_code == 200
    assert '{"title": "Test Recipe"}' in res.data.decode()
