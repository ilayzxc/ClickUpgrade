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
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        currentUser = session.user;
        isAuthenticated = true;
        await onUserLogin();
    }

    // Listen to auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            isAuthenticated = true;
            await onUserLogin();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            isAuthenticated = false;
            onUserLogout();
        }
    });

    updateAuthUI();
}

// Register new user
async function registerUser(email, password, username) {
    try {
        // Sign up with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username
                }
            }
        });

        if (error) throw error;

        // User is automatically signed in after registration
        return { success: true, user: data.user };
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
    }
}

// Login user
async function loginUser(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        return { success: true, user: data.user };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

// Logout user
async function logoutUser() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, error: error.message };
    }
}

// Called when user logs in
async function onUserLogin() {
    // Get guest data from localStorage
    const guestData = getGuestData();

    // Load user data from Supabase
    const cloudData = await loadUserData();

    // Migrate guest data if needed
    if (guestData && guestData.score > 0) {
        if (!cloudData || guestData.score > cloudData.Value) {
            // Guest data is better, migrate it to cloud
            await saveUserData(guestData);
            console.log('Guest data migrated to cloud');
        } else {
            // Cloud data is better, use it
            applyCloudData(cloudData);
            console.log('Cloud data loaded');
        }
    } else if (cloudData) {
        // No guest data, just load cloud data
        applyCloudData(cloudData);
        console.log('Cloud data loaded');
    } else {
        // New user, save initial state
        await saveUserData(getCurrentGameState());
    }

    updateAuthUI();
}

// Called when user logs out
function onUserLogout() {
    updateAuthUI();
    // Reload page to reset to guest mode
    location.reload();
}

// Get guest data from localStorage
function getGuestData() {
    const savedGame = localStorage.getItem('clickGameSave');
    if (savedGame) {
        return JSON.parse(savedGame);
    }
    return null;
}

// Load user data from Supabase
async function loadUserData() {
    if (!currentUser) return null;

    try {
        const { data, error } = await supabase
            .from('Users')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
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
        const username = currentUser.user_metadata?.username || currentUser.email.split('@')[0];

        const userData = {
            user_id: currentUser.id,
            UserName: username,
            Value: Math.floor(gameState.score || 0),
            ClickPower: gameState.clickPower || 1,
            AutoClicker: gameState.autoClickerPower || 0,
            Profit: 0 // AdSense profit, to be implemented later
        };

        const { error } = await supabase
            .from('Users')
            .upsert(userData, { onConflict: 'user_id' });

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
        autoClickerPower: window.autoClickerPower || 0,
        autoClickerCost: window.autoClickerBtn?.dataset.cost || 50,
        clickMultiplierCost: window.clickMultiplierBtn?.dataset.cost || 100
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
        const username = currentUser.user_metadata?.username || currentUser.email.split('@')[0];
        authButtons.style.display = 'none';
        userDisplay.style.display = 'block';
        usernameDisplay.textContent = username;
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
