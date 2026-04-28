# SV Payroll Engine & Financial Oracle (Cloud-Native & AI-Driven)

## The Vision: From Calculator to Financial Co-Pilot
Calculating payroll in El Salvador is notoriously complex. Between 15-day Semi-Monthly cycles, strict night-shift boundaries (7:00 PM to 6:00 AM), 2-Tier overtime multipliers, and staggered Income Tax (ISR) brackets, standard calculators fail to provide actionable clarity.

This project was built to solve that problem. But I didn't just build a calculator; I engineered a Stateless, Cloud-Native Financial Co-Pilot. It doesn't just tell users what they earned—it uses backend heuristics to forecast future wealth, predict statutory holidays, and simulate marginal tax rates to help BPO and enterprise workers optimize their financial goals.

---

## Core Engine Mathematics (The Salvadoran Labor Code)
The backend Python engine strictly adheres to the Código de Trabajo de El Salvador:
*   **The Time-Matrix:** Automatically splits standard shifts from Nocturnal shifts (25% surcharge) and deducts 1-hour lunch breaks.
*   **The Overtime Auto-Splitter:** Ingests a lump sum of Overtime and dynamically splits it into Day OT (200%) and Night OT (250%) based on the user's specific clock-out time.
*   **Statutory Tax Engine:** Calculates ISSS (capped), AFP, Municipal Tax (Vialidad), and processes the complex 2026 ISR Income Tax retention brackets.
*   **Annual Benefits (Art. 198 & 200):** Projects proportional Aguinaldos (Christmas Bonuses) based on exact seniority tiers, alongside 30% Company Vacation Bonuses.

---

## The Enterprise Evolution (Proactive Architecture)
To elevate this into a production-ready web application, I engineered several advanced architectural components and strict security perimeters.

### 1. The Gamified "Oracle" (Predictive Heuristics)
Standard calculators are descriptive; this engine is prescriptive.
*   **The Habit Tracker:** Annualizes the user's exact overtime or lateness inputs to demonstrate compounded financial wealth (or bleed) over a 12-month trajectory.
*   **The Holiday Radar:** Scans the official calendar 45 days into the future. If a statutory holiday approaches, it simulates an 8-hour shift and alerts the user to the exact post-tax net spike they will earn if they volunteer to work it.
*   **The Marginal Tax Goal Setter:** Users can input a financial goal (e.g., "$1,200 for a laptop"). The backend secretly simulates exactly 1 extra hour of OT to calculate their true marginal post-tax hourly rate, returning the exact number of OT hours required to achieve the goal.

### 2. The Omni-Theme UI Matrix
*   **CSS Variable Injection:** The UI utilizes a dynamic :root CSS matrix, allowing users to seamlessly toggle between Dark (Manjaro), Light (Arch), and Cherry (Sakura) themes without reloading the DOM.
*   **Dynamic Localization (i18n):** A highly performant Vanilla JS dictionary instantly translates the entire DOM, placeholders, and tooltips between English and Spanish. 
*   **Responsive Progressive Disclosure:** Complex ML data is hidden inside a clean, symmetrical 2-Tab Bootstrap layout, ensuring mobile users are never overwhelmed by vertical UI bloat.

### 3. API Gateway & Boundary Defense
*   **The Fat Payload Kill-Switch:** Flask is configured to instantly sever connections if the JSON payload exceeds 50 Kilobytes, neutralizing Out-Of-Memory (OOM) crash attempts.
*   **Surgical Rate Limiting:** Flask-Limiter uses Werkzeug's ProxyFix to strip Google Cloud Load Balancer disguises, tracking and throttling the true origin IP to 30 calculations per minute.
*   **Cryptographic Input Sanitization:** The Goal Oracle neutralizes Cross-Site Scripting (XSS) by combining strict HTML5 Regex patterns with backend markupsafe.escape() rendering. Negative payload injections (e.g., trying to input -10 hours of lateness to steal money) are caught and bounced with a 400 Bad Request.

---

## Tech Stack
*   **Backend:** Python 3.11, Flask, Flask-Limiter, Flask-WTF (CSRF), Holidays Library.
*   **Frontend:** Vanilla JavaScript (ES6+ Modules), HTML5, MDBootstrap 5, Flatpickr.
*   **Infrastructure:** Docker, Google Cloud Build, Google Cloud Run, Artifact Registry.

---

## How It Works (The Architecture Flow)

1. **The Entry Point (WSGI):** Gunicorn boots the application via `wsgi.py`, passing it through the Application Factory to inject security headers (CSP, No-Sniff, No-Cache).
2. **Frontend Payload Assembly:** The user fills out the form. `main.js` scrubs the inputs, structures a highly precise JSON dictionary, and attaches a cryptographically secure CSRF token to the header.
3. **Stateless Processing:** The `calculator.py` engine processes the Gross-to-Net math. It then hands the results to `forecaster.py` to run the Marginal Tax simulation and 45-Day Radar.
4. **Cinematic DOM Injection:** The JSON response is caught by the frontend. The UI conditionally unhides applicable tax rows, translates the engine logs, and fires a cinematic count-up animation for the Final Net Pay.

---

## How to Use It (Deployment & Testing)

### 1. Run Locally (Docker)
You do not need Python installed on your local machine. The entire environment is containerized.

```bash
# Build the hardened image
docker build -t sv-payroll-engine .
```

```bash
# Run the container locally on port 8080
docker run -p 8080:8080 sv-payroll-engine
Navigate to http://localhost:8080 in your web browser.
```

### 2. Deploy to Google Cloud Platform (GCP)
The repository includes an idempotent Infrastructure-as-Code (IaC) Bash script (deploy.sh). To push this to your own GCP environment:

Ensure you have the gcloud CLI installed and authenticated.
Open deploy.sh and configure the Global Variables:
```bash
PROJECT_ID="your-gcp-project-id" # Change this to your actual GCP Project ID
SERVICE_NAME="sv-payroll"        # Optional: Name of your Cloud Run service
REGION="us-central1"             # Optional: Change to your preferred GCP region
```

Make the script executable and deploy:
```bash
chmod +x deploy.sh
./deploy.sh
```

The script will automatically provision Artifact Registry, submit the build to Cloud Build, deploy to Cloud Run, inject a randomized 256-bit Hex SECRET_KEY, and output your live HTTPS URL.