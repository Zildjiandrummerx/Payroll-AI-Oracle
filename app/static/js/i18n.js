/**
 * ============================================================================
 * YOTCHAPPS PAYROLL ENGINE - INTERNATIONALIZATION (i18n) MODULE
 * ============================================================================
 * This module is the central Localization Engine. It handles the dynamic
 * translation of the entire DOM, including placeholders, titles, and tooltips,
 * without requiring a hard page refresh.
 * 
 * Core Responsibilities:
 * 1. The Global Dictionary: Houses the English/Spanish translation matrix.
 * 2. State Management: Tracks the `currentLang` variable.
 * 3. DOM Traversal: Scans and replaces text based on `data-i18n` attributes.
 * 4. Microcopy Tooltips: Injects translated strings into Bootstrap title attributes.
 * 5. API Resync: Silently triggers a backend recalculation if the language changes
 *    so the Python engine can return translated analytical insights.
 * ============================================================================
 */

export const i18n = {
    en: {
        // Navbar & Inputs
        nav_title: "YotchApps | SV Payroll",
        t_engine: "Time & Pay Engine", t_base_fin: "1. Base Financials", l_salary: "Monthly Salary ($)", l_bonus: "Bonus ($)",
        t_auto_sched: "2. Auto-Schedule", l_start: "Semi-Monthly Start Date", h_scan: "Engine automatically scans 15 days for SV Holidays.",
        l_std_in: "Standard In", l_std_out: "Standard Out", l_short_day: "Short Day", l_short_in: "Short Day (In)", l_short_out: "Short Day (Out)",
        w_shift_10: "Warning: Shift exceeds 10 hours. Ensure this is correct.",
        day_none: "None / N/A",
        day_m: "Monday", day_t: "Tuesday", day_w: "Wednesday", day_th: "Thursday", day_f: "Friday", l_days_off: "Days Off",
        
        // Exceptions & Statutory Config
        t_except: "3. Exceptions & Deductions", l_ot: "Day OT (Hrs)", l_night_ot: "Night OT (Hrs)", l_late: "Lateness (Hrs)",
        l_other_ded: "Other Deduct ($)", h_tip: "Tip: You can type multiple deductions like <strong>3.43 + 5</strong>",
        t_stat: "Statutory Config", l_night: "Apply Standard Night Shift (25%)", l_vialidad: "Municipal Tax", btn_calc: "Calculate",
        t_est_disc: "<i class='fas fa-exclamation-triangle me-1'></i> <strong>Estimate Only:</strong> Based on perfect biometric clock-ins. Final company payouts may differ.",
        
        // Annual Benefits Inputs
        t_annual: "4. Annual Benefits (Optional)", l_seniority: "Time with Employer",
        sen_none: "Do not calculate", sen_1: "Less than 1 Year", sen_3: "1 to 3 Years", sen_10: "3 to 10 Years", sen_plus: "More than 10 Years",
        l_days_worked: "Days Worked (For Proportional Aguinaldo)", l_vac_percent: "Company Vacation Bonus (%)",
        h_vac_law: "By law, this is 30% of a 15-day salary. Change only if your company offers more.",
        
        // Tooltips (Microcopy Context)
        tt_ot: "Extra hours worked outside your normal schedule during the day (6:00 AM - 7:00 PM). Pays double.",
        tt_night_ot: "Extra hours worked outside your normal schedule during the night (7:00 PM - 6:00 AM). Pays 250%.",
        tt_night: "Your normal, scheduled shift hours that happen to fall between 7:00 PM and 6:00 AM.",

        // The Official Payslip Output
        r_std: "Standard", r_night: "Night", r_ot: "OT", r_hol: "Holiday",
        theme_dark: "Dark", theme_light: "Light", theme_cherry: "Cherry",
        t_payslip: "Official Payslip", t_awaiting: "Awaiting Data", t_awaiting_sub: "Please enter your financial information and schedule on the left to generate your official payslip.", t_engine_auto: "Engine Auto-Detected:",
        p_base: "Adjusted Base (Semi-Monthly)", p_bonus: "Bonus / Additional Pay", p_hol_day: "Holiday Pay (Day)", 
        p_hol_night: "Holiday Pay (Night 150%)", p_night_sur: "Night Shift (25%)", p_ot: "Overtime Pay (Day 200%)", 
        p_night_ot: "Night Overtime (250%)",
        p_late: "Lateness Deductions", p_gross: "Total Gross Pay", p_isss: "ISSS Deduction", p_afp: "AFP Deduction", 
        p_vialidad: "Municipal Tax", p_isr: "Income Tax Withheld", p_other_ded: "Other Deductions", p_tot_ded: "TOTAL DEDUCTIONS",
        p_final_net: "Final Net Pay", p_emp_cont: "Employer Contributions (Info)",
        
        // Annual Benefits Outputs
        t_annual_out: "Annual Benefits", p_vac_bonus: "Vacation Bonus", p_agui: "Christmas Bonus",
        p_annual_disc: "<i class=\"fas fa-info-circle me-1\" style=\"color: var(--highlight);\"></i> These annual payments are <strong>not</strong> included in the 15-day Net Pay above. Vacation bonuses are exempt from statutory deductions.",
        
        // Forecasts & Legal Guide
        f_title: "Financial Horizon", f_desc: "Projections based on statutory holiday analysis and behavioral modeling. Actual payout may vary.",
        lg_title: "Legal Guide", lg_ded: "Mandatory Deductions", lg_afp: "<strong>AFP (7.25%):</strong> Your contribution to your pension fund. Your employer also contributes an additional 8.75% on your behalf.",
        lg_isss: "<strong>ISSS (3%):</strong> Social Security deduction, capped at a maximum of $30.00 monthly. Employer pays an additional 7.5%.",
        lg_hol: "Mandatory Holidays", lg_hol_desc: "Employees working on a mandatory holiday earn double their standard salary for that day.",
        h1: "January 1st (New Year)", h2: "Holy Thursday, Friday, and Saturday (Easter)", h3: "May 1st (Labor Day)", h4: "May 10th (Mother's Day)", h5: "June 17th (Father's Day)", h6: "August 6th (El Salvador del Mundo)", h7: "September 15th (Independence Day)", h8: "November 2nd (All Souls' Day)", h9: "December 25th (Christmas)",
        lg_bonuses: "Annual Bonuses", lg_14: "<strong>14th Month:</strong> Paid Jan 15-25. Equivalent to 50% of your monthly salary. Exempt from ISR, ISSS, and AFP.",
        lg_vac: "<strong>Vacation Bonus:</strong> Corresponds to 30% of a 15-day salary. Not subject to statutory deductions.",
        lg_agui: "<strong>Aguinaldo (Christmas Bonus):</strong> Must be paid by Dec 20th. Based on years of service:",
        a1: "1 to 3 years: Equivalent to 15 days salary.", a2: "3 to 10 years: Equivalent to 19 days salary.", a3: "10+ years: Equivalent to 21 days salary.",
        lg_footer: "Calculations based on 2025 Income Tax Retention Tables (Official Gazette Tomo 447).",
        t_export: "Export & Save", btn_print: "Print Official Payslip",
        lg_source: "Official Sources", lg_tomo: "Calculations based on 2026 Income Tax Retention Tables (Official Gazette Tomo 451, April 7, 2026).",
        btn_download: "Download Official Gazette", btn_visit: "Browse Official Gazettes",
        lg_disclaimer: "<strong>Disclaimer:</strong> We are not affiliated with the government of El Salvador. Tax tables are subject to change. This tool does not constitute legal or financial advice and is strictly for informational purposes to estimate local employer calculations.",
        
        // Footer Virality
        t_share: "Share this Tool", btn_copy: "Copy Link", msg_copied: "Copied!",
        t_contact: "Rescue Yotch from <code style='color: var(--highlight); font-family: monospace; font-size: 1.1em;'>/dev/null</code>"
    },
    es: {
        // Navbar & Inputs
        nav_title: "YotchApps | Planilla SV",
        t_engine: "Motor de Tiempo y Pago", t_base_fin: "1. Fundamentos Financieros", l_salary: "Salario Mensual ($)", l_bonus: "Bono ($)",
        t_auto_sched: "2. Auto-Agendamiento", l_start: "Fecha de Inicio (Quincena)", h_scan: "El motor escanea automáticamente 15 días buscando asuetos.",
        l_std_in: "Entrada Normal", l_std_out: "Salida Normal", l_short_day: "Día Corto", l_short_in: "Día Corto (Entrada)", l_short_out: "Día Corto (Salida)",
        w_shift_10: "Advertencia: El turno excede las 10 horas. Verifica que sea correcto.",
        day_none: "Ninguno / N/A",
        day_m: "Lunes", day_t: "Martes", day_w: "Miércoles", day_th: "Jueves", day_f: "Viernes", l_days_off: "Días Libres",
        
        // Exceptions & Statutory Config
        t_except: "3. Excepciones y Descuentos", l_ot: "Extras Día (Hrs)", l_night_ot: "Extras Noche (Hrs)", l_late: "Tardanzas (Hrs)",
        l_other_ded: "Otros Descuentos ($)", h_tip: "Tip: Puedes sumar descuentos así: <strong>3.43 + 5</strong>",
        t_stat: "Configuración de Ley", l_night: "Aplicar Nocturnidad Estándar (25%)", l_vialidad: "Vialidad", btn_calc: "Calcular",
        t_est_disc: "<i class='fas fa-exclamation-triangle me-1'></i> <strong>Estimación:</strong> Basado en marcaciones biometricas perfectas. El pago final puede variar.",
        
        // Phase 3: Annual Benefits Inputs
        t_annual: "4. Beneficios Anuales (Opcional)", l_seniority: "Tiempo con el Empleador",
        sen_none: "No calcular", sen_1: "Menos de 1 Año", sen_3: "1 a 3 Años", sen_10: "3 a 10 Años", sen_plus: "Más de 10 Años",
        l_days_worked: "Días Trabajados (Para Aguinaldo Proporcional)", l_vac_percent: "Bono por Vacaciones de la Empresa (%)",
        h_vac_law: "Por ley, es el 30% de 15 días de salario. Cámbialo solo si tu empresa ofrece más.",

        // Tooltips (Microcopy Context)
        tt_ot: "Horas extra trabajadas fuera de tu horario normal de día (6:00 AM - 7:00 PM). Se pagan doble.",
        tt_night_ot: "Horas extra trabajadas fuera de tu horario normal de noche (7:00 PM - 6:00 AM). Se pagan al 250%.",
        tt_night: "Tus horas de turno normal y programado que caen entre las 7:00 PM y las 6:00 AM (Recargo por Nocturnidad).",

        // The Official Payslip Output
        r_std: "Normal", r_night: "Nocturno", r_ot: "Extra", r_hol: "Asueto",
        theme_dark: "Oscuro", theme_light: "Claro", theme_cherry: "Cereza",
        t_payslip: "Boleta de Pago Oficial", t_awaiting: "Esperando Datos", t_awaiting_sub: "Ingresa tu información financiera y horario en el panel izquierdo para generar tu boleta de pago.", t_engine_auto: "Detección Automática:",
        p_base: "Quincena Base (Ajustada)", p_bonus: "Bono / Pago Adicional", p_hol_day: "Pago por Asueto (Día)", 
        p_hol_night: "Pago por Asueto (Noche 150%)", p_night_sur: "Nocturnidad (25%)", p_ot: "Horas Extras Día (200%)", 
        p_night_ot: "Horas Extras Noche (250%)",
        p_late: "Descuento Tardanzas", p_gross: "Salario Bruto Total", p_isss: "Descuento ISSS", p_afp: "Descuento AFP", 
        p_vialidad: "Descuento Vialidad", p_isr: "Impuesto sobre la Renta", p_other_ded: "Otros Descuentos", p_tot_ded: "TOTAL DE DESCUENTOS",
        p_final_net: "Salario Líquido Final", p_emp_cont: "Aportes Patronales (Info)",
        
        // Phase 3: Annual Benefits Outputs
        t_annual_out: "Beneficios Anuales", p_vac_bonus: "Bono por Vacaciones", p_agui: "Aguinaldo",
        p_annual_disc: "<i class=\"fas fa-info-circle me-1\" style=\"color: var(--highlight);\"></i> Estos pagos anuales <strong>no</strong> se incluyen en el salario quincenal mostrado arriba. El bono vacacional está exento de descuentos legales.",
        
        // Forecasts & Legal Guide
        f_title: "Horizonte Financiero", f_desc: "Proyecciones basadas en análisis de asuetos y modelos de comportamiento. El pago real puede variar.",
        lg_title: "Guía Legal", lg_ded: "Descuentos de Ley", lg_afp: "<strong>AFP (7.25%):</strong> Tu aporte al fondo de pensiones. Tu empleador aporta un 8.75% adicional.",
        lg_isss: "<strong>ISSS (3%):</strong> Seguro Social, con techo máximo de $30.00 mensuales. Tu empleador aporta un 7.5% adicional.",
        lg_hol: "Asuetos de Ley", lg_hol_desc: "Los empleados que trabajan en un asueto obligatorio ganan el doble de su salario estándar por ese día.",
        h1: "1 de Enero (Año Nuevo)", h2: "Jueves, Viernes y Sábado Santo", h3: "1 de Mayo (Día del Trabajo)", h4: "10 de Mayo (Día de la Madre)", h5: "17 de Junio (Día del Padre)", h6: "6 de Agosto (Día de El Salvador del Mundo)", h7: "15 de Septiembre (Día de la Independencia)", h8: "2 de Noviembre (Día de los Difuntos)", h9: "25 de Diciembre (Navidad)",
        lg_bonuses: "Bonificaciones Anuales", lg_14: "<strong>Quincena 25:</strong> Pagado del 15 al 25 de enero. Equivalente al 50% de tu salario mensual. Exento de ISR, ISSS y AFP.",
        lg_vac: "<strong>Bono Vacacional:</strong> Corresponde al 30% de 15 días de salario. No sujeto a descuentos de ley.",
        lg_agui: "<strong>Aguinaldo:</strong> Debe pagarse antes del 20 de Dic. Según años de servicio:",
        a1: "1 a 3 años: Equivalente a 15 días de salario.", a2: "3 a 10 años: Equivalente a 19 días de salario.", a3: "Más de 10 años: Equivalente a 21 días de salario.",
        lg_footer: "Cálculos basados en Tablas de Retención ISR 2025 (Diario Oficial Tomo 447).",
        t_export: "Exportar y Guardar", btn_print: "Imprimir Boleta Oficial",
        lg_source: "Fuentes Oficiales", lg_tomo: "Cálculos basados en Tablas de Retención ISR 2026 (Diario Oficial Tomo 451, 7 de Abril de 2026).",
        btn_download: "Descargar Diario Oficial", btn_visit: "Explorar Diarios Oficiales",
        lg_disclaimer: "<strong>Aviso Legal:</strong> No estamos afiliados con el gobierno de El Salvador. Las tablas de impuestos están sujetas a cambios. Esta herramienta no constituye asesoría legal o financiera; es estrictamente para fines informativos para estimar los cálculos de los empleadores locales.",
        
        // Footer Virality
        t_share: "Compartir Herramienta", btn_copy: "Copiar Enlace", msg_copied: "¡Copiado!",
        t_contact: "Rescata a Yotch de <code style='color: var(--highlight); font-family: monospace; font-size: 1.1em;'>/dev/null</code>"
    }
};

