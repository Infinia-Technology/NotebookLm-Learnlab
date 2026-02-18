
import asyncio
import os
import json
from pydantic import ValidationError
from app.modules.learning.schema import ModuleCreate

def test_validation():
    # Exactly what ModuleBuilder sends
    payload = {
        "title": "New Module",
        "description": "Desc",
        "content_type": "video",
        "content_url": "",
        "file_path": "",
        "order_index": 0,
        "estimated_duration": 30,
        "is_mandatory": False,
        "completion_criteria": { "min_watch_percent": 80 },
        "quiz_settings": {
            "passing_score": 80,
            "max_attempts": 3,
            "time_limit": 30,
            "randomize_questions": False
        },
        "assignment": {
            "enabled": False,
            "title": "",
            "instructions": "",
            "submission_type": "text",
            "requires_approval": True,
            "due_date": None # This is what I changed in the frontend
        },
        "course_uuid": "some-uuid"
    }
    
    print(f"Testing payload: {json.dumps(payload, indent=2)}")
    try:
        data = ModuleCreate(**payload)
        print("Validation SUCCESS")
    except ValidationError as e:
        print("Validation FAILURE:")
        print(e.json())

if __name__ == '__main__':
    test_validation()
