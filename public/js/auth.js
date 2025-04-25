
// const API_URL = 'http://localhost:5000/api'; 
const AUTH_ENDPOINT = `/api/auth`;

// DOM elements
const showLoginBtn = document.getElementById('showLoginBtn');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const loginModal = document.getElementById('login-modal');
const registerModal = document.getElementById('register-modal');
const closeLoginBtn = document.querySelector('.close-login');
const closeRegisterBtn = document.querySelector('.close-register');
const loginSubmitBtn = document.getElementById('loginSubmitBtn');
const registerSubmitBtn = document.getElementById('registerSubmitBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authButtons = document.getElementById('auth-buttons');
const userInfo = document.getElementById('user-info');
const usernameElement = document.getElementById('username');
const appContent = document.getElementById('app-content');
const welcomePage = document.getElementById('welcome-page');
const welcomeLoginBtn = document.getElementById('welcome-login-btn');
const welcomeRegisterBtn = document.getElementById('welcome-register-btn');

// Check authentication status when page loads
document.addEventListener('DOMContentLoaded', checkAuthStatus);

// Event listeners
showLoginBtn.addEventListener('click', () => {
    loginModal.style.display = 'block';
});

showRegisterBtn.addEventListener('click', () => {
    registerModal.style.display = 'block';
});

// Welcome page buttons
welcomeLoginBtn.addEventListener('click', () => {
    loginModal.style.display = 'block';
});

welcomeRegisterBtn.addEventListener('click', () => {
    registerModal.style.display = 'block';
});

closeLoginBtn.addEventListener('click', () => {
    loginModal.style.display = 'none';
});

closeRegisterBtn.addEventListener('click', () => {
    registerModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === loginModal) {
        loginModal.style.display = 'none';
    }
    if (event.target === registerModal) {
        registerModal.style.display = 'none';
    }
});

loginSubmitBtn.addEventListener('click', login);
registerSubmitBtn.addEventListener('click', register);
logoutBtn.addEventListener('click', logout);

// Check authentication status
async function checkAuthStatus() {
    try {
        const response = await fetch(`${AUTH_ENDPOINT}/me`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (response.ok) {
            const data = await response.json();

            showLoggedInUI(data.data.user);
        } else {

            showLoggedOutUI();
        }
    } catch (error) {
        console.error('Authentication error:', error);
        showLoggedOutUI();
    }
}

// Login
async function login() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }

    try {
        const response = await fetch(`${AUTH_ENDPOINT}/login`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            // Login successful
            loginModal.style.display = 'none';
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';

            // Save token to localStorage
            localStorage.setItem('authToken', data.token);

            showLoggedInUI(data.data.user);

            // Refresh the page to load landmarks
            window.location.reload();
        } else {
            const errorData = await response.json();
            alert(`Login failed: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
    }
}

// Register
async function register() {
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;

    if (!username || !email || !password) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch(`${AUTH_ENDPOINT}/register`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        if (response.ok) {
            const data = await response.json();
            // Registration successful
            registerModal.style.display = 'none';
            document.getElementById('register-username').value = '';
            document.getElementById('register-email').value = '';
            document.getElementById('register-password').value = '';

            // Save token to localStorage
            localStorage.setItem('authToken', data.token);

            showLoggedInUI(data.data.user);

            // Refresh the page to load landmarks
            window.location.reload();
        } else {
            const errorData = await response.json();
            alert(`Registration failed: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('An error occurred during registration');
    }
}

// Logout
async function logout() {
    try {
        await fetch(`${AUTH_ENDPOINT}/logout`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        // Remove token from localStorage
        localStorage.removeItem('authToken');

        showLoggedOutUI();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Update UI when logged in
function showLoggedInUI(user) {
    authButtons.style.display = 'none';
    userInfo.style.display = 'flex';
    usernameElement.textContent = user.username;
    appContent.style.display = 'block';
    welcomePage.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Update UI when logged out
function showLoggedOutUI() {
    authButtons.style.display = 'flex';
    userInfo.style.display = 'none';
    appContent.style.display = 'none';
    welcomePage.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Helper function to get JWT Token
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Add token to API requests
function getAuthHeaders() {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
} 