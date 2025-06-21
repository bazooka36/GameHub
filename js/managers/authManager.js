/**
 * Authentication Manager for GameHub
 * Handles login, registration, password reset, and form validation
 */

import { Utils } from '../utils.js';
import { modalManager } from '../modalManager.js';
import { toastManager } from '../toastManager.js';

export class AuthManager {
    constructor() {
        this.isInitialized = false;
        this.userManager = null; // Will be injected by main app
        this.verifiedUser = null; // To store user during password reset flow
    }

    /**
     * Initialize the auth manager
     */
    async init() {
        try {
            this.setupAuthTabs();
            this.setupLoginForm();
            this.setupRegisterForm();
            this.setupAuthButtons();
            this.setupPasswordVisibility();
            this.setupPasswordPolicy();
            this.setupForgotPassword();
            
            this.isInitialized = true;
            console.log('AuthManager initialized');
        } catch (error) {
            console.error('Error initializing AuthManager:', error);
            throw error;
        }
    }

    /**
     * Set user manager reference
     * @param {UserManager} userManager - User manager instance
     */
    setUserManager(userManager) {
        this.userManager = userManager;
    }

    /**
     * Get current user from UserManager
     * @returns {Object|null} Current user object
     */
    getCurrentUser() {
        console.log('AuthManager - getCurrentUser called');
        console.log('AuthManager - userManager available:', !!this.userManager);
        
        if (this.userManager && typeof this.userManager.getCurrentUser === 'function') {
            const user = this.userManager.getCurrentUser();
            console.log('AuthManager - getCurrentUser result:', user);
            return user;
        }
        
        console.log('AuthManager - getCurrentUser: no userManager or method not available');
        return null;
    }

    /**
     * Logout user
     */
    logout() {
        console.log('AuthManager - logout called');
        if (this.userManager && typeof this.userManager.handleLogout === 'function') {
            this.userManager.handleLogout();
            
            // Update main app UI state
            if (window.gameHubApp && typeof window.gameHubApp.updateUIForUserState === 'function') {
                window.gameHubApp.updateUIForUserState();
            }
        }
    }

    /**
     * Show login modal
     */
    showLogin() {
        const authModal = Utils.getElement('auth-modal');
        const showLoginTab = Utils.getElement('show-login');
        
        if (authModal && showLoginTab) {
            modalManager.showModal(authModal);
            showLoginTab.click();
        }
    }

    /**
     * Show register modal
     */
    showRegister() {
        const authModal = Utils.getElement('auth-modal');
        const showRegisterTab = Utils.getElement('show-register');
        
        if (authModal && showRegisterTab) {
            modalManager.showModal(authModal);
            showRegisterTab.click();
        }
    }

    /**
     * Setup authentication tabs
     */
    setupAuthTabs() {
        const showLoginTab = Utils.getElement('show-login');
        const showRegisterTab = Utils.getElement('show-register');
        const loginForm = Utils.getElement('login-form');
        const registerForm = Utils.getElement('register-form');
        const authMessage = Utils.getElement('auth-message');

        if (showLoginTab && showRegisterTab && loginForm && registerForm) {
            Utils.addEventListenerSafe(showLoginTab, 'click', () => {
                this.switchToTab('login', showLoginTab, showRegisterTab, loginForm, registerForm, authMessage);
            });

            Utils.addEventListenerSafe(showRegisterTab, 'click', () => {
                this.switchToTab('register', showRegisterTab, showLoginTab, registerForm, loginForm, authMessage);
            });
        }
    }

    /**
     * Switch between auth tabs
     */
    switchToTab(activeTab, activeElement, inactiveElement, activeForm, inactiveForm, messageElement) {
        activeElement.classList.add('active');
        activeElement.setAttribute('aria-selected', 'true');
        inactiveElement.classList.remove('active');
        inactiveElement.setAttribute('aria-selected', 'false');
        activeForm.classList.add('active');
        activeForm.setAttribute('aria-hidden', 'false');
        inactiveForm.classList.remove('active');
        inactiveForm.setAttribute('aria-hidden', 'true');
        if (messageElement) messageElement.textContent = '';
    }

