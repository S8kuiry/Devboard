FROM python:3.11-slim

# Set working directory inside the container
WORKDIR /app

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install dependencies first (leverages Docker cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port your application runs on (default set to 8000)
EXPOSE 8000

# Run the entrypoint script
CMD ["python", "index.py"]