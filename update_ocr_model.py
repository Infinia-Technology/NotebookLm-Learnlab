
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def update_settings():
    mongo_uri = os.getenv("MONGO_URI", "mongodb://app-mongo:27017/sail-starter-kit")
    db_name = mongo_uri.split("/")[-1]
    client = AsyncIOMotorClient(mongo_uri)
    db = client[db_name]
    collection = db["system_settings"]

    settings = await collection.find_one({})
    if settings:
        new_mappings = {
            "chat": "deepseek-ai/DeepSeek-V3.1",
            "transcribe": "openai/whisper-large-v3",
            "vision": "Qwen/Qwen3-VL-235B",
            "embeddings": "Qwen3-Embedding-8B",
            "infographic": "deepseek-ai/DeepSeek-V3.1"
        }
        await collection.update_one(
            {"_id": settings["_id"]},
            {"$set": {"model_mappings": new_mappings}}
        )
        print("Updated Model Mappings to DeepSeek/Qwen defaults.")
    else:
        print("No settings found to update. (Defaults will take care of it if created now)")

if __name__ == "__main__":
    asyncio.run(update_settings())
