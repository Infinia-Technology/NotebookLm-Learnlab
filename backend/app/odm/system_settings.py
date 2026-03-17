from typing import Dict, Optional, ClassVar
from pydantic import Field
from app.odm.document import Document

class SystemSettings(Document):
    """
    Singleton collection for system-wide configurations.
    """
    __collection_name__: ClassVar[str] = "system_settings"

    # AI Integration Settings
    ai_api_key: Optional[str] = None
    ai_base_url: Optional[str] = None
    
    # Model Mapping: service_name -> model_name
    # e.g., {"chat": "deepseek-ai/DeepSeek-V3.1", "transcribe": "openai/whisper-large-v3"}
    model_mappings: Dict[str, str] = Field(default_factory=lambda: {
        "chat": "deepseek-ai/DeepSeek-V3.1",
        "transcribe": "openai/whisper-large-v3",
        "vision": "Qwen/Qwen3-VL-235B",
        "embeddings": "Qwen3-Embedding-8B",
        "infographic": "deepseek-ai/DeepSeek-V3.1"
    })

    @classmethod
    async def get_settings(cls) -> "SystemSettings":
        """Get the singleton settings document, creating it if it doesn't exist."""
        settings = await cls.find_one({})
        if not settings:
            settings = await cls.create()
        return settings
