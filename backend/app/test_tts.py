"""
Test: generate a short WAV with Python, then send it to the ASR service.
"""
import os, struct, wave, asyncio, httpx
from dotenv import load_dotenv
import math

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

def create_test_wav(filename: str, duration=2, freq=440, sample_rate=16000):
    """Create a simple sine-wave WAV file for testing."""
    n_samples = int(sample_rate * duration)
    with wave.open(filename, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sample_rate)
        for i in range(n_samples):
            sample = int(32767 * math.sin(2 * math.pi * freq * i / sample_rate))
            f.writeframesraw(struct.pack('<h', sample))

async def test_transcribe():
    api_base = os.getenv("PODCAST_API_BASE", "https://asr.iamsaif.ai")
    api_key = os.getenv("PODCAST_API_KEY", "")
    
    # Create a test audio file
    wav_path = "/tmp/test_audio.wav"
    create_test_wav(wav_path)
    print(f"Created test WAV at {wav_path}")

    url = f"{api_base}/audio/transcriptions"
    headers = {"Authorization": f"Bearer {api_key}"}
    
    async with httpx.AsyncClient() as client:
        with open(wav_path, "rb") as f:
            files = {"file": ("test_audio.wav", f, "audio/wav")}
            data = {
                "response_format": "verbose_json",
                "is_preprocessing_enabled": "true",
            }
            print(f"Sending to {url}...")
            try:
                response = await client.post(url, headers=headers, files=files, data=data, timeout=30.0)
                print(f"Status: {response.status_code}")
                print(f"Response: {response.text[:500]}")
            except Exception as e:
                print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_transcribe())
