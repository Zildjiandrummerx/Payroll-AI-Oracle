"""
==============================================================================
YOTCHAPPS PAYROLL ENGINE - CORE MATHEMATICS MODULE
==============================================================================
This is a purely stateless, decoupled Python engine. It does not know what Flask,
HTML, or web requests are. It simply ingests a dictionary of parameters, executes 
the strict Salvadoran Labor Code (Código de Trabajo) mathematics, and returns 
a comprehensive JSON-ready payload.

Core Responsibilities:
1. Time-Matrix Calculation: Evaluates 24-hour overnight shifts & lunch deductions.
2. The 15-Day Auto-Schedule: Loops through the Quincena to detect SV Holidays.
3. Overtime & Exception Processing: Handles Day OT (200%), Night OT (250%), and lateness.
4. Statutory Tax Engine: Calculates ISSS, AFP, Vialidad, and ISR Income Tax brackets.
5. Annual Benefits (Art. 198 & 200): Projects proportional Aguinaldos and Vacation Bonuses.
==============================================================================
"""

import holidays
from datetime import datetime, timedelta

def calculate_shift_hours(time_in_str, time_out_str):
    """
    ==========================================
    TIME-MATRIX RESOLUTION ENGINE
    ==========================================
    Parses start and end times, gracefully handling overnight shifts (e.g., 20:00 to 06:00).
    Automatically deducts 1 hour for lunch, and extracts exact hours worked during
    the legal Salvadoran Night Shift window (19:00 PM to 06:00 AM).
    """
    fmt = "%H:%M"
    t_in = datetime.strptime(time_in_str, fmt)
    t_out = datetime.strptime(time_out_str, fmt)
    
    # Handle Overnight cross-over logic
    if t_out <= t_in:
        t_out += timedelta(days=1)
        
    total_hours = (t_out - t_in).total_seconds() / 3600.0
    paid_hours = max(total_hours - 1.0, 0) # Automatic 1-hour lunch deduction
    
    # Define the Salvadoran Night Shift perimeter (19:00 to 06:00 next day)
    night_start = t_in.replace(hour=19, minute=0, second=0)
    night_end = night_start + timedelta(hours=11) 
    
    # Calculate the exact intersection between the worker's shift and the Night Shift perimeter
    overlap_start = max(t_in, night_start)
    overlap_end = min(t_out, night_end)
    
    night_hours = 0
    if overlap_start < overlap_end:
        night_hours = (overlap_end - overlap_start).total_seconds() / 3600.0
        
    return paid_hours, paid_hours - night_hours, night_hours


