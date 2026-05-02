import pytest
from unittest.mock import MagicMock, patch

@pytest.fixture(autouse=True)
def mock_vertex_ai():
    with patch("vertexai.generative_models.GenerativeModel.generate_content") as mock_method:
        mock_response = MagicMock()
        mock_response.text = '{"tasks": [{"id": 1, "text": "Mock Task"}]}'
        mock_method.return_value = mock_response
        yield mock_method
        
import json
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_generate_tasks_success(monkeypatch):
    """Test a successful task generation call with a valid prompt."""
    
    # Mock the cached_generate_text_tasks function to avoid real API calls
    def mock_generate(*args, **kwargs):
        mock_response = [
            {"title": "Task 1", "description": "Description 1", "status": "todo"},
            {"title": "Task 2", "description": "Description 2", "status": "todo"}
        ]
        return json.dumps(mock_response)
        
    monkeypatch.setattr("backend.main.cached_generate_text_tasks", mock_generate)
    
    response = client.post("/api/generate-tasks", json={"prompt": "Test marketing campaign"})
    assert response.status_code == 200
    data = response.json()
    assert "tasks" in data
    assert len(data["tasks"]) == 2
    assert data["tasks"][0]["title"] == "Task 1"

def test_generate_tasks_empty():
    """Test that an empty prompt fails Pydantic validation (min_length=1)."""
    response = client.post("/api/generate-tasks", json={"prompt": ""})
    assert response.status_code == 422 # Unprocessable Entity
    
    errors = response.json().get("detail", [])
    assert any("String should have at least 1 character" in error.get("msg", "") for error in errors)

def test_generate_tasks_oversized():
    """Test that an oversized prompt fails Pydantic validation (max_length=1000)."""
    oversized_prompt = "A" * 1001
    response = client.post("/api/generate-tasks", json={"prompt": oversized_prompt})
    assert response.status_code == 422
    
    errors = response.json().get("detail", [])
    assert any("String should have at most 1000 characters" in error.get("msg", "") for error in errors)
