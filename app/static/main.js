/**
 * ============================================================================
 * YOTCHAPPS PAYROLL ENGINE - MAIN CONTROLLER
 * ============================================================================
 * This is the central Traffic Controller for the application. 
 * It strictly adheres to the Single Responsibility Principle (SRP) by importing 
 * specialized ES6 modules (i18n, Theme, UI) to handle isolated logic.
 * 
 * Responsibilities:
 * 1. Bootstrapping the Micro-Engines on DOM Load.
 * 2. Managing DOM Resets (Clearing the UI).
 * 3. Intercepting PDF Print Commands.
 * 4. Managing the Share/Virality Engine (WhatsApp & Clipboard).
 * 5. Assembling the JSON Payload, validating inputs, and fetching the Python API.
 * 6. Rendering the complex JSON response (Payslip & ML Forecasts) into the DOM.
 * ============================================================================
 */

import { getCurrentLang, initI18n, translatePage } from './js/i18n.js';
import { initTheme } from './js/theme.js';
import { initUI, animateValue } from './js/ui.js';

document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 0. BOOTSTRAP MICRO-ENGINES
    // ==========================================
    initUI();
    initTheme();
    initI18n();

    // Securely extract the CSRF token injected by Flask-WTF
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';
    const calcForm = document.getElementById('calc-form');
    
    if (calcForm) {
        
        // ==========================================
        // 1. THE DOM RESET ENGINE
        // ==========================================
        const btnReset = document.getElementById('btn-reset');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                window.lastCalcData = null; 
                calcForm.reset();           
                
                const dateInput = document.getElementById('startDate');
                if (dateInput && dateInput._flatpickr) dateInput._flatpickr.clear();
                
                document.querySelectorAll("input[type=time]").forEach(input => {
                    if (input._flatpickr) input._flatpickr.setDate(input.getAttribute('value') || "");
                });
                
                document.querySelectorAll('.form-outline .form-control').forEach(el => {
                    if (!el.value) el.classList.remove('active');
                });
                
                document.getElementById('results-panel').style.display = 'none';
                const ratesPanel = document.getElementById('rates-panel');
                if (ratesPanel) ratesPanel.style.display = 'none';
                document.getElementById('empty-state').style.display = 'block';
                
                document.getElementById('forecast-panel').style.display = 'none';
                document.getElementById('radar-container').innerHTML = '';
                const annualPanel = document.getElementById('annual-panel');
                if (annualPanel) annualPanel.style.display = 'none';

                // Clear Oracle Fields
                document.getElementById('goalName').value = '';
                document.getElementById('goalAmount').value = '';
                document.getElementById('oracle-output').innerText = '';

                document.getElementById('shortDay')?.dispatchEvent(new Event('change'));
                document.getElementById('seniority')?.dispatchEvent(new Event('change'));
                
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // ==========================================
        // 2. THE PDF PRINT ENGINE
        // ==========================================
        const btnPrint = document.getElementById('btn-print');
        if (btnPrint) {
            btnPrint.addEventListener('click', () => {
                const curLang = getCurrentLang();
                if (document.getElementById('results-panel').style.display === 'none') {
                    alert(curLang === 'en' ? "Please calculate your payroll first before printing." : "Por favor calcula tu planilla primero antes de imprimir.");
                    return;
                }
                window.print();
            });
        }

        // ==========================================
        // 3. THE SHARE & VIRALITY ENGINE
        // ==========================================
        const btnCopy = document.getElementById('btn-copy');
        const textCopy = document.getElementById('text-copy');
        const btnWa = document.getElementById('btn-wa');
        
        if (btnCopy && btnWa) {
            const currentUrl = window.location.href; 
            const waMessage = encodeURIComponent("Check out this exact SV Payroll Calculator! 🇸🇻💰 ");
            
            btnWa.href = `https://wa.me/?text=${waMessage}${encodeURIComponent(currentUrl)}`;
            
            btnCopy.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(currentUrl);
                    const originalText = textCopy.innerText;
                    textCopy.innerText = getCurrentLang() === 'en' ? "Copied!" : "¡Copiado!";
                    
                    btnCopy.classList.replace('btn-outline-theme', 'btn-theme');
                    
                    setTimeout(() => {
                        textCopy.innerText = originalText;
                        btnCopy.classList.replace('btn-theme', 'btn-outline-theme');
                    }, 2000);
                } catch (err) {
                    console.error("Failed to copy URL to clipboard", err);
                }
            });
        }

        // ==========================================
        // 3.5 THE ORACLE BUTTON LISTENER
        // ==========================================
        // Triggers the main calcForm invisibly so the Oracle data is fetched without a page reload.
        const btnOracle = document.getElementById('btn-oracle');
        if (btnOracle) {
            btnOracle.addEventListener('click', () => {
                calcForm.dispatchEvent(new Event('submit'));
            });
        }

        // ==========================================
        // 4. THE PAYLOAD ASSEMBLY & API FETCH
        // ==========================================
        calcForm.addEventListener('submit', async function(e) {
            e.preventDefault(); 
            const curLang = getCurrentLang();
            
            // Extract Base Financials
            const baseSalary = parseFloat(document.getElementById('baseSalary').value || 0);
            const bonus = parseFloat(document.getElementById('bonus').value || 0);
            
            const rawDeductions = document.getElementById('customDeductions').value || "0";
            const customDeductions = rawDeductions.replace(/,/g, '+').split('+').map(val => parseFloat(val.trim()) || 0).reduce((a, b) => a + b, 0);

            const otHours = parseFloat(document.getElementById('otHours').value || 0);
            const lateHours = parseFloat(document.getElementById('lateHours').value || 0);
            const daysOffNodes = document.querySelectorAll('.days-off:checked');
            
            const apply_isss = document.getElementById('toggleISSS').checked;
            const apply_afp = document.getElementById('toggleAFP').checked;
            const apply_vialidad = document.getElementById('toggleVialidad').checked;
            const apply_night = document.getElementById('toggleNight').checked;
            
            const seniority = parseInt(document.getElementById('seniority').value || -1);
            const daysWorked = parseInt(document.getElementById('daysWorked').value || 365);
            const vacPercent = parseFloat(document.getElementById('vacationPercent').value || 30);

            // Extract Oracle Data
            const goalName = document.getElementById('goalName') ? document.getElementById('goalName').value : '';
            const goalAmount = document.getElementById('goalAmount') ? parseFloat(document.getElementById('goalAmount').value || 0) : 0.0;

            if (baseSalary < 0 || bonus < 0 || otHours < 0 || lateHours < 0 || customDeductions < 0) {
                alert(curLang === 'en' ? "🚫 BUSTED: Nice try. You cannot have negative money or time." : "🚫 Error: Los números no pueden ser negativos.");
                return;
            }

            const payload = {
                lang: curLang,
                monthly_base: baseSalary, extra_bonus: bonus, custom_deductions: customDeductions,
                ot_hours: otHours, late_hours: lateHours, 
                apply_isss: apply_isss, apply_afp: apply_afp, apply_vialidad: apply_vialidad, apply_night: apply_night, 
                
                start_date: document.getElementById('startDate').value,
                shift_in: document.getElementById('shiftIn').value, shift_out: document.getElementById('shiftOut').value, 
                short_day: parseInt(document.getElementById('shortDay').value), short_in: document.getElementById('shortIn').value,
                short_out: document.getElementById('shortOut').value, days_off: Array.from(daysOffNodes).map(n => parseInt(n.value)),
                
                seniority: seniority, days_worked: daysWorked, vac_percent: vacPercent,
                goal_name: goalName, goal_amount: goalAmount
            };

            try {
                const res = await fetch('/api/calculate', {
                    method: 'POST',
                    headers: { 'X-CSRFToken': csrfToken, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const data = await res.json();
                
                if (!res.ok) { alert(`⚠️ Error: ${data.error || 'Server rejected calculation.'}`); return; }
                
                window.lastCalcData = data; 
                
                // ==========================================
                // 5. DOM INJECTION (OFFICIAL PAYSLIP)
                // ==========================================
                document.getElementById('empty-state').style.display = 'none';
                document.getElementById('results-panel').style.display = 'block';
                const ratesPanel = document.getElementById('rates-panel');
                if (ratesPanel) ratesPanel.style.display = 'block';

                document.getElementById('rate-std').innerText = `$${data.rates.hourly.toFixed(2)}/hr`;
                document.getElementById('rate-night').innerText = `$${data.rates.night.toFixed(2)}/hr`;
                document.getElementById('rate-ot').innerText = `$${data.rates.ot.toFixed(2)}/hr`;
                document.getElementById('rate-hol').innerText = `$${data.rates.holiday.toFixed(2)}/hr`;

                const engineLogs = document.getElementById('engine-logs');
                if (engineLogs) {
                    engineLogs.innerText = curLang === 'en' 
                        ? `Scanned 15 days. Found ${data.engine.holiday_hours} Holiday Hrs, ${data.engine.holiday_night_hours} Hol-Night Hrs, and ${data.engine.night_hours} Standard Night Hrs.`
                        : `Escaneado 15 días. Detectado ${data.engine.holiday_hours} hrs de Asueto, ${data.engine.holiday_night_hours} hrs Asueto-Noche, y ${data.engine.night_hours} hrs Nocturnas.`;
                }

                document.getElementById('res-base').innerText = `$${data.adjusted_base.toFixed(2)}`;
                document.getElementById('res-gross').innerText = `$${data.gross.toFixed(2)}`;
                document.getElementById('res-isr').innerText = `-$${data.isr.toFixed(2)}`;

                const setDisplay = (id, condition, valStr) => {
                    const el = document.getElementById(id);
                    if (!el) return;
                    if (condition) {
                        el.style.setProperty('display', 'flex', 'important'); 
                        if (valStr) document.getElementById(id.replace('row-', 'res-')).innerText = valStr; 
                    } else el.style.setProperty('display', 'none', 'important'); 
                };
                
                setDisplay('row-bonus', data.extra_bonus > 0, `+$${(data.extra_bonus || 0).toFixed(2)}`);
                setDisplay('row-ot', data.ot_pay > 0, `+$${data.ot_pay.toFixed(2)}`);
                setDisplay('row-night-ot', data.night_ot_pay > 0, `+$${data.night_ot_pay.toFixed(2)}`);
                setDisplay('row-holiday', data.holiday_pay > 0, `+$${data.holiday_pay.toFixed(2)}`);
                setDisplay('row-hol-night', data.holiday_night_pay > 0, `+$${data.holiday_night_pay.toFixed(2)}`);
                setDisplay('row-night', data.night_pay > 0, `+$${data.night_pay.toFixed(2)}`);
                setDisplay('row-late', data.late_deduction > 0, `-$${data.late_deduction.toFixed(2)}`);
                setDisplay('row-custom', data.custom_deductions > 0, `-$${data.custom_deductions.toFixed(2)}`);
                setDisplay('row-isss', apply_isss, `-$${data.isss.toFixed(2)}`);
                setDisplay('row-afp', apply_afp, `-$${data.afp.toFixed(2)}`);
                setDisplay('row-vialidad', apply_vialidad, `-$${data.vialidad.toFixed(2)}`);
                
                setDisplay('row-isss-emp', apply_isss, `$${(data.isss_employer || 0).toFixed(2)}`);
                setDisplay('row-afp-emp', apply_afp, `$${(data.afp_employer || 0).toFixed(2)}`);

                const eTotalDed = document.getElementById('res-total-deductions');
                if (eTotalDed) eTotalDed.innerText = `-$${data.total_deductions.toFixed(2)}`;

                animateValue('res-net', 0, data.net, 1200);

                // ==========================================
                // 6. DOM INJECTION (ANNUAL BENEFITS CARD)
                // ==========================================
                const annualPanel = document.getElementById('annual-panel');
                if (annualPanel) {
                    if (data.annual && data.annual.seniority_tier >= 0) {
                        annualPanel.style.display = 'block';
                        document.getElementById('res-vac-bonus').innerText = `+$${data.annual.vacation.toFixed(2)}`;
                        document.getElementById('res-agui').innerText = `+$${data.annual.aguinaldo.toFixed(2)}`;
                        document.getElementById('res-vac-detail').innerText = `${data.annual.vac_percent}%`;
                        
                        let aguiDetail = curLang === 'en' ? "Proportional" : "Proporcional";
                        if (data.annual.seniority_tier === 1) aguiDetail = curLang === 'en' ? "15 Days Salary" : "15 Días de Salario";
                        else if (data.annual.seniority_tier === 2) aguiDetail = curLang === 'en' ? "19 Days Salary" : "19 Días de Salario";
                        else if (data.annual.seniority_tier === 3) aguiDetail = curLang === 'en' ? "21 Days Salary" : "21 Días de Salario";
                        document.getElementById('res-agui-detail').innerText = aguiDetail;
                    } else {
                        annualPanel.style.display = 'none'; 
                    }
                }

                // ==========================================
                // 7. DOM INJECTION (AI INSIGHTS & ORACLE)
                // ==========================================
                if (data.forecasts) {
                    const forecastPanel = document.getElementById('forecast-panel');
                    forecastPanel.style.display = 'block';
                    
                    // Inject Tab 1: Radar Slots
                    const radarContainer = document.getElementById('radar-container');
                    radarContainer.innerHTML = ''; 
                    
                    data.forecasts.radar.forEach(f => {
                        const card = document.createElement('div');
                        card.className = "p-3 rounded";
                        card.style.backgroundColor = "var(--bg-color)";
                        card.style.border = "1px solid var(--border-color)";
                        card.style.borderLeft = `4px solid ${f.color}`; 
                        
                        card.innerHTML = `
                            <h6 class="fw-bold mb-1" style="color: ${f.color}; font-size: 0.9rem;">
                                <i class="${f.icon} me-1"></i> ${f.title}
                            </h6>
                            <div class="small text-muted" style="font-size: 0.8rem; line-height: 1.4;">
                                ${f.text}
                            </div>
                        `;
                        radarContainer.appendChild(card);
                    });

                    // Inject Tab 2: Oracle Result
                    document.getElementById('oracle-output').innerHTML = data.forecasts.oracle;
                }
            } catch (err) {
                console.error("API Error:", err);
                alert("An unexpected error occurred. Check the browser console.");
            }
        });
    }
});