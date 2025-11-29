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

    if (window.authModule) {
        window.authModule.initAuth();
    }
}

// Set up event listeners
function setupEventListeners() {
    clickArea.addEventListener('click', (event) => {
        addScore(clickPower);
        animateClick(event);
    });

    autoClickerBtn.addEventListener('click', () => {
        const cost = parseInt(autoClickerBtn.dataset.cost);
        if (score >= cost) {
            score -= cost;
            autoClickerPower += parseInt(autoClickerBtn.dataset.power);
            // Recalculate cost based on new power
            recalculateCosts();
            updateUpgradeButtons();
            updateUI();
            saveGame();
        }
    });

    clickMultiplierBtn.addEventListener('click', () => {
        const cost = parseInt(clickMultiplierBtn.dataset.cost);
        if (score >= cost) {
            score -= cost;
            clickPower *= parseInt(clickMultiplierBtn.dataset.multiplier);
            // Recalculate cost based on new power
            recalculateCosts();
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

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            modal.style.display = 'block';
            switchTab('login');
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            modal.style.display = 'block';
            switchTab('register');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            clearForms();
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            clearForms();
        }
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    if (loginSubmit) {
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
    }

    if (registerSubmit) {
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
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await window.authModule.logoutUser();
        });
    }
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
    const loginUser = document.getElementById('loginUsername');
    const loginPass = document.getElementById('loginPassword');
    const regUser = document.getElementById('registerUsername');
    const regPass = document.getElementById('registerPassword');
    const loginErr = document.getElementById('loginError');
    const regErr = document.getElementById('registerError');

    if (loginUser) loginUser.value = '';
    if (loginPass) loginPass.value = '';
    if (regUser) regUser.value = '';
    if (regPass) regPass.value = '';
    if (loginErr) loginErr.textContent = '';
    if (regErr) regErr.textContent = '';
}

// Add score with animation
function addScore(amount) {
    score += amount;
    updateUI();
    saveGame();

    const floatingText = document.createElement('div');
    floatingText.className = 'floating-text';
    floatingText.textContent = `+${amount}`;
    floatingText.style.left = `${Math.random() * 80 + 10}%`;
    floatingText.style.top = '40%';
    document.querySelector('.game-container').appendChild(floatingText);

    setTimeout(() => {
        floatingText.remove();
    }, 1000);
}

// Animate click effect
function animateClick(event) {
    if (!event) return;
    const clickEffect = document.createElement('div');
    clickEffect.className = 'click-effect';
    clickEffect.style.left = `${event.clientX - clickArea.getBoundingClientRect().left}px`;
    clickEffect.style.top = `${event.clientY - clickArea.getBoundingClientRect().top}px`;
    clickArea.appendChild(clickEffect);

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
    autoClickerBtn.textContent = `Auto-Clicker (${autoClickerPower}/click/sec) - ${autoClickerBtn.dataset.cost} points`;
    autoClickerBtn.disabled = score < parseInt(autoClickerBtn.dataset.cost);

    clickMultiplierBtn.textContent = `Click Power x${clickPower * 2} - ${clickMultiplierBtn.dataset.cost} points`;
    clickMultiplierBtn.disabled = score < parseInt(clickMultiplierBtn.dataset.cost);
}

// Save game state
function saveGame() {
    if (window.loggingOut) return;

    const gameState = {
        score: score,
        clickPower: clickPower,
        autoClickerPower: autoClickerPower
    };

    localStorage.setItem('clickGameSave', JSON.stringify(gameState));

    if (window.authModule && window.authModule.isAuthenticated()) {
        window.authModule.saveUserData(gameState);
    }
}

// Load game state from localStorage
function loadGame() {
    const savedGame = localStorage.getItem('clickGameSave');

    if (!savedGame) {
        score = 0;
        clickPower = 1;
        autoClickerPower = 0;
        recalculateCosts();
        return;
    }

    const gameState = JSON.parse(savedGame);
    score = gameState.score || 0;
    clickPower = gameState.clickPower || 1;
    autoClickerPower = gameState.autoClickerPower || 0;

    recalculateCosts();
}

// Recalculate upgrade costs based on current power levels
function recalculateCosts() {
    // Auto-clicker: each purchase adds 1 power. Base cost 50, multiplier 1.5
    // Purchases = current power (since each adds 1)
    let autoClickerPurchases = autoClickerPower;
    let autoClickerCost = 50;
    for (let i = 0; i < autoClickerPurchases; i++) {
        autoClickerCost = Math.floor(autoClickerCost * 1.5);
    }
    autoClickerBtn.dataset.cost = autoClickerCost;

    // Click multiplier: each purchase doubles power (1 -> 2 -> 4 -> 8). Base cost 100, multiplier 3
    // Purchases = log2(clickPower)
    let clickMultiplierPurchases = 0;
    let tempPower = 1;
    while (tempPower < clickPower) {
        tempPower *= 2;
        clickMultiplierPurchases++;
    }

    let clickMultiplierCost = 100;
    for (let i = 0; i < clickMultiplierPurchases; i++) {
        clickMultiplierCost = Math.floor(clickMultiplierCost * 3);
    }
    clickMultiplierBtn.dataset.cost = clickMultiplierCost;
}

// Load cloud data (called from auth.js when user logs in)
window.loadCloudData = function (data) {
    if (!data) return;

    score = data.Value || 0;
    clickPower = data.ClickPower || 1;
    autoClickerPower = data.AutoClicker || 0;

    recalculateCosts();

    updateUI();
    saveGame();
};

// Export game state getters for auth module
window.score = score;
window.clickPower = clickPower;
window.autoClickerPower = autoClickerPower;

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
