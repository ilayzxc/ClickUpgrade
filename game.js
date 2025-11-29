// Game state
let score = 0;
let clickPower = 1;
let autoClickerPower = 0;
let autoClickerInterval;

// DOM elements
const scoreElement = document.getElementById('score');
const clickArea = document.getElementById('clickArea');
const autoClickerBtn = document.getElementById('autoClicker');
const clickMultiplierBtn = document.getElementById('clickMultiplier');

// Initialize the game
function initGame() {
    loadGame();
    setupEventListeners();
    setupAuthModal();
    updateUI();
    startAutoClicker();

    // Initialize auth system
    if (window.authModule) {
        window.authModule.initAuth();
    }
}

// Set up event listeners
function setupEventListeners() {
    // Click area
    clickArea.addEventListener('click', () => {
        addScore(clickPower);
        animateClick();
    });

    // Auto-clicker upgrade
    autoClickerBtn.addEventListener('click', () => {
        const cost = parseInt(autoClickerBtn.dataset.cost);
        if (score >= cost) {
            score -= cost;
            autoClickerPower += parseInt(autoClickerBtn.dataset.power);
            autoClickerBtn.dataset.cost = Math.floor(cost * 1.5);
            updateUpgradeButtons();
            updateUI();
            saveGame();
        }
    });

    // Click multiplier upgrade
    clickMultiplierBtn.addEventListener('click', () => {
        const cost = parseInt(clickMultiplierBtn.dataset.cost);
        if (score >= cost) {
            score -= cost;
            clickPower *= parseInt(clickMultiplierBtn.dataset.multiplier);
            clickMultiplierBtn.dataset.cost = Math.floor(cost * 3);
            updateUpgradeButtons();
            updateUI();
            saveGame();
        }
    });
}

// Set up authentication modal
function setupAuthModal() {
    const modal = document.getElementById('authModal');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const closeBtn = document.querySelector('.close');
    const logoutBtn = document.getElementById('logoutBtn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const loginSubmit = document.getElementById('loginSubmit');
    const registerSubmit = document.getElementById('registerSubmit');

    // Open modal for login
    loginBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        switchTab('login');
    });

    // Open modal for register
    registerBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        switchTab('register');
    });

    // Close modal
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        clearForms();
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            clearForms();
        }
    });

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    // Login submit
    loginSubmit.addEventListener('click', async () => {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');

        if (!username || !password) {
            errorDiv.textContent = 'Please fill in all fields';
            return;
        }

        loginSubmit.disabled = true;
        loginSubmit.textContent = 'Logging in...';
        errorDiv.textContent = '';

        const result = await window.authModule.loginUser(username, password);

        if (result.success) {
            modal.style.display = 'none';
            clearForms();
        } else {
            errorDiv.textContent = result.error || 'Login failed';
        }

        loginSubmit.disabled = false;
        loginSubmit.textContent = 'Login';
    });

    // Register submit
    registerSubmit.addEventListener('click', async () => {
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const errorDiv = document.getElementById('registerError');

        if (!username || !password) {
            errorDiv.textContent = 'Please fill in all fields';
            return;
        }

        if (password.length < 6) {
            errorDiv.textContent = 'Password must be at least 6 characters';
            return;
        }

        registerSubmit.disabled = true;
        registerSubmit.textContent = 'Creating account...';
        errorDiv.textContent = '';

        const result = await window.authModule.registerUser(username, password);

        if (result.success) {
            modal.style.display = 'none';
            clearForms();
        } else {
            errorDiv.textContent = result.error || 'Registration failed';
        }

        registerSubmit.disabled = false;
        registerSubmit.textContent = 'Register';
    });

    // Logout
    logoutBtn.addEventListener('click', async () => {
        await window.authModule.logoutUser();
    });
}

