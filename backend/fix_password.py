"""Reset admin password to match .env credentials."""
from pymongo import MongoClient
from app.auth.passwords import hash_password

MONGO_URI = "mongodb://app_admin:app_secure_pass@localhost:27017/app_database?authSource=admin"
EMAIL = "rsanutopthree@gmail.com"
PASSWORD = "Sanu@123"

client = MongoClient(MONGO_URI)
db = client["app_database"]

new_hash = hash_password(PASSWORD)
print(f"Generated hash for {EMAIL}")

update = {"$set": {"password_hash": new_hash}}
result = db.users.update_one({"email": EMAIL}, update)
print(f"Matched: {result.matched_count}, Modified: {result.modified_count}")

if result.modified_count == 1:
    print("Password reset successfully!")
else:
    print("No changes made.")

client.close()
