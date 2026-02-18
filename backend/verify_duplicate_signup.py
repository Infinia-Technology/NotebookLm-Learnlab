import requests
import time
import sys

BASE_URL = "http://localhost:8000/api/v1"  # Adjusted to standard FastAPI port/prefix, checking verify_auth.py again
# verify_auth.py used http://localhost:3100/api/auth which might be the frontend proxy or a different config.
# I'll check env vars or main.py again to be sure about the port.
# main.py does not specify port, it's run by uvicorn.
# I'll try 8000 first, or 3100 if that fails.

# Let's use 8000 as default for backend direct access.
BASE_URL = "http://localhost:8000/api/v1"

def register_user(email, password):
    payload = {
        "email": email,
        "password": password,
        "first_name": "Test",
        "last_name": "User"
    }
    try:
        response = requests.post(f"{BASE_URL}/auth/signup", json=payload)
        return response
    except requests.exceptions.ConnectionError:
        print("[ERROR] Could not connect to server.")
        return None

def main():
    timestamp = int(time.time())
    email = f"duplicate_test_{timestamp}@example.com"
    password = "TestPassword123!"

    print(f"Attempting to register new user: {email}")
    response1 = register_user(email, password)
    
    if not response1:
        sys.exit(1)

    if response1.status_code == 200:
        print("[PASS] First registration successful.")
    else:
        print(f"[FAIL] First registration failed: {response1.status_code} - {response1.text}")
        # It might fail if I got the URL wrong.
        sys.exit(1)

    print(f"Attempting to register SAME user again: {email}")
    response2 = register_user(email, password)

    if response2.status_code == 409:
        print("[PASS] Duplicate registration blocked (409 Conflict).")
        print("Response:", response2.json())
    else:
        print(f"[FAIL] Duplicate registration not blocked as expected. Status: {response2.status_code}")
        print("Response:", response2.text)

if __name__ == "__main__":
    main()
