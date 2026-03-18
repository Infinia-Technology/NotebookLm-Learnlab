import os

# Must be set before any app imports — prevents config.py from crashing pytest

# ── MongoDB ──────────────────────────────────────────────
os.environ.setdefault(
    "MONGO_URI",
    "mongodb://app_admin:app_secure_pass@localhost:27017/test_db?authSource=admin"
)

# ── Redis ─────────────────────────────────────────────────
os.environ.setdefault("REDIS_URL", "redis://localhost:6379")

# ── Backend App ───────────────────────────────────────────
os.environ.setdefault("SECRET_KEY", "ci-test-secret-key-not-for-production")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("JWT_EXPIRE_DAYS", "7")
os.environ.setdefault("APP_NAME", "EleVatria")
os.environ.setdefault("JWT_SECRET", "ci-test-jwt-secret-not-for-production")
os.environ.setdefault("APP_BASE_URL", "http://localhost:3100")
os.environ.setdefault("DEBUG", "false")
os.environ.setdefault(
    "CORS_ORIGINS",
    '["http://localhost:3100","http://localhost:5173","http://localhost:5174","http://localhost:3000"]'
)

# ── Admin (used in init flows) ─────────────────────────────
os.environ.setdefault("ADMIN_EMAIL", "testadmin@example.com")
os.environ.setdefault("ADMIN_PASSWORD", "testpassword")

# ── Email (safe test config) ──────────────────────────────
os.environ.setdefault("EMAIL_PROVIDER", "console")
os.environ.setdefault("EMAIL_FROM", "test@localhost")
os.environ.setdefault("EMAIL_FROM_NAME", "EleVatria Test")
os.environ.setdefault("ALLOW_ALL_EMAIL_DOMAINS", "true")

# ── OTP ───────────────────────────────────────────────────
os.environ.setdefault("OTP_RESEND_COOLDOWN_SECONDS", "30")
os.environ.setdefault("MASTER_OTP", "123456")

# ── AI / LLM Keys (placeholders for test) ──────────────────
os.environ.setdefault("OPENAI_API_KEY", "sk-test-placeholder")
os.environ.setdefault("ANTHROPIC_API_KEY", "sk-ant-test-placeholder")
os.environ.setdefault("GEMINI_API_KEY", "test-placeholder")
os.environ.setdefault("GOOGLE_API_KEY", "test-placeholder")

# ── External APIs (mock endpoints) ─────────────────────────
os.environ.setdefault("PODCAST_API_BASE", "http://localhost:8001")
os.environ.setdefault("PODCAST_API_KEY", "test-placeholder")
os.environ.setdefault("WHISPER_API_BASE", "http://localhost:8001")
os.environ.setdefault("WHISPER_API_KEY", "test-placeholder")
os.environ.setdefault("ELEVENLABS_API_KEY", "test-placeholder")

# ── Environment ────────────────────────────────────────────
os.environ.setdefault("ENVIRONMENT", "test")
