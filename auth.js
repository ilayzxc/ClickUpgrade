// Supabase Configuration
const SUPABASE_URL = 'https://lisqihzochpuabjwaglo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpc3FpaHpvY2hwdWFiandhZ2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzAzNjgsImV4cCI6MjA4MDAwNjM2OH0.bwUyJpgJ_McInadzQFtXF6Lht1K_CJ0qDv3ZJqnfAWo';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Current user state
let currentUser = null;
let isAuthenticated = false;

// Initialize auth state
async function initAuth() {
    const savedUsername = localStorage.getItem('loggedInUser');

    if (savedUsername) {
        currentUser = { username: savedUsername };
        isAuthenticated = true;
        await onUserLogin();
    }

    updateAuthUI();
}

// Register new user
async function registerUser(username, password) {
    try {
        const { data: existingUser } = await supabase
            .from('Users')
            .select('UserName')
            .eq('UserName', username)
            .single();

        if (existingUser) {
            return { success: false, error: 'Username already exists' };
        }

        const { error } = await supabase
            .from('Users')
            .insert({
                UserName: username,
                Password: password,
                Value: 0,
                ClickPower: 1,
                AutoClicker: 0,
                Profit: 0
            });

        if (error) throw error;

        localStorage.setItem('loggedInUser', username);
        currentUser = { username: username };
        isAuthenticated = true;

        await onUserLogin();

        return { success: true, user: currentUser };
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
    }
}

// Login user
async function loginUser(username, password) {
    try {
        const { data: userData, error } = await supabase
            .from('Users')
            .select('UserName, Password')
            .eq('UserName', username)
            .single();

        if (error || !userData) {
            return { success: false, error: 'Username not found' };
        }

        if (userData.Password !== password) {
            return { success: false, error: 'Incorrect password' };
        }

        localStorage.setItem('loggedInUser', username);
        currentUser = { username: username };
        isAuthenticated = true;

        await onUserLogin();

        return { success: true, user: currentUser };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

// Logout user
async function logoutUser() {
    try {
        localStorage.removeItem('loggedInUser');
        currentUser = null;
        isAuthenticated = false;
        onUserLogout();
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, error: error.message };
    }
}

// Called when user logs in
async function onUserLogin() {
    const guestData = getGuestData();
    const cloudData = await loadUserData();

    if (guestData && guestData.score > 0) {
        if (!cloudData || guestData.score > cloudData.Value) {
            await saveUserData(guestData);
            console.log('Guest data migrated to cloud');
        } else {
            applyCloudData(cloudData);
            console.log('Cloud data loaded');
        }
    } else if (cloudData) {
        applyCloudData(cloudData);
        console.log('Cloud data loaded');
    }

    updateAuthUI();
}

// Called when user logs out
function onUserLogout() {
    window.loggingOut = true;
    localStorage.removeItem('clickGameSave');
    localStorage.removeItem('loggedInUser');
    updateAuthUI();
    location.reload();
}

// Get guest data from localStorage
function getGuestData() {
    const savedGame = localStorage.getItem('clickGameSave');
    return savedGame ? JSON.parse(savedGame) : null;
}

// Load user data from Supabase
async function loadUserData() {
    if (!currentUser) return null;

    try {
        const { data, error } = await supabase
            .from('Users')
            .select('*')
            .eq('UserName', currentUser.username)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error loading user data:', error);
        return null;
    }
}

// Save user data to Supabase
async function saveUserData(gameState) {
    if (!currentUser) return;

    try {
        const { error } = await supabase
            .from('Users')
            .update({
                Value: Math.floor(gameState.score || 0),
                ClickPower: gameState.clickPower || 1,
                AutoClicker: gameState.autoClickerPower || 0,
                Profit: 0
            })
            .eq('UserName', currentUser.username);

        if (error) throw error;

        console.log('Data saved to Supabase');
    } catch (error) {
        console.error('Error saving to Supabase:', error);
    }
}

// Get current game state from global variables
function getCurrentGameState() {
    return {
        score: window.score || 0,
        clickPower: window.clickPower || 1,
        autoClickerPower: window.autoClickerPower || 0
    };
}

// Apply cloud data to game
function applyCloudData(data) {
    if (window.loadCloudData) {
        window.loadCloudData(data);
    }
}

// Update auth UI elements
function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userDisplay = document.getElementById('userDisplay');
    const usernameDisplay = document.getElementById('usernameDisplay');

    if (isAuthenticated && currentUser) {
        authButtons.style.display = 'none';
        userDisplay.style.display = 'block';
        usernameDisplay.textContent = currentUser.username;
    } else {
        authButtons.style.display = 'flex';
        userDisplay.style.display = 'none';
    }
}

// Auto-save to Supabase every 10 seconds
setInterval(() => {
    if (isAuthenticated) {
        saveUserData(getCurrentGameState());
    }
}, 10000);

// Export functions for global access
window.authModule = {
    initAuth,
    registerUser,
    loginUser,
    logoutUser,
    saveUserData,
    getCurrentGameState,
    isAuthenticated: () => isAuthenticated,
    getCurrentUser: () => currentUser
};
