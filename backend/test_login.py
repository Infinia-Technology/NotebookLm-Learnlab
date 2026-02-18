import requests
import json

BASE_URL = "http://localhost:3100/api"
EMAIL = "rsanutopthree@gmail.com"
PASSWORD = "Sanu@123"

def test_login():
    print(f"Attempting login for {EMAIL}...")
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": EMAIL,
            "password": PASSWORD
        })
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Login SUCCESS!")
            print("Token received:", response.json().get("access_token")[:20] + "...")
        else:
            print("Login FAILED")
            print("Response:", response.text)
            
    except Exception as e:
        print(f"Error connecting to backend: {e}")

if __name__ == "__main__":
    test_login()
