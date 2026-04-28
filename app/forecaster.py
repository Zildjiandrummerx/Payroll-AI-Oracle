"""
==============================================================================
YOTCHAPPS PAYROLL ENGINE - STOCHASTIC FORECASTING & ORACLE MODULE
==============================================================================
This module acts as the "AI Financial Advisor". It shifts from descriptive math 
to prescriptive advice by running hidden simulations on the user's marginal tax 
rates and upcoming calendar.

Core Responsibilities:
1. The Habit Tracker: Annualizes their current Overtime/Lateness to show compounded wealth/bleed.
2. The Holiday Radar: Scans 45 days into the future for SV Statutory Holidays.
3. The Goal Oracle: Simulates exactly 1 extra hour of OT to find their marginal 
   post-tax hourly rate, then divides it against their personal goal.
4. XSS Security: Uses markupsafe.escape to neutralize hijacked string inputs.
==============================================================================
"""

import holidays
from datetime import timedelta
from markupsafe import escape
from .calculator import calculate_quincena

def generate_forecasts(base_params, base_res, goal_name="", goal_amount=0.0, lang='en'):
    """
    Executes the Smart Radar and the Oracle Simulation.
    Returns a unified JSON dictionary to feed the Tabbed UI in Column 3.
    """
    radar = []
    
    # ---------------------------------------------------------
    # SLOT 1: THE HUSTLE YIELD (Always present to maintain symmetry)
    # ---------------------------------------------------------
    total_ot_pay = base_res['ot_pay'] + base_res['night_ot_pay']
    if total_ot_pay > 0:
        ann_ot = total_ot_pay * 24
        txt = f"Your Overtime generated <strong>${total_ot_pay:.2f}</strong> this period. Annualized, this represents <strong>${ann_ot:.2f}</strong> in extra net income." if lang == 'en' else f"Tus horas extras generaron <strong>${total_ot_pay:.2f}</strong> hoy. Anualizado, esto representa <strong>${ann_ot:.2f}</strong> en ingreso neto extra."
        radar.append({"title": "Hustle Yield" if lang == 'en' else "Rendimiento Extra", "text": txt, "icon": "fas fa-fire", "color": "var(--highlight)"})
    else:
        txt = "Zero overtime logged. 100% of your standard base salary is protected." if lang == 'en' else "Cero horas extras. El 100% de tu salario base está protegido."
        radar.append({"title": "Base Secured" if lang == 'en' else "Base Asegurada", "text": txt, "icon": "fas fa-shield-alt", "color": "var(--highlight)"})

    # ---------------------------------------------------------
    # SLOT 2: THE FINANCIAL BLEED (Discipline check)
    # ---------------------------------------------------------
    if base_res['late_deduction'] > 0:
        ann_late = base_res['late_deduction'] * 24
        txt = f"Lateness cost you <strong>${base_res['late_deduction']:.2f}</strong>. Left unchecked, this behavior represents an annualized loss of <strong>${ann_late:.2f}</strong>." if lang == 'en' else f"Las tardanzas te costaron <strong>${base_res['late_deduction']:.2f}</strong>. Anualizado, este comportamiento representa una pérdida de <strong>${ann_late:.2f}</strong>."
        radar.append({"title": "Financial Bleed" if lang == 'en' else "Fuga Financiera", "text": txt, "icon": "fas fa-tint-slash", "color": "#ff4b4b"})
    else:
        txt = "Zero lateness detected. Maximum efficiency and payout achieved." if lang == 'en' else "Cero tardanzas detectadas. Eficiencia y pago máximo alcanzados."
        radar.append({"title": "Flawless Attendance" if lang == 'en' else "Asistencia Perfecta", "text": txt, "icon": "fas fa-check-circle", "color": "var(--highlight)"})

    # ---------------------------------------------------------
    # SLOT 3: THE HOLIDAY RADAR (Scans 45 Days Ahead)
    # ---------------------------------------------------------
    sv_holidays = holidays.country_holidays('SV', years=[base_params['start_date'].year, base_params['start_date'].year + 1])
    found_holiday = None
    
    # Fast-forward time loop
    for i in range(1, 46):
        check_date = base_params['start_date'] + timedelta(days=i)
        if check_date in sv_holidays:
            found_holiday = (check_date, sv_holidays.get(check_date))
            break
            
    if found_holiday:
        date_obj, h_name = found_holiday
        # Simulate an 8-hour boost using their exact hourly rate
        p_sim = base_params.copy()
        p_sim['extra_bonus'] += (8 * base_res['rates']['hourly'])
        sim_res = calculate_quincena(p_sim)
        boost = sim_res['net'] - base_res['net']
        
        d_str = date_obj.strftime('%b %d')
        txt = f"<strong>{h_name} ({d_str})</strong> is approaching. Logging hours on a statutory holiday yields a projected <strong>${boost:.2f}</strong> Net spike." if lang == 'en' else f"<strong>{h_name} ({d_str})</strong> se acerca. Trabajar en este asueto de ley proyecta un incremento neto de <strong>${boost:.2f}</strong>."
        
        # Now strictly bound to --warning-text (Lime Green / Light Blue / Yellow)
        radar.append({"title": "Upcoming Horizon" if lang == 'en' else "Próximo Horizonte", "text": txt, "icon": "fas fa-calendar-day", "color": "var(--warning-text)"})
    else:
        txt = "No mandatory statutory holidays detected in the next 45 days." if lang == 'en' else "No se detectan asuetos obligatorios en los próximos 45 días."
        radar.append({"title": "Clear Horizon" if lang == 'en' else "Horizonte Despejado", "text": txt, "icon": "fas fa-calendar-check", "color": "var(--muted-color)"})

    # ---------------------------------------------------------
    # TAB 2: THE GOAL ORACLE (Marginal Tax Rate Simulator)
    # ---------------------------------------------------------
    oracle_text = ""
    if goal_amount > 0 and goal_name:
        # SECURITY LAYER: Sanitize input to block <script> injections
        safe_name = escape(goal_name)
        
        # MARGINAL TAX SIMULATION: Calculate the exact post-tax value of 1 hour of OT
        p_plus = base_params.copy()
        p_plus['ot_hours'] += 1.0
        res_plus = calculate_quincena(p_plus)
        marginal_net = res_plus['net'] - base_res['net']
        
        if marginal_net <= 0: marginal_net = base_res['rates']['hourly'] # Failsafe
        
        hours_needed = goal_amount / marginal_net
        
        # Assumption: User saves 15% of their base net pay towards their goal
        savings_per_q = base_res['net'] * 0.15
        if savings_per_q <= 0: savings_per_q = 1.0 # Failsafe against division by zero
        
        q_needed = goal_amount / savings_per_q
        target_date = base_params['start_date'] + timedelta(days=int(q_needed * 15))
        
        if lang == 'en':
            oracle_text = f"To afford <strong>{safe_name}</strong> (${goal_amount:,.2f}), assuming you save 15% of your current Net Pay, you will reach your goal by <strong>{target_date.strftime('%B %Y')}</strong>. Need it faster? You are exactly <strong>{hours_needed:.1f} hours</strong> of Overtime away from buying it outright."
        else:
            meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
            m_name = meses[target_date.month - 1]
            oracle_text = f"Para adquirir <strong>{safe_name}</strong> (${goal_amount:,.2f}), ahorrando el 15% de tu pago neto, alcanzarás tu meta en <strong>{m_name} {target_date.year}</strong>. ¿Lo necesitas antes? Estás a exactamente <strong>{hours_needed:.1f} horas extras</strong> de costearlo."
    else:
        # The Default State before they hit the button
        oracle_text = "Enter a financial goal and target amount above to consult the Engine." if lang == 'en' else "Ingresa una meta financiera y un monto arriba para consultar al Motor."

    return {
        "radar": radar,
        "oracle": oracle_text
    }