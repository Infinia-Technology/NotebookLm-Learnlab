import requests
import time

BASE_URL = "http://localhost:3100/api/auth"

def test_gmail_signup():
    print("Testing signup with gmail.com domain...")
    timestamp = int(time.time())
    email = f"test_{timestamp}@gmail.com"
    password = "Test_Password_123!"
    
    payload = {
        "email": email,
        "password": password,
        "first_name": "Test",
        "last_name": "Gmail"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/signup", json=payload)
        
        if response.status_code == 200:
            print(f"[SUCCESS] Signup allowed for {email}")
            print("Response:", response.json())
        else:
            print(f"[FAILED] Signup failed for {email}")
            print("Status:", response.status_code)
            print("Response:", response.text)
            
    except Exception as e:
        print(f"[ERROR] Request failed: {e}")

if __name__ == "__main__":
    test_gmail_signup()
