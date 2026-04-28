"""
==============================================================================
YOTCHAPPS PAYROLL ENGINE - MAIN ROUTING MODULE (THE TRAFFIC CONTROLLER)
==============================================================================
This module acts as the API gateway between the frontend JavaScript and the 
stateless Python mathematical engines. 

Core Responsibilities:
1. Endpoint Definition: Serves the HTML frontend and exposes the POST API.
2. Input Sanitization: Strict float/int casting and payload validation.
3. Boundary Defense: Rejects negative numbers and >$1M memory overflow attacks.
4. Orchestration: Triggers both the Quincena Calculator and the ML Forecaster,
   bundles their outputs into a single JSON payload, and returns it.
==============================================================================
"""

from datetime import datetime
from flask import Blueprint, render_template, request, jsonify
from .extensions import limiter
from .calculator import calculate_quincena
from .forecaster import generate_forecasts

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """Serves the main Single Page Application (SPA)."""
    return render_template('index.html')

@main_bp.route('/api/calculate', methods=['POST'])
@limiter.limit("30 per minute")
def calculate_payroll():
    """
    The primary POST endpoint. Ingests a JSON payload from the frontend, 
    validates the data types, and routes it to the math engines.
    """
    data = request.get_json() or {}
    lang = data.get('lang', 'en')

    # Extract Goal Oracle Inputs (Optional)
    goal_name = data.get('goal_name', '')
    goal_amount = 0.0
    try:
        goal_amount = float(data.get('goal_amount', 0))
    except (ValueError, TypeError):
        goal_amount = 0.0

    # ==========================================
    # 1. PAYLOAD PARSING & TYPE CASTING
    # ==========================================
    try:
        params = {
            # Financial Data
            'monthly_base': float(data.get('monthly_base', 0)),
            'extra_bonus': float(data.get('extra_bonus', 0)),
            
            # Exceptions (Night OT is now calculated automatically by the backend)
            'ot_hours': float(data.get('ot_hours', 0)),
            'late_hours': float(data.get('late_hours', 0)),
            'custom_deductions': float(data.get('custom_deductions', 0)),
            
            # Statutory Toggles
            'apply_isss': bool(data.get('apply_isss', True)),
            'apply_afp': bool(data.get('apply_afp', True)),
            'apply_vialidad': bool(data.get('apply_vialidad', False)),
            'apply_night': bool(data.get('apply_night', False)),
            
            # Auto-Schedule Matrix
            'start_date': datetime.strptime(data.get('start_date'), "%Y-%m-%d").date(),
            'shift_in': data.get('shift_in', '08:00'),
            'shift_out': data.get('shift_out', '17:00'),
            'short_day': int(data.get('short_day', 4)),
            'short_in': data.get('short_in', '08:00'),
            'short_out': data.get('short_out', '12:00'),
            'days_off': [int(d) for d in data.get('days_off', [5, 6])],
            
            # Phase 3: Annual Benefits Matrix
            'seniority': int(data.get('seniority', -1)),
            'days_worked': int(data.get('days_worked', 365)),
            'vac_percent': float(data.get('vac_percent', 30.0))
        }
    except Exception as e:
        # Catch string injections or missing dates and return a safe 400 Bad Request
        msg = 'Formato inválido. Revisa tus datos.' if lang == 'es' else 'Invalid payload format. Check your inputs.'
        return jsonify({'error': msg}), 400

    # ==========================================
    # 2. FRONTEND BOUNDARY DEFENSE
    # ==========================================
    # Block malicious negative injections designed to reverse math logic
    if any(val < 0 for val in [params['monthly_base'], params['extra_bonus'], params['ot_hours'], params['late_hours'], params['custom_deductions']]):
        msg = 'Los números no pueden ser negativos. Buen intento.' if lang == 'es' else 'Numbers cannot be negative. Nice try.'
        return jsonify({'error': msg}), 400
    
    # Block massive float overflow attacks designed to crash container memory
    if params['monthly_base'] > 1000000 or params['extra_bonus'] > 1000000 or goal_amount > 1000000:
        msg = 'El salario excede el límite máximo.' if lang == 'es' else 'Salary exceeds maximum limit. Ask for a raise in real life.'
        return jsonify({'error': msg}), 400

    # ==========================================
    # 3. ENGINE ORCHESTRATION
    # ==========================================
    # Calculate the exact current Quincena math FIRST
    final_response = calculate_quincena(params)
    
    # Send BOTH the params and the final calculated math to the Forecaster for analysis
    future_forecasts = generate_forecasts(params, final_response, goal_name, goal_amount, lang)
    
    # Bundle the intelligent insights inside the main dictionary
    final_response["forecasts"] = future_forecasts

    # Dispatch the massive JSON payload back to the JavaScript render engine
    return jsonify(final_response)