/**
 * ==========================================
 * STATE MANAGEMENT
 * ==========================================
 * Global variable storing the current language state.
 * Accessible via getCurrentLang() across modules.
 */
let currentLang = 'en';

export function getCurrentLang() { 
    return currentLang; 
}

/**
 * ==========================================
 * THE DOM TRANSLATION ENGINE
 * ==========================================
 * Executes a highly performant DOM sweep to instantly swap text, 
 * placeholders, and Bootstrap Tooltips to the selected language.
 */
export function translatePage(lang) {
    currentLang = lang;
    
    // 1. Translate Standard Text elements (h6, span, p, li)
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18n[lang][key]) el.innerHTML = i18n[lang][key];
    });
    
    // 2. Translate MDB Tooltips (title attribute & mdb-original-title)
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (i18n[lang][key]) {
            el.setAttribute('title', i18n[lang][key]);
            el.setAttribute('data-mdb-original-title', i18n[lang][key]); 
        }
    });

    // 3. Translate Dynamic Placeholders (Input fields)
    const customDed = document.getElementById('customDeductions');
    if (customDed) customDed.placeholder = lang === 'en' ? "e.g. 110.50 + 8.45" : "ej. 110.50 + 8.45";

    // 4. Trigger Python Re-Calculation
    // If the user has already generated a payslip, we must silently resubmit the 
    // payload to Python. This ensures that the Machine Learning "Insights" and 
    // "Engine Logs" are generated in the correct language by the backend.
    const engineLogs = document.getElementById('engine-logs');
    if (window.lastCalcData && engineLogs) {
        engineLogs.innerText = lang === 'en' 
            ? `Scanned 15 days. Found ${window.lastCalcData.engine.holiday_hours} Holiday Hrs, ${window.lastCalcData.engine.holiday_night_hours} Hol-Night Hrs, and ${window.lastCalcData.engine.night_hours} Standard Night Hrs.`
            : `Escaneado 15 días. Detectado ${window.lastCalcData.engine.holiday_hours} hrs de Asueto, ${window.lastCalcData.engine.holiday_night_hours} hrs Asueto-Noche, y ${window.lastCalcData.engine.night_hours} hrs Nocturnas.`;
        
        document.getElementById('calc-form').dispatchEvent(new Event('submit'));
    }
}

/**
 * ==========================================
 * BOOT INITIALIZATION
 * ==========================================
 * Binds the click event to the Navbar translation button and 
 * runs the first translation sweep upon application load.
 */
export function initI18n() {
    const langBtn = document.getElementById('lang-toggle');
    const langLabel = document.getElementById('lang-label');
    
    if (langBtn) {
        langBtn.addEventListener('click', () => {
            const newLang = currentLang === 'en' ? 'es' : 'en';
            langLabel.innerText = newLang.toUpperCase();
            translatePage(newLang);
        });
    }
    
    // Force the first paint on DOM Boot
    translatePage(currentLang);
}