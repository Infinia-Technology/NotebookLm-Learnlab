FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy pyproject.toml first for caching
COPY pyproject.toml .

# Create a minimal setup to install dependencies
RUN pip install --no-cache-dir pip --upgrade && \
    pip install --no-cache-dir hatchling && \
    mkdir -p app && \
    touch app/__init__.py && \
    pip install --no-cache-dir -e ".[email]"

# Copy application code
COPY app/ app/

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