def calculate_quincena(p):
    """
    ==========================================
    THE STATELESS SV PAYROLL ENGINE
    ==========================================
    Orchestrates the Gross-to-Net conversion for a 15-day period based on user inputs.
    """
    monthly_base = p['monthly_base']
    daily_rate = monthly_base / 30
    hourly_rate = daily_rate / 8

    # Fetch the official El Salvador holiday calendar for the current and next year
    sv_holidays = holidays.country_holidays('SV', years=[p['start_date'].year, p['start_date'].year + 1])
    
    auto_night_hours = 0.0
    auto_holiday_hours = 0.0
    auto_holiday_night_hours = 0.0
    
    # ---------------------------------------------------------
    # 1. THE 15-DAY AUTO-SCHEDULE LOOP
    # ---------------------------------------------------------
    for i in range(15):
        current_date = p['start_date'] + timedelta(days=i)
        weekday = current_date.weekday()
        
        # Skip user-defined days off
        if weekday in p['days_off']:
            continue
            
        # Determine if today is a Standard Shift or a Short Day
        c_in, c_out = (p['short_in'], p['short_out']) if weekday == p['short_day'] else (p['shift_in'], p['shift_out'])
        paid_hrs, day_hrs, night_hrs = calculate_shift_hours(c_in, c_out)
        
        # Data Layer Enrichment: Is today a legally recognized holiday?
        if current_date in sv_holidays:
            auto_holiday_hours += day_hrs
            auto_holiday_night_hours += night_hrs
        else:
            auto_night_hours += night_hrs

    # ---------------------------------------------------------
    # 2. GROSS INCOME & EXCEPTIONS
    # ---------------------------------------------------------
    base_quincena = monthly_base / 2
    late_deduction = p['late_hours'] * hourly_rate
    adjusted_base = max(base_quincena - late_deduction, 0)

    # Statutory Shift Multipliers
    night_pay = auto_night_hours * (hourly_rate * 0.25) if p['apply_night'] else 0.0
    holiday_pay = auto_holiday_hours * (hourly_rate * 1.0) 
    holiday_night_pay = auto_holiday_night_hours * (hourly_rate * 1.5)
    
    # The 2-Tier BPO Overtime Engine (Day 200%, Night 250%)
    ot_pay = p.get('ot_hours', 0.0) * (hourly_rate * 2.0) 
    night_ot_pay = p.get('night_ot_hours', 0.0) * (hourly_rate * 2.5)
    
    total_gross = max(adjusted_base + holiday_pay + holiday_night_pay + night_pay + p['extra_bonus'] + ot_pay + night_ot_pay, 0)

    # ---------------------------------------------------------
    # 3. STATUTORY DEDUCTION ENGINE (AFP, ISSS, ISR)
    # ---------------------------------------------------------
    isss = min(total_gross * 0.03, 15.00) if p['apply_isss'] else 0.0
    isss_employer = min(total_gross * 0.075, 37.50) if p['apply_isss'] else 0.0
    afp = (total_gross * 0.0725) if p['apply_afp'] else 0.0
    afp_employer = (total_gross * 0.0875) if p['apply_afp'] else 0.0
    vialidad = 3.43 if p['apply_vialidad'] else 0.0
    
    taxable = max(total_gross - (isss + afp), 0)
    
    # 2026 ISR (Income Tax) Retention Brackets
    if taxable <= 236.00: isr = 0
    elif taxable <= 447.62: isr = (taxable - 236.00) * 0.10 + 8.83
    elif taxable <= 1019.05: isr = (taxable - 447.62) * 0.20 + 30.00
    else: isr = (taxable - 1019.05) * 0.30 + 144.28
        
    total_deductions = isss + afp + isr + p['custom_deductions'] + vialidad
    net_pay = max(taxable - isr - p['custom_deductions'] - vialidad, 0)

    # ---------------------------------------------------------
    # 4. ANNUAL BENEFITS ENGINE (Art. 198 & 200)
    # ---------------------------------------------------------
    vacation_bonus = 0.0
    aguinaldo = 0.0
    
    if p['seniority'] >= 0:
        # Vacation Bonus: Usually 30% of a 15-day salary
        vacation_bonus = (monthly_base / 2) * (p['vac_percent'] / 100)
        daily_salary = monthly_base / 30
        
        # Aguinaldo calculations based on strict Years of Service
        if p['seniority'] == 0:   
            aguinaldo = ((daily_salary * 15) / 365) * p['days_worked'] # Proportional
        elif p['seniority'] == 1: 
            aguinaldo = daily_salary * 15 # 1 to 3 Years
        elif p['seniority'] == 2: 
            aguinaldo = daily_salary * 19 # 3 to 10 Years
        elif p['seniority'] == 3: 
            aguinaldo = daily_salary * 21 # 10+ Years

    # ==========================================
    # FINAL PAYLOAD ASSEMBLY
    # ==========================================
    return {
        "rates": { "hourly": round(hourly_rate, 4), "ot": round(hourly_rate * 2, 4), "night": round(hourly_rate * 1.25, 4), "holiday": round(hourly_rate * 2, 4), "holiday_night": round(hourly_rate * 2.5, 4) },
        "engine": { "holiday_hours": auto_holiday_hours, "holiday_night_hours": auto_holiday_night_hours, "night_hours": auto_night_hours },
        "annual": { "vacation": round(vacation_bonus, 2), "aguinaldo": round(aguinaldo, 2), "vac_percent": p['vac_percent'], "seniority_tier": p['seniority'] },
        "adjusted_base": round(adjusted_base, 2),
        "extra_bonus": round(p['extra_bonus'], 2),
        "holiday_pay": round(holiday_pay, 2),
        "holiday_night_pay": round(holiday_night_pay, 2),
        "ot_pay": round(ot_pay, 2),
        "night_ot_pay": round(night_ot_pay, 2),
        "night_pay": round(night_pay, 2),
        "late_deduction": round(late_deduction, 2),
        "gross": round(total_gross, 2),
        "isss": round(isss, 2),
        "isss_employer": round(isss_employer, 2), 
        "afp": round(afp, 2),
        "afp_employer": round(afp_employer, 2),   
        "taxable": round(taxable, 2),
        "isr": round(isr, 2),
        "custom_deductions": round(p['custom_deductions'], 2),
        "vialidad": round(vialidad, 2),
        "total_deductions": round(total_deductions, 2),
        "net": round(net_pay, 2)
    }