    /**
     * Setup login form
     */
    setupLoginForm() {
        const loginForm = Utils.getElement('login-form');
        if (!loginForm) return;

        Utils.addEventListenerSafe(loginForm, 'submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    }

    /**
     * Handle login submission
     */
    async handleLogin() {
        const email = Utils.getElement('login-email')?.value?.trim();
        const password = Utils.getElement('login-password')?.value;

        // Validation
        if (!email || !password) {
            toastManager.error('Пожалуйста, заполните все поля');
            return;
        }

        if (!Utils.validateEmail(email)) {
            toastManager.error('Пожалуйста, введите корректный email');
            return;
        }

        try {
            // Show loading state
            const submitBtn = Utils.getElement('login-form').querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Вход...';
            submitBtn.disabled = true;

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Authenticate user
            const user = this.userManager.authenticateUser(email, password);

            if (user) {
                toastManager.success('Вход выполнен успешно!');
                this.userManager.updateUIForLoggedInUser(user.email);
                
                // Update main app UI state
                if (window.gameHubApp && typeof window.gameHubApp.updateUIForUserState === 'function') {
                    window.gameHubApp.updateUIForUserState();
                }
                
                modalManager.hideModal(Utils.getElement('auth-modal'));
            } else {
                toastManager.error('Неверный email или пароль');
            }

        } catch (error) {
            console.error('Login error:', error);
            toastManager.error('Ошибка при входе');
        } finally {
            // Reset button state
            const submitBtn = Utils.getElement('login-form').querySelector('button[type="submit"]');
            submitBtn.textContent = 'Войти';
            submitBtn.disabled = false;
        }
    }

    /**
     * Setup register form
     */
    setupRegisterForm() {
        const registerForm = Utils.getElement('register-form');
        if (!registerForm) return;

        Utils.addEventListenerSafe(registerForm, 'submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });
    }

    /**
     * Handle registration submission
     */
    async handleRegistration() {
        const email = Utils.getElement('register-email')?.value?.trim();
        const password = Utils.getElement('register-password')?.value;
        const confirmPassword = Utils.getElement('register-password-confirm')?.value;

        // Validation
        if (!email || !password || !confirmPassword) {
            toastManager.error('Пожалуйста, заполните все поля');
            return;
        }

        if (!Utils.validateEmail(email)) {
            toastManager.error('Пожалуйста, введите корректный email');
            return;
        }

        const passwordValidation = Utils.validatePassword(password);
        if (!passwordValidation.isValid) {
            toastManager.error('Пароль не соответствует требованиям безопасности');
            return;
        }

        if (password !== confirmPassword) {
            toastManager.error('Пароли не совпадают');
            return;
        }

        if (this.userManager.userExists(email)) {
            toastManager.error('Пользователь с таким email уже существует');
            return;
        }

        try {
            // Show loading state
            const submitBtn = Utils.getElement('register-form').querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Регистрация...';
            submitBtn.disabled = true;

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Create user
            const newUser = this.userManager.createUser({ email, password });
            if (!newUser) {
                toastManager.error('Пользователь с таким email уже существует');
                submitBtn.textContent = 'Зарегистрироваться';
                submitBtn.disabled = false;
                return;
            }
            this.userManager.setCurrentUser(newUser);

            toastManager.success('Регистрация успешна!');
            this.userManager.updateUIForLoggedInUser(newUser.email);
            
            // Update main app UI state
            if (window.gameHubApp && typeof window.gameHubApp.updateUIForUserState === 'function') {
                window.gameHubApp.updateUIForUserState();
            }
            
            setTimeout(() => {
                modalManager.hideModal(Utils.getElement('auth-modal'));
            }, 1500);

        } catch (error) {
            console.error('Registration error:', error);
            toastManager.error('Ошибка при регистрации');
        } finally {
            // Reset button state
            const submitBtn = Utils.getElement('register-form').querySelector('button[type="submit"]');
            submitBtn.textContent = 'Зарегистрироваться';
            submitBtn.disabled = false;
        }
    }

    /**
     * Setup auth buttons
     */
    setupAuthButtons() {
        const registerButtons = document.querySelectorAll('#desktop-register-btn');
        const loginButtons = document.querySelectorAll('#desktop-login-btn');
        const authModal = Utils.getElement('auth-modal');

        registerButtons.forEach(btn => {
            Utils.addEventListenerSafe(btn, 'click', () => {
                modalManager.showModal(authModal);
                Utils.getElement('show-register')?.click();
            });
        });

        loginButtons.forEach(btn => {
            Utils.addEventListenerSafe(btn, 'click', () => {
                modalManager.showModal(authModal);
                Utils.getElement('show-login')?.click();
            });
        });
    }

    /**
     * Setup password visibility toggle
     */
    setupPasswordVisibility() {
        const toggleBtn = Utils.getElement('toggle-password-visibility');
        const registerPassword = Utils.getElement('register-password');
        const registerPasswordConfirm = Utils.getElement('register-password-confirm');

        if (toggleBtn && registerPassword && registerPasswordConfirm) {
            Utils.addEventListenerSafe(toggleBtn, 'click', () => {
                const type = registerPassword.type === 'password' ? 'text' : 'password';
                registerPassword.type = type;
                registerPasswordConfirm.type = type;
                toggleBtn.textContent = type === 'password' ? 'Показать пароль' : 'Скрыть пароль';
            });
        }
    }

    /**
     * Setup password policy validation
     */
    setupPasswordPolicy() {
        const registerPassword = Utils.getElement('register-password');
        const policyLength = Utils.getElement('policy-length');
        const policyLower = Utils.getElement('policy-lower');
        const policyDigit = Utils.getElement('policy-digit');

        if (registerPassword) {
            Utils.addEventListenerSafe(registerPassword, 'input', () => {
                this.updatePasswordPolicy(registerPassword.value, policyLength, policyLower, policyDigit);
            });
        }
    }

    /**
     * Update password policy indicators
     */
    updatePasswordPolicy(password, policyLength, policyLower, policyDigit) {
        if (policyLength) {
            policyLength.className = password.length >= 8 ? 'text-green-400' : 'text-gray-400';
        }
        if (policyLower) {
            policyLower.className = /[a-zа-яё]/.test(password) ? 'text-green-400' : 'text-gray-400';
        }
        if (policyDigit) {
            policyDigit.className = /[0-9]/.test(password) ? 'text-green-400' : 'text-gray-400';
        }
    }

    /**
     * Setup forgot password functionality
     */
    setupForgotPassword() {
        const forgotPasswordLink = Utils.getElement('forgot-password-link');
        const forgotPasswordModal = Utils.getElement('forgot-password-modal');
        const closeForgotPasswordModal = Utils.getElement('close-password-reset-modal');
        const forgotPasswordForm = Utils.getElement('forgot-password-form');
        const newPasswordForm = Utils.getElement('new-password-form');
        const forgotPasswordEmail = Utils.getElement('forgot-password-email');
        const forgotPasswordMessage = Utils.getElement('forgot-password-message');
        const authModal = Utils.getElement('auth-modal');

        if (forgotPasswordLink) {
            Utils.addEventListenerSafe(forgotPasswordLink, 'click', (e) => {
                e.preventDefault();
                modalManager.hideModal(authModal);
                modalManager.showModal(forgotPasswordModal);
                this.resetForgotPasswordForms(forgotPasswordForm, newPasswordForm, forgotPasswordMessage);
                this.verifiedUser = null; // Reset verified user when opening modal
            });
        }

        if (closeForgotPasswordModal) {
            Utils.addEventListenerSafe(closeForgotPasswordModal, 'click', () => {
                modalManager.hideModal(forgotPasswordModal);
                this.resetForgotPasswordForms(forgotPasswordForm, newPasswordForm, forgotPasswordMessage);
                this.verifiedUser = null; // Reset verified user when closing modal
            });
        }

        // Step 1: Email verification
        if (forgotPasswordForm) {
            Utils.addEventListenerSafe(forgotPasswordForm, 'submit', (e) => {
                e.preventDefault();
                this.handleEmailVerification(forgotPasswordEmail, forgotPasswordMessage, forgotPasswordForm, newPasswordForm);
            });
        }

        // Step 2: New password setup
        if (newPasswordForm) {
            Utils.addEventListenerSafe(newPasswordForm, 'submit', (e) => {
                e.preventDefault();
                this.handleNewPasswordSetup(forgotPasswordMessage, forgotPasswordModal);
            });
        }

        // Setup password visibility toggle for new password form
        this.setupNewPasswordVisibility();

        // Setup password policy validation for new password
        this.setupNewPasswordPolicy();
    }

    /**
     * Reset forgot password forms
     */
    resetForgotPasswordForms(forgotPasswordForm, newPasswordForm, forgotPasswordMessage) {
        if (forgotPasswordForm) forgotPasswordForm.reset();
        if (newPasswordForm) newPasswordForm.reset();
        if (forgotPasswordMessage) forgotPasswordMessage.textContent = '';
        if (forgotPasswordForm) forgotPasswordForm.style.display = 'block';
        if (newPasswordForm) newPasswordForm.style.display = 'none';
    }

    /**
     * Handle email verification for password reset
     */
    handleEmailVerification(forgotPasswordEmail, forgotPasswordMessage, forgotPasswordForm, newPasswordForm) {
        const email = forgotPasswordEmail?.value?.trim();
        
        if (!email) {
            if (forgotPasswordMessage) {
                forgotPasswordMessage.textContent = 'Пожалуйста, введите ваш email';
                forgotPasswordMessage.className = 'error-message';
            }
            return;
        }

        if (!Utils.validateEmail(email)) {
            if (forgotPasswordMessage) {
                forgotPasswordMessage.textContent = 'Пожалуйста, введите корректный email';
                forgotPasswordMessage.className = 'error-message';
            }
            return;
        }

        const user = this.userManager.getUserByEmail(email);
        if (!user) {
            if (forgotPasswordMessage) {
                forgotPasswordMessage.textContent = 'Пользователь с таким email не найден';
                forgotPasswordMessage.className = 'error-message';
            }
            return;
        }

        this.verifiedUser = user; // Store the verified user in the class property
        if (forgotPasswordMessage) {
            forgotPasswordMessage.textContent = `Email подтвержден. Теперь введите новый пароль для ${email}`;
            forgotPasswordMessage.className = 'success-message';
        }
        
        if (forgotPasswordForm) forgotPasswordForm.style.display = 'none';
        if (newPasswordForm) newPasswordForm.style.display = 'block';
    }

    /**
     * Handle new password setup
     */
    handleNewPasswordSetup(forgotPasswordMessage, forgotPasswordModal) {
        if (!this.verifiedUser) {
            if (forgotPasswordMessage) {
                forgotPasswordMessage.textContent = 'Ошибка: пользователь не подтвержден';
                forgotPasswordMessage.className = 'error-message';
            }
            return;
        }

        const newPassword = Utils.getElement('new-password-input')?.value;
        const confirmPassword = Utils.getElement('confirm-new-password-input')?.value;

        if (!newPassword || !confirmPassword) {
            if (forgotPasswordMessage) {
                forgotPasswordMessage.textContent = 'Пожалуйста, заполните все поля';
                forgotPasswordMessage.className = 'error-message';
            }
            return;
        }

        const passwordValidation = Utils.validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            if (forgotPasswordMessage) {
                forgotPasswordMessage.textContent = 'Пароль не соответствует требованиям безопасности';
                forgotPasswordMessage.className = 'error-message';
            }
            return;
        }

        if (newPassword !== confirmPassword) {
            if (forgotPasswordMessage) {
                forgotPasswordMessage.textContent = 'Пароли не совпадают';
                forgotPasswordMessage.className = 'error-message';
            }
            return;
        }

        // Update user password
        const users = Utils.safeGetItem('users', []);
        const userIndex = users.findIndex(u => u.id === this.verifiedUser.id);
        
        if (userIndex !== -1) {
            users[userIndex].password = newPassword;
            Utils.safeSetItem('users', users);
            
            // Set current user and update UI after password change
            this.userManager.setCurrentUser(this.verifiedUser);
            this.userManager.updateUIForLoggedInUser(this.verifiedUser.email);

            if (forgotPasswordMessage) {
                forgotPasswordMessage.textContent = 'Пароль успешно изменен!';
                forgotPasswordMessage.className = 'success-message';
            }
            
            toastManager.success('Пароль успешно изменен!');
            
            setTimeout(() => {
                modalManager.hideModal(forgotPasswordModal);
                this.verifiedUser = null; // Clear verified user after successful reset
            }, 2000);
        } else {
            if (forgotPasswordMessage) {
                forgotPasswordMessage.textContent = 'Ошибка при обновлении пароля';
                forgotPasswordMessage.className = 'error-message';
            }
        }
    }

    /**
     * Setup new password visibility toggle
     */
    setupNewPasswordVisibility() {
        const toggleNewPasswordBtn = Utils.getElement('toggle-new-password-visibility');
        const newPasswordInput = Utils.getElement('new-password-input');
        const confirmNewPasswordInput = Utils.getElement('confirm-new-password-input');

        if (toggleNewPasswordBtn && newPasswordInput && confirmNewPasswordInput) {
            Utils.addEventListenerSafe(toggleNewPasswordBtn, 'click', () => {
                const type = newPasswordInput.type === 'password' ? 'text' : 'password';
                newPasswordInput.type = type;
                confirmNewPasswordInput.type = type;
                toggleNewPasswordBtn.textContent = type === 'password' ? 'Показать пароль' : 'Скрыть пароль';
            });
        }
    }

    /**
     * Setup new password policy validation
     */
    setupNewPasswordPolicy() {
        const newPasswordInput = Utils.getElement('new-password-input');
        const newPolicyLength = Utils.getElement('new-policy-length');
        const newPolicyLower = Utils.getElement('new-policy-lower');
        const newPolicyDigit = Utils.getElement('new-policy-digit');

        if (newPasswordInput) {
            Utils.addEventListenerSafe(newPasswordInput, 'input', () => {
                this.updatePasswordPolicy(newPasswordInput.value, newPolicyLength, newPolicyLower, newPolicyDigit);
            });
        }
    }

    /**
     * Cleanup event listeners and resources
     */
    cleanup() {
        // No specific cleanup needed for AuthManager as event listeners are mostly attached to forms/modals
        // which are part of the main document lifecycle or handled by modalManager.
        console.log('AuthManager cleanup completed');
    }
} 