/**
 * ============================================================================
 * YOTCHAPPS PAYROLL ENGINE - USER INTERFACE (UI) MODULE
 * ============================================================================
 * This module strictly handles the DOM physics, input interactions, and 
 * cinematic animations. It isolates UI behavior from the API payload logic.
 * 
 * Core Responsibilities:
 * 1. Cinematic Counter: Animates the Final Net Pay metric.
 * 2. Shift Validation: Mathematically detects >10hr shifts (including overnights).
 * 3. Dynamic Toggles: Fades and disables UI elements based on user selections.
 * 4. MDB Tooltips: Instantiates native Bootstrap hover elements.
 * 5. Flatpickr Scroll Engine: Binds mouse-wheel events to the custom time inputs.
 * ============================================================================
 */

export function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        
        // Easing function for a cinematic, decelerating count-up
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 4); 
        const current = (start + (end - start) * easeOut).toFixed(2);
        
        obj.innerHTML = `$${current}`;
        
        if (progress < 1) window.requestAnimationFrame(step);
        else obj.innerHTML = `$${end.toFixed(2)}`; // Snap to final exact value
    };
    window.requestAnimationFrame(step);
}

/**
 * Mathematically checks if a shift > 10 hours. 
 * Elegantly handles 24-hour overnight cross-overs (e.g., 20:00 to 06:00).
 */
function validateShifts() {
    const check = (inId, outId, warnId) => {
        const tIn = document.getElementById(inId)?.value;
        const tOut = document.getElementById(outId)?.value;
        const warnEl = document.getElementById(warnId);
        
        if (!tIn || !tOut || !warnEl) return;
        
        // Convert "10:30" string into numeric 10.5 hours for math processing
        const [hIn, mIn] = tIn.split(':').map(Number);
        const [hOut, mOut] = tOut.split(':').map(Number);
        
        // Calculate raw difference
        let diff = (hOut + mOut / 60) - (hIn + mIn / 60);
        
        // If diff is negative or 0, it indicates an overnight shift crossing midnight
        if (diff <= 0) diff += 24; 
        
        // Dynamically display the yellow Soft Warning if > 10 hours
        warnEl.style.display = diff > 10 ? 'block' : 'none';
    };
    
    check('shiftIn', 'shiftOut', 'warning-std-shift');
    check('shortIn', 'shortOut', 'warning-short-shift');
}

/**
 * The Master UI Initialization Function.
 * Triggered once on boot by main.js.
 */
export function initUI() {
    
    // ==========================================
    // 1. MDB TOOLTIP INITIATION
    // ==========================================
    // Bootstraps native Material Design hover tooltips to provide microcopy context
    const tooltips = document.querySelectorAll('[data-mdb-toggle="tooltip"]');
    if (typeof mdb !== 'undefined' && tooltips.length > 0) {
        tooltips.forEach(el => new mdb.Tooltip(el));
    }

    // ==========================================
    // 2. INPUT SANITIZATION
    // ==========================================
    // Prevents alphabet characters from entering the custom math equation field
    const customDedInput = document.getElementById('customDeductions');
    if (customDedInput) {
        customDedInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9.,+\s]/g, '');
        });
    }

    // ==========================================
    // 3. SHORT DAY TOGGLE PHYSICS
    // ==========================================
    // If user selects "None / N/A" (-1), smoothly fade out and disable the time inputs
    const shortDaySelect = document.getElementById('shortDay');
    const shortIn = document.getElementById('shortIn');
    const shortOut = document.getElementById('shortOut');
    
    if (shortDaySelect && shortIn && shortOut) {
        shortDaySelect.addEventListener('change', (e) => {
            const isNone = e.target.value === '-1';
            
            shortIn.disabled = isNone;
            shortOut.disabled = isNone;
            
            // Visual cue that the element is deactivated
            shortIn.parentElement.style.opacity = isNone ? '0.4' : '1';
            shortOut.parentElement.style.opacity = isNone ? '0.4' : '1';
            shortIn.parentElement.style.transition = 'opacity 0.3s ease';
            shortOut.parentElement.style.transition = 'opacity 0.3s ease';
        });
        shortDaySelect.dispatchEvent(new Event('change')); // Trigger once on boot
    }

    // ==========================================
    // 4. ANNUAL BENEFITS TOGGLE PHYSICS
    // ==========================================
    // Only display the "Days Worked" proportional input if seniority is < 1 Year
    const senioritySelect = document.getElementById('seniority');
    const daysWorkedContainer = document.getElementById('daysWorkedContainer');
    
    if (senioritySelect && daysWorkedContainer) {
        senioritySelect.addEventListener('change', (e) => {
            const isLessThanOneYear = e.target.value === '0';
            daysWorkedContainer.style.display = isLessThanOneYear ? 'block' : 'none';
        });
        senioritySelect.dispatchEvent(new Event('change')); // Trigger once on boot
    }

    // ==========================================
    // 5. FLATPICKR MULTI-ENGINE BINDINGS
    // ==========================================
    if (typeof flatpickr !== 'undefined') {
        
        // MDB Label Fix: Forces the floating label UP into the notch when Flatpickr inserts data
        const fixMDBLabel = (selectedDates, dateStr, instance) => {
            if (dateStr) instance.input.classList.add('active');
            else instance.input.classList.remove('active');
        };

        // Initialize Time Pickers
        flatpickr("input[type=time]", {
            enableTime: true, 
            noCalendar: true, 
            dateFormat: "H:i", 
            time_24hr: false, // UI shows AM/PM, DOM stores 24hr for Python
            onReady: fixMDBLabel,
            onChange: function(selectedDates, dateStr, instance) {
                fixMDBLabel(selectedDates, dateStr, instance);
                validateShifts(); // Instantly validate shift > 10 hours
            }
        });

        // Initialize Date Picker
        flatpickr("#startDate", { 
            dateFormat: "Y-m-d",
            onReady: fixMDBLabel,
            onChange: fixMDBLabel
        });

        // THE MOUSE SCROLL PHYSICS HACK
        // Natively bypasses Chrome's strict scrolling locks to allow wheel-spinning
        // on the Flatpickr time interface without scrolling the entire webpage.
        document.addEventListener('wheel', function(e) {
            const timeWrapper = e.target.closest('.numInputWrapper');
            if (timeWrapper) {
                e.preventDefault(); 
                const upArrow = timeWrapper.querySelector('.arrowUp');
                const downArrow = timeWrapper.querySelector('.arrowDown');
                
                if (e.deltaY < 0 && upArrow) upArrow.click();       // Scroll UP
                else if (e.deltaY > 0 && downArrow) downArrow.click(); // Scroll DOWN
            }
        }, { passive: false }); // "passive: false" is critical to allow e.preventDefault()
    }

    // Final sanity check on boot: Ensure HTML default inputs don't violate the 10-hour rule
    validateShifts();
}