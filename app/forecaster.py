"""
==============================================================================
YOTCHAPPS PAYROLL ENGINE - STOCHASTIC FORECASTING MODULE
==============================================================================
This module is a stateless "Time Machine". It ingests the user's current 
mathematical parameters, advances the calendar by 15 days, and generates 
three psychological behavioral tiers. 

Core Responsibilities:
1. Deterministic Time-Travel: Pushes the start_date forward to detect future holidays.
2. The Hustle Tier (Scenario 1): Assumes the user maintains their exact current habits.
3. The Baseline Tier (Scenario 2): Wipes all variables to 0 to show absolute minimum pay.
4. The Scare Tier (Scenario 3): Injects 4 hours of Lateness to show financial damage.
5. Localization: Outputs the insights in either English or Salvadoran-Spanish.
==============================================================================
"""

from datetime import timedelta
from .calculator import calculate_quincena

def generate_forecasts(base_params, lang='en'):
    """
    Executes the 3-Tier Psychological Forecast Array for the upcoming payroll period.
    Returns a list of dictionaries injected with dynamic CSS color variables.
    """
    forecasts = []
    
    # Time-Travel: Advance the exact Quincena start date by 15 days
    next_date = base_params['start_date'] + timedelta(days=15)
    
    # ---------------------------------------------------------
    # SCENARIO 1: CURRENT TRAJECTORY (THE HUSTLE)
    # ---------------------------------------------------------
    # Takes their current input, strips away one-off bonuses, but maintains 
    # their exact Overtime and Lateness habits.
    p1 = base_params.copy()
    p1['start_date'] = next_date
    p1['extra_bonus'] = 0.0 # Bonuses are one-time events, so we wipe them for the future
    res1 = calculate_quincena(p1)
    
    insight1 = "Mantiene tus hábitos actuales de Horas Extras y Tardanzas." if lang == 'es' else "Maintains your current Overtime and Lateness habits."
    if res1['engine']['holiday_hours'] > 0:
        insight1 += " ¡Incluye asueto de ley!" if lang == 'es' else " Includes statutory Holiday pay!"
        
    forecasts.append({
        "scenario": "Proyección Actual" if lang == 'es' else "Current Trajectory",
        "date_str": next_date.strftime("%b %d, %Y"),
        "net_pay": res1['net'],
        "insight": insight1,
        "color": "var(--highlight)" # Binds to Neon Green / Arch Blue dynamically via CSS
    })
    
    # ---------------------------------------------------------
    # SCENARIO 2: STRICT BASELINE
    # ---------------------------------------------------------
    # Strips absolutely every variable to 0. Shows the user what their paycheck
    # will look like if they just clock in and clock out perfectly on time.
    p2 = base_params.copy()
    p2['start_date'] = next_date
    p2['ot_hours'] = 0.0
    p2['night_ot_hours'] = 0.0
    p2['late_hours'] = 0.0
    p2['extra_bonus'] = 0.0
    p2['custom_deductions'] = 0.0
    res2 = calculate_quincena(p2)
    
    insight2 = "Cero Horas Extras. Cero Tardanzas. Salario base puro." if lang == 'es' else "Zero Overtime. Zero Lateness. Pure base pay."
    if res2['engine']['holiday_hours'] > 0:
        insight2 += " (Afectado por asueto)." if lang == 'es' else " (Boosted by Holiday)."
        
    forecasts.append({
        "scenario": "Línea Base Estricta" if lang == 'es' else "Strict Baseline",
        "date_str": next_date.strftime("%b %d, %Y"),
        "net_pay": res2['net'],
        "insight": insight2,
        "color": "var(--baseline-bar)" # Binds to True Gray / Cherry White dynamically
    })
    
    # ---------------------------------------------------------
    # SCENARIO 3: PENALTY RISK (THE SCARE TIER)
    # ---------------------------------------------------------
    # Wipes all overtime (so they don't see extra money), and violently injects
    # lateness hours. This provides a psychological deterrent against misbehaving.
    p3 = base_params.copy()
    p3['start_date'] = next_date
    p3['ot_hours'] = 0.0
    p3['night_ot_hours'] = 0.0
    p3['extra_bonus'] = 0.0
    
    # THE PENALTY INJECTION LOGIC: 
    # If they currently have 0 late hours, warn them by simulating 4 hours of lateness. 
    # If they already have lateness, double it to scare them further.
    scare_hours = 4.0 if base_params['late_hours'] == 0 else round(base_params['late_hours'] * 2, 2)
    p3['late_hours'] = scare_hours
    res3 = calculate_quincena(p3)
    
    insight3 = f"Advertencia: Muestra la pérdida financiera por {scare_hours} hrs de tardanza." if lang == 'es' else f"Warning: Shows the financial damage of {scare_hours} hrs of lateness."
    
    forecasts.append({
        "scenario": "Riesgo de Penalización" if lang == 'es' else "Penalty Risk",
        "date_str": next_date.strftime("%b %d, %Y"),
        "net_pay": res3['net'],
        "insight": insight3,
        "color": "#ff4b4b" # Danger Red
    })
    
    return forecasts