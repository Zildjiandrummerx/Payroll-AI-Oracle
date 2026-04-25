# ==========================================
# MODULE: CONTAINERIZATION ENGINE
# ==========================================
# We use the 'slim' variant of Debian/Python. 
# This drastically reduces the image size (faster deployments) 
# and minimizes the attack surface by removing unnecessary OS packages.
FROM python:3.11-slim

# ==========================================
# SECURITY: LEAST PRIVILEGE PRINCIPLE
# ==========================================
# Never run a web server as the 'root' Linux user. 
# If a hacker manages to execute Remote Code Execution (RCE) via a Python vulnerability, 
# they will be trapped inside an unprivileged account with zero OS-level permissions.
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set the working directory inside the container
WORKDIR /app

# ==========================================
# DEPENDENCY LAYER CACHING
# ==========================================
# We copy ONLY the requirements.txt file first. 
# Docker caches this step. If we change our Python code but don't change our dependencies, 
# Docker will skip the 30-second 'pip install' step and rebuild in < 1 second.

# Suppress the "Running pip as root" warning (safe inside an isolated container build).
ENV PIP_ROOT_USER_ACTION=ignore

# Silently upgrade pip to the latest version to prevent the "new release" warning.
RUN pip install --no-cache-dir --upgrade pip --quiet

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ==========================================
# APPLICATION ASSEMBLY
# ==========================================
# Copy the rest of the application files into the container
COPY . .

# Transfer ownership of all files to the secure non-root user
RUN chown -R appuser:appuser /app

# Switch Linux context to the secure user
USER appuser

# ==========================================
# ENVIRONMENT CONFIGURATION
# ==========================================
# PYTHONUNBUFFERED=1 forces Python to instantly stream its logs to stdout.
# This ensures real-time visibility in Google Cloud Logging.
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Expose the port so the Cloud Run Load Balancer can route traffic to it
EXPOSE 8080

# ==========================================
# PRODUCTION WSGI SERVER (GUNICORN)
# ==========================================
# We do not use 'flask run' (which is only for local development).
# Gunicorn handles concurrent requests efficiently.
# We point it to 'wsgi:app' (our new entry point) instead of 'app:app'.
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--threads", "8", "wsgi:app"]