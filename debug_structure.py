import requests
import json
import uuid

BASE_URL = "http://localhost:8000"

def run():
    # 1. Signup new user to get fresh view
    email = f"debug_struct_{uuid.uuid4().hex[:8]}@example.com"
    password = "TestPass123!"
    
    # Auto-verify via Mongo first to ensure we can login
    try:
        from pymongo import MongoClient
        client = MongoClient("mongodb://app_admin:app_secure_pass@localhost:27017/app_database?authSource=admin")
        db = client["app_database"] 
        # Create user directly if signup is flaky or just use signup endpoint
    except Exception as e:
        print(f"Mongo connection failed: {e}")

    print(f"Signing up: {email}")
    requests.post(f"{BASE_URL}/api/auth/signup", json={
        "email": email, "password": password, "first_name": "Debug", "last_name": "User"
    })
    
    # Verify
    client["app_database"].users.update_one({"email": email}, {"$set": {"otp_verified": True, "status": "active"}})

    # Login
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    if resp.status_code != 200:
        print("Login failed")
        return
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Find "Certification Completion Demo" course
    resp = requests.get(f"{BASE_URL}/api/learning/courses", headers=headers)
    courses = resp.json()
    target_course = next((c for c in courses if "Certification" in c["title"]), None)
    
    if not target_course:
        print("Course not found")
        return
        
    print(f"Found Course: {target_course['title']} ({target_course['uuid']})")
    print(f"Completion %: {target_course.get('completion_percentage')}")

    # 3. Get Modules
    resp = requests.get(f"{BASE_URL}/api/learning/courses/{target_course['uuid']}/modules", headers=headers)
    modules = resp.json()
    
    print("\n--- MODULES ---")
    for m in modules:
        print(f"ID: {m['uuid']}")
        print(f"Title: {m['title']}")
        print(f"Type: '{m.get('content_type')}'") # Quote to check spaces
        print(f"Status: {m.get('status')}")
        print(f"Order: {m.get('order_index')}")
        print("---")

if __name__ == "__main__":
    run()
