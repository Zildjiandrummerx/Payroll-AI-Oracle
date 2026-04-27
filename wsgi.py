"""
==============================================================================
YOTCHAPPS PAYROLL ENGINE - WSGI ENTRY POINT (GUNICORN / CLOUD RUN)
==============================================================================
This file serves as the definitive bridge between the underlying web server 
infrastructure (e.g., Gunicorn) and the Flask Python application. 

Core Responsibilities:
1. The Factory Invocation: Bootstraps the app using the secure Application Factory.
2. Production Gateway: Exposes the `app` callable to enterprise WSGI servers.
3. Local Containerization: Binds to 0.0.0.0:8080 to allow Docker port mapping 
   to function seamlessly during local development.
==============================================================================
"""

from app import create_app

# ==========================================
# PRODUCTION WSGI CALLABLE
# ==========================================
# Instantiates the secure, memory-hardened Flask application.
# In production (GCP Cloud Run), the Gunicorn web server will import THIS 
# exact 'app' object in memory to handle thousands of concurrent requests.
app = create_app()

# ==========================================
# LOCAL DEVELOPMENT FALLBACK
# ==========================================
# This block is ONLY triggered if the script is run directly (e.g., `python wsgi.py`).
# It binds to 0.0.0.0 (all IPv4 addresses on the local machine) ensuring that 
# traffic can route correctly when testing inside an isolated Docker container.
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)