// Switch between login and register tabs
function switchTab(tab) {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');

    tabBtns.forEach(btn => {
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    forms.forEach(form => {
        if (form.id === tab + 'Form') {
            form.classList.add('active');
        } else {
            form.classList.remove('active');
        }
    });

    clearForms();
}

// Clear form fields and errors
function clearForms() {
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('registerUsername').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('loginError').textContent = '';
    document.getElementById('registerError').textContent = '';
}

// Add score with animation
function addScore(amount) {
    score += amount;
    updateUI();
    saveGame();

    // Show floating text
    const floatingText = document.createElement('div');
    floatingText.className = 'floating-text';
    floatingText.textContent = `+${amount}`;
    floatingText.style.left = `${Math.random() * 80 + 10}%`;
    floatingText.style.top = '40%';
    document.querySelector('.game-container').appendChild(floatingText);

    // Remove floating text after animation
    setTimeout(() => {
        floatingText.remove();
    }, 1000);
}

// Animate click effect
function animateClick() {
    const clickEffect = document.createElement('div');
    clickEffect.className = 'click-effect';
    clickEffect.style.left = `${event.clientX - clickArea.getBoundingClientRect().left}px`;
    clickEffect.style.top = `${event.clientY - clickArea.getBoundingClientRect().top}px`;
    clickArea.appendChild(clickEffect);

    // Remove effect after animation
    setTimeout(() => {
        clickEffect.remove();
    }, 500);
}

// Start auto-clicker
function startAutoClicker() {
    if (autoClickerInterval) clearInterval(autoClickerInterval);

    autoClickerInterval = setInterval(() => {
        if (autoClickerPower > 0) {
            addScore(autoClickerPower);
        }
    }, 1000);
}

// Update UI elements
function updateUI() {
    scoreElement.textContent = Math.floor(score);
    document.title = `${Math.floor(score)} - Click & Collect`;
    updateUpgradeButtons();
}

// Update upgrade buttons state
function updateUpgradeButtons() {
    // Auto-clicker button
    autoClickerBtn.textContent = `Auto-Clicker (${autoClickerPower}/click/sec) - ${autoClickerBtn.dataset.cost} points`;
    autoClickerBtn.disabled = score < autoClickerBtn.dataset.cost;

    // Click multiplier button
    clickMultiplierBtn.textContent = `Click Power x${clickPower * 2} - ${clickMultiplierBtn.dataset.cost} points`;
    clickMultiplierBtn.disabled = score < clickMultiplierBtn.dataset.cost;
}

// Save game state
function saveGame() {
    const gameState = {
        score: score,
        clickPower: clickPower,
        autoClickerPower: autoClickerPower,
        autoClickerCost: autoClickerBtn.dataset.cost,
        clickMultiplierCost: clickMultiplierBtn.dataset.cost
    };

    // Save to localStorage (for guests)
    localStorage.setItem('clickGameSave', JSON.stringify(gameState));

    // Save to Supabase if authenticated
    if (window.authModule && window.authModule.isAuthenticated()) {
        window.authModule.saveUserData(gameState);
    }
}

// Load game state from localStorage or Supabase
function loadGame() {
    const savedGame = localStorage.getItem('clickGameSave');

    // Initialize with zeros if no save exists (guest mode)
    if (!savedGame) {
        score = 0;
        clickPower = 1;
        autoClickerPower = 0;
        return;
    }

    // Load from localStorage (guest mode or while waiting for auth)
    const gameState = JSON.parse(savedGame);
    score = gameState.score || 0;
    clickPower = gameState.clickPower || 1;
    autoClickerPower = gameState.autoClickerPower || 0;

    if (gameState.autoClickerCost) {
        autoClickerBtn.dataset.cost = gameState.autoClickerCost;
    }

    if (gameState.clickMultiplierCost) {
        clickMultiplierBtn.dataset.cost = gameState.clickMultiplierCost;
    }
}

// Load cloud data (called from auth.js when user logs in)
window.loadCloudData = function (data) {
    if (!data) return;

    score = data.Value || 0;
    clickPower = data.ClickPower || 1;
    autoClickerPower = data.AutoClicker || 0;

    updateUI();
    saveGame(); // Save to localStorage as well
};

// Export game state getters for auth module
window.score = score;
window.clickPower = clickPower;
window.autoClickerPower = autoClickerPower;
window.autoClickerBtn = autoClickerBtn;
window.clickMultiplierBtn = clickMultiplierBtn;

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% { transform: translateY(0); opacity: 1; }
        100% { transform: translateY(-50px); opacity: 0; }
    }
    
    .floating-text {
        position: absolute;
        color: #27ae60;
        font-weight: bold;
        font-size: 24px;
        pointer-events: none;
        animation: floatUp 1s ease-out forwards;
        z-index: 100;
    }
    
    @keyframes clickEffect {
        0% { transform: scale(0.5); opacity: 1; }
        100% { transform: scale(2); opacity: 0; }
    }
    
    .click-effect {
        position: absolute;
        width: 20px;
        height: 20px;
        background: rgba(52, 152, 219, 0.5);
        border-radius: 50%;
        pointer-events: none;
        animation: clickEffect 0.5s ease-out forwards;
    }
`;
document.head.appendChild(style);

// Initialize the game when the page loads
window.addEventListener('load', initGame);

// Save game when page is about to unload
window.addEventListener('beforeunload', saveGame);
