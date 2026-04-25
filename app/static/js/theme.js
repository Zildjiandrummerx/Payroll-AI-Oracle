/**
 * ============================================================================
 * YOTCHAPPS PAYROLL ENGINE - OMNI-THEME MODULE
 * ============================================================================
 * This module controls the application's aesthetic states. It dynamically 
 * modifies the CSS Custom Properties (`var()`) located in `base.html` by 
 * swapping `data-theme` attributes on the root HTML document.
 * 
 * Core Responsibilities:
 * 1. The Theme Matrix: Manages states for Manjaro (Dark), Arch (Light), and Cherry.
 * 2. Persistent State: Saves and retrieves the user's aesthetic choice via LocalStorage.
 * 3. The Sakura Physics Engine: A lightweight particle generator that spawns 
 *    animated CSS falling petals exclusively when Cherry Mode is active.
 * ============================================================================
 */

// 1. GLOBAL STATE DEFINITIONS
const themes = ['manjaro', 'arch', 'cherry'];
const themeIcons = ['fa-moon', 'fa-desktop', 'fa-wine-glass'];
let currentThemeIndex = 0; // Defaults to Manjaro (0)
let sakuraInterval = null;

/**
 * ==========================================
 * THE DOM RENDER ENGINE
 * ==========================================
 * Injects the selected theme into the root document, updates the Navbar icon, 
 * toggles the Sakura Physics Engine, and writes the state to LocalStorage.
 * 
 * @param {number} index - The array index of the selected theme (0, 1, or 2).
 */
function applyTheme(index) {
    const themeName = themes[index];
    const iconElement = document.getElementById('theme-icon');
    
    // 1. Modify the DOM Root attribute to trigger CSS variable repaints
    // By removing the attribute, it naturally falls back to the default `:root` variables
    if (themeName === 'manjaro') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', themeName);
    }
    
    // 2. Dynamically update the MDB/FontAwesome Navbar Icon
    if (iconElement) {
        iconElement.className = `fas ${themeIcons[index]}`;
    }

    // 3. Mount or Demount the Sakura Particle Generator based on the theme
    const sakuraContainer = document.getElementById('sakura-container');
    if (themeName === 'cherry') {
        startSakuraEngine(sakuraContainer);
    } else {
        stopSakuraEngine(sakuraContainer);
    }

    // 4. Save the user's preference so it survives page reloads
    localStorage.setItem('yotch_theme', index);
}

/**
 * ==========================================
 * THE SAKURA PARTICLE GENERATOR
 * ==========================================
 * Dynamically spawns CSS-animated `<divs>` that simulate falling cherry blossoms.
 * It is highly optimized to run at 60fps without draining mobile battery.
 */
function startSakuraEngine(container) {
    if (sakuraInterval) return; // Prevent memory leaks if already running
    container.innerHTML = '';   // Flush any stale DOM elements
    
    // Initial Burst: Instantly spawn 30 scattered petals so the screen isn't empty
    for (let i = 0; i < 30; i++) {
        createPetal(container);
    }
    
    // Sustained Loop: Spawn 1 new petal every 400ms to maintain the aesthetic
    sakuraInterval = setInterval(() => { 
        createPetal(container); 
    }, 400); 
}

/**
 * ==========================================
 * THE SAKURA PHYSICS CALCULATOR
 * ==========================================
 * Generates a single petal with randomized CSS properties for size, 
 * starting horizontal position, fall speed, and sway intensity.
 */
function createPetal(container) {
    const petal = document.createElement('div');
    petal.className = 'petal';
    
    // Randomize scale between 8px and 18px
    const size = Math.random() * 10 + 8; 
    petal.style.width = `${size}px`;
    petal.style.height = `${size}px`;
    
    // Randomize the horizontal starting point across the 100vw viewport
    petal.style.left = `${Math.random() * 100}vw`; 
    
    // Randomize the CSS animation duration 
    const fallDuration = Math.random() * 5 + 5; // 5 to 10 seconds to hit the bottom
    const swayDuration = Math.random() * 2 + 2; // 2 to 4 seconds to sway side-to-side
    petal.style.animationDuration = `${fallDuration}s, ${swayDuration}s`;
    
    container.appendChild(petal);
    
    // Garbage Collection: Annihilate the petal from the DOM right after it 
    // falls off the screen to prevent infinite memory buildup
    setTimeout(() => { 
        if (petal.parentNode) petal.remove(); 
    }, fallDuration * 1000);
}

/**
 * Kills the interval and completely flushes the container from the DOM.
 */
function stopSakuraEngine(container) {
    clearInterval(sakuraInterval);
    sakuraInterval = null;
    container.innerHTML = '';
}

/**
 * ==========================================
 * BOOT INITIALIZATION
 * ==========================================
 * Binds the click events to the Navbar Hover Dropdown and checks LocalStorage 
 * to instantly paint the user's preferred theme on DOM Load.
 */
export function initTheme() {
    // 1. Bind to the MDB Dropdown links defined in index.html
    document.querySelectorAll('.theme-select').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault(); // Stop the page from accidentally jumping to the top
            
            // Extract the '0', '1', or '2' from the HTML attribute
            currentThemeIndex = parseInt(item.getAttribute('data-theme-id'));
            applyTheme(currentThemeIndex);
        });
    });

    // 2. Fetch the saved user preference
    const savedTheme = localStorage.getItem('yotch_theme');
    if (savedTheme !== null) {
        currentThemeIndex = parseInt(savedTheme);
    }
    
    // 3. Force the first paint
    applyTheme(currentThemeIndex);
}