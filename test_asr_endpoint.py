import pyttsx3
import requests
import os

print("Generating speech audio...")
engine = pyttsx3.init()
engine.save_to_file('Hello, this is a test of the local Whisper speech recognition system. Thank you for listening.', 'test_speech.wav')
engine.runAndWait()

print("Sending audio to local backend API...")
url = "http://localhost:8000/api/knowledge/transcribe"
try:
    with open("test_speech.wav", "rb") as f:
        files = {"file": ("test_speech.wav", f, "audio/wav")}
        response = requests.post(url, files=files)
        print("Status:", response.status_code)
        print("Response:", response.text)
except Exception as e:
    print("Error during API request:", e)
