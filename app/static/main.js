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
    // Initialize the specialized ES6 modules that handle UI physics, 
    // aesthetic themes, and the English/Spanish translation matrix.
    initUI();
    initTheme();
    initI18n();

    // Securely extract the CSRF token injected by Flask-WTF to prevent Cross-Site Request Forgery
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';
    const calcForm = document.getElementById('calc-form');
    
    if (calcForm) {
        
        // ==========================================
        // 1. THE DOM RESET ENGINE
        // ==========================================
        // Executes a highly orchestrated DOM wipe without requiring a hard page reload.
        const btnReset = document.getElementById('btn-reset');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                window.lastCalcData = null; // Clear session memory
                calcForm.reset();           // Wipe standard HTML inputs
                
                // Manually command Flatpickr to clear Date fields
                const dateInput = document.getElementById('startDate');
                if (dateInput && dateInput._flatpickr) dateInput._flatpickr.clear();
                
                // Resync Flatpickr Time fields back to their HTML default attributes (e.g., 10:00)
                document.querySelectorAll("input[type=time]").forEach(input => {
                    if (input._flatpickr) input._flatpickr.setDate(input.getAttribute('value') || "");
                });
                
                // Force Material Design Bootstrap (MDB) floating labels to drop down
                document.querySelectorAll('.form-outline .form-control').forEach(el => {
                    if (!el.value) el.classList.remove('active');
                });
                
                // Hide dynamic output panels and restore the "Awaiting Data" fingerprint state
                document.getElementById('results-panel').style.display = 'none';
                const ratesPanel = document.getElementById('rates-panel');
                if (ratesPanel) ratesPanel.style.display = 'none';
                document.getElementById('empty-state').style.display = 'block';
                
                // Hide Forecast and Annual Benefit panels
                document.getElementById('forecast-panel').style.display = 'none';
                document.getElementById('forecast-container').innerHTML = '';
                const annualPanel = document.getElementById('annual-panel');
                if (annualPanel) annualPanel.style.display = 'none';

                // Reset the Dynamic Toggles (Short Day & Seniority)
                document.getElementById('shortDay')?.dispatchEvent(new Event('change'));
                document.getElementById('seniority')?.dispatchEvent(new Event('change'));
                
                // Smooth scroll back to the top of the application
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // ==========================================
        // 2. THE PDF PRINT ENGINE
        // ==========================================
        // Intercepts the print command. Native browser CSS (@media print) handles the actual formatting.
        const btnPrint = document.getElementById('btn-print');
        if (btnPrint) {
            btnPrint.addEventListener('click', () => {
                const curLang = getCurrentLang();
                // Block printing if the user hasn't generated a payslip yet
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
        // Dynamically captures the current URL to allow instant sharing regardless of deployment environment.
        const btnCopy = document.getElementById('btn-copy');
        const textCopy = document.getElementById('text-copy');
        const btnWa = document.getElementById('btn-wa');
        
        if (btnCopy && btnWa) {
            const currentUrl = window.location.href; // Captures localhost, Cloud Run, or custom domains dynamically
            const waMessage = encodeURIComponent("Check out this exact SV Payroll Calculator! 🇸🇻💰 ");
            
            // Inject the URL into the official WhatsApp wa.me API
            btnWa.href = `https://wa.me/?text=${waMessage}${encodeURIComponent(currentUrl)}`;
            
            // Clipboard Copy Logic
            btnCopy.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(currentUrl);
                    const originalText = textCopy.innerText;
                    textCopy.innerText = getCurrentLang() === 'en' ? "Copied!" : "¡Copiado!";
                    
                    // Visually confirm copy by swapping CSS classes
                    btnCopy.classList.replace('btn-outline-theme', 'btn-theme');
                    
                    // Revert back to normal state after 2 seconds
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
        // 4. THE PAYLOAD ASSEMBLY & API FETCH
        // ==========================================
        // Listens for the form submission, extracts all DOM values, sanitizes them, 
        // and securely POSTs the JSON payload to the Python backend.
        calcForm.addEventListener('submit', async function(e) {
            e.preventDefault(); 
            const curLang = getCurrentLang();
            
            // Extract Base Financials
            const baseSalary = parseFloat(document.getElementById('baseSalary').value || 0);
            const bonus = parseFloat(document.getElementById('bonus').value || 0);
            
            // Safely parse custom deductions (e.g., converting "10.50 + 5" into 15.50)
            const rawDeductions = document.getElementById('customDeductions').value || "0";
            const customDeductions = rawDeductions.replace(/,/g, '+').split('+').map(val => parseFloat(val.trim()) || 0).reduce((a, b) => a + b, 0);

            // Extract Exception Data (Unified Overtime & Lateness)
            // Note: Night OT is now automatically split by the Python backend via the split_ot_hours engine.
            const otHours = parseFloat(document.getElementById('otHours').value || 0);
            const lateHours = parseFloat(document.getElementById('lateHours').value || 0);
            const daysOffNodes = document.querySelectorAll('.days-off:checked');
            
            // Extract Statutory Configurations (Booleans)
            const apply_isss = document.getElementById('toggleISSS').checked;
            const apply_afp = document.getElementById('toggleAFP').checked;
            const apply_vialidad = document.getElementById('toggleVialidad').checked;
            const apply_night = document.getElementById('toggleNight').checked;
            
            // Extract Annual Benefits Data
            const seniority = parseInt(document.getElementById('seniority').value || -1);
            const daysWorked = parseInt(document.getElementById('daysWorked').value || 365);
            const vacPercent = parseFloat(document.getElementById('vacationPercent').value || 30);

            // FRONTEND DEFENSE: Block negative injections before hitting the server
            if (baseSalary < 0 || bonus < 0 || otHours < 0 || lateHours < 0 || customDeductions < 0) {
                alert(curLang === 'en' ? "🚫 BUSTED: Nice try. You cannot have negative money or time." : "🚫 Error: Los números no pueden ser negativos.");
                return;
            }

            // Assemble the precise JSON Dictionary required by calculator.py
            const payload = {
                lang: curLang,
                monthly_base: baseSalary, extra_bonus: bonus, custom_deductions: customDeductions,
                ot_hours: otHours, late_hours: lateHours, 
                apply_isss: apply_isss, apply_afp: apply_afp, apply_vialidad: apply_vialidad, apply_night: apply_night, 
                
                // Schedule Variables
                start_date: document.getElementById('startDate').value,
                shift_in: document.getElementById('shiftIn').value, shift_out: document.getElementById('shiftOut').value, 
                short_day: parseInt(document.getElementById('shortDay').value), short_in: document.getElementById('shortIn').value,
                short_out: document.getElementById('shortOut').value, days_off: Array.from(daysOffNodes).map(n => parseInt(n.value)),
                
                // Annual Benefits
                seniority: seniority, days_worked: daysWorked, vac_percent: vacPercent
            };

            try {
                // Execute secure POST request with CSRF Token
                const res = await fetch('/api/calculate', {
                    method: 'POST',
                    headers: { 'X-CSRFToken': csrfToken, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const data = await res.json();
                
                // Handle Backend Rejections (e.g., 50KB Payload limit or 1,000,000 Salary Cap)
                if (!res.ok) { alert(`⚠️ Error: ${data.error || 'Server rejected calculation.'}`); return; }
                
                // Save successful payload to global memory for instant i18n translation swaps
                window.lastCalcData = data; 
                
                // ==========================================
                // 5. DOM INJECTION (OFFICIAL PAYSLIP)
                // ==========================================
                // Transition UI state from "Awaiting" to "Results"
                document.getElementById('empty-state').style.display = 'none';
                document.getElementById('results-panel').style.display = 'block';
                const ratesPanel = document.getElementById('rates-panel');
                if (ratesPanel) ratesPanel.style.display = 'block';

                // Inject 4-Tier Rates Panel
                document.getElementById('rate-std').innerText = `$${data.rates.hourly.toFixed(2)}/hr`;
                document.getElementById('rate-night').innerText = `$${data.rates.night.toFixed(2)}/hr`;
                document.getElementById('rate-ot').innerText = `$${data.rates.ot.toFixed(2)}/hr`;
                document.getElementById('rate-hol').innerText = `$${data.rates.holiday.toFixed(2)}/hr`;

                // Inject Python Engine Auto-Detection Logs (Bilingual)
                const engineLogs = document.getElementById('engine-logs');
                if (engineLogs) {
                    engineLogs.innerText = curLang === 'en' 
                        ? `Scanned 15 days. Found ${data.engine.holiday_hours} Holiday Hrs, ${data.engine.holiday_night_hours} Hol-Night Hrs, and ${data.engine.night_hours} Standard Night Hrs.`
                        : `Escaneado 15 días. Detectado ${data.engine.holiday_hours} hrs de Asueto, ${data.engine.holiday_night_hours} hrs Asueto-Noche, y ${data.engine.night_hours} hrs Nocturnas.`;
                }

                // Inject Primary Financials
                document.getElementById('res-base').innerText = `$${data.adjusted_base.toFixed(2)}`;
                document.getElementById('res-gross').innerText = `$${data.gross.toFixed(2)}`;
                document.getElementById('res-isr').innerText = `-$${data.isr.toFixed(2)}`;

                // Helper Function: Dynamically display/hide list items based on mathematical logic
                const setDisplay = (id, condition, valStr) => {
                    const el = document.getElementById(id);
                    if (!el) return;
                    if (condition) {
                        el.style.setProperty('display', 'flex', 'important'); // Show row
                        if (valStr) document.getElementById(id.replace('row-', 'res-')).innerText = valStr; // Update value
                    } else el.style.setProperty('display', 'none', 'important'); // Hide row
                };
                
                // Execute Dynamic UI Injection
                setDisplay('row-bonus', data.extra_bonus > 0, `+$${(data.extra_bonus || 0).toFixed(2)}`);
                setDisplay('row-ot', data.ot_pay > 0, `+$${data.ot_pay.toFixed(2)}`);
                setDisplay('row-night-ot', data.night_ot_pay > 0, `+$${data.night_ot_pay.toFixed(2)}`); // Injects the Python auto-split Night OT!
                setDisplay('row-holiday', data.holiday_pay > 0, `+$${data.holiday_pay.toFixed(2)}`);
                setDisplay('row-hol-night', data.holiday_night_pay > 0, `+$${data.holiday_night_pay.toFixed(2)}`);
                setDisplay('row-night', data.night_pay > 0, `+$${data.night_pay.toFixed(2)}`);
                setDisplay('row-late', data.late_deduction > 0, `-$${data.late_deduction.toFixed(2)}`);
                setDisplay('row-custom', data.custom_deductions > 0, `-$${data.custom_deductions.toFixed(2)}`);
                setDisplay('row-isss', apply_isss, `-$${data.isss.toFixed(2)}`);
                setDisplay('row-afp', apply_afp, `-$${data.afp.toFixed(2)}`);
                setDisplay('row-vialidad', apply_vialidad, `-$${data.vialidad.toFixed(2)}`);
                
                // Inject Employer Contributions (Info Only)
                setDisplay('row-isss-emp', apply_isss, `$${(data.isss_employer || 0).toFixed(2)}`);
                setDisplay('row-afp-emp', apply_afp, `$${(data.afp_employer || 0).toFixed(2)}`);

                // Inject Total Deductions
                const eTotalDed = document.getElementById('res-total-deductions');
                if (eTotalDed) eTotalDed.innerText = `-$${data.total_deductions.toFixed(2)}`;

                // Fire Cinematic Count-Up Animation for Final Net Pay
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
                        
                        // Localize the dynamic Aguinaldo Subtext
                        let aguiDetail = curLang === 'en' ? "Proportional" : "Proporcional";
                        if (data.annual.seniority_tier === 1) aguiDetail = curLang === 'en' ? "15 Days Salary" : "15 Días de Salario";
                        else if (data.annual.seniority_tier === 2) aguiDetail = curLang === 'en' ? "19 Days Salary" : "19 Días de Salario";
                        else if (data.annual.seniority_tier === 3) aguiDetail = curLang === 'en' ? "21 Days Salary" : "21 Días de Salario";
                        document.getElementById('res-agui-detail').innerText = aguiDetail;
                    } else {
                        annualPanel.style.display = 'none'; // Hide if user selected "Do Not Calculate"
                    }
                }

                // ==========================================
                // 7. DOM INJECTION (MACHINE LEARNING FORECASTS)
                // ==========================================
                if (data.forecasts && data.forecasts.length > 0) {
                    const forecastPanel = document.getElementById('forecast-panel');
                    const forecastContainer = document.getElementById('forecast-container');
                    forecastPanel.style.display = 'block';
                    forecastContainer.innerHTML = ''; // Wipe existing cards
                    
                    // Loop through the 3 behavioral tiers returned by forecaster.py
                    data.forecasts.forEach(f => {
                        const card = document.createElement('div');
                        card.className = "p-3 rounded";
                        card.style.backgroundColor = "var(--bg-color)";
                        card.style.border = "1px solid var(--border-color)";
                        
                        // Dynamic Border Assignment (Green for Trajectory, Gray for Baseline, Red for Penalty)
                        card.style.borderLeft = `4px solid ${f.color || "var(--mid-green)"}`; 
                        
                        // Assemble the HTML block using template literals and CSS variables for Omni-Theme support
                        card.innerHTML = `
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <span class="fw-bold text-muted small text-uppercase" style="letter-spacing: 0.5px;">${f.scenario}</span>
                                <span class="small fw-bold" style="color: var(--highlight);">${f.date_str}</span>
                            </div>
                            <h3 class="fw-bold mb-1" style="color: var(--forecast-text);">$${f.net_pay.toFixed(2)}</h3>
                            <div class="small text-muted" style="font-size: 0.8rem; line-height: 1.4;">
                                <i class="fas fa-magic me-1" style="color: ${f.color || "var(--highlight)"};"></i> ${f.insight}
                            </div>
                        `;
                        forecastContainer.appendChild(card);
                    });
                }
            } catch (err) {
                // Catch severe backend crashes (e.g. 500 Internal Server Error)
                console.error("API Error:", err);
                alert("An unexpected error occurred. Check the browser console.");
            }
        });
    }
});