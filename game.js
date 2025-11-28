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
    updateUI();
    startAutoClicker();
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

// Save game state to localStorage
function saveGame() {
    const gameState = {
        score: score,
        clickPower: clickPower,
        autoClickerPower: autoClickerPower,
        autoClickerCost: autoClickerBtn.dataset.cost,
        clickMultiplierCost: clickMultiplierBtn.dataset.cost
    };
    localStorage.setItem('clickGameSave', JSON.stringify(gameState));
}

// Load game state from localStorage
function loadGame() {
    const savedGame = localStorage.getItem('clickGameSave');
    if (savedGame) {
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
}

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
