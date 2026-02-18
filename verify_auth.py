import requests
import json
import time

BASE_URL = "http://localhost:3100/api/auth"

def print_step(message):
    print(f"\n{'='*50}\n{message}\n{'='*50}")

def verify_admin_login():
    print_step("Step 1: Verifying Admin Login")
    email = "rsanutopthree@gmail.com"
    password = "Sanu@123"
    
    try:
        response = requests.post(f"{BASE_URL}/login", json={
            "email": email,
            "password": password
        })
        
        if response.status_code == 200:
            print("[SUCCESS] Admin Login Successful!")
            data = response.json()
            print(f"Token: {data['access_token'][:20]}...")
            print(f"User: {data['user']['email']} ({data['user']['role']})")
            return True
        else:
            print(f"[FAILED] Admin Login Failed: {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print(f"[ERROR] Admin Login Error: {e}")
        return False

def register_new_user():
    print_step("Step 2: Registering New User")
    # Use a timestamp to ensure uniqueness if run multiple times
    timestamp = int(time.time())
    timestamp = int(time.time())
    email = f"test_{timestamp}@mailinator.com"
    password = "User_Pass_2026!"
    
    payload = {
        "email": email,
        "password": password,
        "first_name": "Test",
        "last_name": "User"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/signup", json=payload)
        
        if response.status_code == 200:
            print(f"[SUCCESS] Registration Request Successful for {email}!")
            print("Response:", response.json())
            print("NOTE: Check Docker logs for OTP if email provider is 'console'.")
            return email, password
        else:
            print(f"[FAILED] Registration Failed: {response.status_code}")
            print(response.text)
            return None, None
    except Exception as e:
        print(f"[ERROR] Registration Error: {e}")
        return None, None

def verify_registration(email, password):
    print_step("Step 3: Verifying OTP & Welcome Email Trigger")
    
    # In a real dev env, we would read the logs or have a backdoor. 
    # Here, we'll prompt the user or just explain, but let's try to simulate a wait 
    # and then ask the user to input OTP if running interactively, or just skip if automated.
    print(f"To verify {email}, search for the OTP in the backend logs.")
    print("Run: docker compose logs backend | grep -A 5 'OTP'")
    
    otp = input("Enter the OTP from the logs: ")
    
    if not otp:
        print("Skipping verification step.")
        return

    try:
        response = requests.post(f"{BASE_URL}/verify-otp", json={
            "email": email,
            "otp": otp
        })
        
        if response.status_code == 200:
            print("[SUCCESS] OTP Verified!")
            print("Response:", response.json())
            print("\n>> CHECK BACKEND LOGS NOW <<")
            print("You should see a log entry for 'Welcome to SAIL Starter Kit' email being sent.")
        else:
            print(f"[FAILED] OTP Verification Failed: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"[ERROR] Verification Error: {e}")

def main():
    print("Starting Authentication Verification...")
    
    # 1. Admin Login
    verify_admin_login()
    
    # 2. New User Registration
    new_email, new_pass = register_new_user()
    
    # 3. Verify OTP (Interactive)
    if new_email:
        verify_registration(new_email, new_pass)

if __name__ == "__main__":
    main()
