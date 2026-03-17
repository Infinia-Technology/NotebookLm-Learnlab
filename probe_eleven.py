import requests
import json

api_key = "b4670d3d19b0cf3c83f01b0bfbf76b445e8812c432c4cfeffdf2e83f81ca485b"
# Adam (Verified)
voice_id = "pNInz6obpgDQGcFmaJgB"
model_id = "eleven_flash_v2_5"

url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
headers = {
    "Accept": "audio/mpeg",
    "Content-Type": "application/json",
    "xi-api-key": api_key
}
data = {
    "text": "Hello world",
    "model_id": model_id
}

print(f"Testing TTS with Voice: {voice_id} and Model: {model_id}...")
response = requests.post(url, json=data, headers=headers)

print(f"Status Code: {response.status_code}")
print(f"Response Body: {response.text[:500]}")
