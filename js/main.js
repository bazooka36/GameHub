/**
 * Main Application Entry Point for GameHub
 * Imports all modules and initializes the application
 */

import { Utils } from './utils.js';
import { modalManager } from './modalManager.js';
import { toastManager } from './toastManager.js';

// Import managers (these will be created as separate modules)
import { UserManager } from './managers/userManager.js';
import { AuthManager } from './managers/authManager.js';
import { ProfileManager } from './managers/profileManager.js';
import { FriendsManager } from './managers/friendsManager.js';
import { ContentLoader } from './managers/contentLoader.js';
import { GameSearch } from './managers/gameSearch.js';
import { SupportManager } from './managers/supportManager.js';
import { MobileMenu } from './managers/mobileMenu.js';
import { DataManager } from './managers/dataManager.js';

/**
 * Main Application Class
 */
class GameHubApp {
    constructor() {
        this.managers = {};
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Initializing GameHub...');

            // Initialize DataManager first (global data layer)
            this.initializeDataManager();

            // Setup global references first
            this.setupGlobalReferences();

            // Check browser support
            const support = Utils.checkBrowserSupport();
            if (!support.localStorage) {
                this.showBrowserWarning('localStorage не поддерживается вашим браузером');
            }

            // Initialize managers
            await this.initializeManagers();

            // Setup event listeners
            this.setupEventListeners();

            // Load initial content
            await this.loadInitialContent();

            // Hide loading screen
            this.hideLoadingScreen();

            // Update UI based on user state
            this.updateUIForUserState();

            this.isInitialized = true;
            console.log('✅ GameHub initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize GameHub:', error);
            this.showError('Ошибка инициализации приложения: ' + error.message);
        }
    }

    /**
     * Initialize DataManager as global data layer
     */
    initializeDataManager() {
        try {
            // Create global DataManager instance
            window.gameHubDataManager = new DataManager();
            
            // Initialize test data if needed
            window.gameHubDataManager.initializeTestData();
            
            console.log('✅ DataManager initialized');
        } catch (error) {
            console.error('❌ Failed to initialize DataManager:', error);
        }
    }

    /**
     * Initialize all managers
     */
    async initializeManagers() {
        // Initialize managers
        this.managers.user = new UserManager();
        this.managers.auth = new AuthManager();
        this.managers.profile = new ProfileManager();
        this.managers.friends = new FriendsManager();
        this.managers.content = new ContentLoader();
        this.managers.search = new GameSearch();
        this.managers.support = new SupportManager();
        this.managers.mobile = new MobileMenu();

        // Setup cross-manager dependencies
        this.setupManagerDependencies();

        // Initialize each manager
        for (const [name, manager] of Object.entries(this.managers)) {
            if (typeof manager.init === 'function') {
                await manager.init();
                console.log(`✅ ${name} manager initialized`);
            }
        }

        // Setup managers in global scope BEFORE initializing toastManager
        this.setupManagersInGlobalScope();

        // Initialize toastManager after other managers and global scope setup
        if (typeof toastManager !== 'undefined') {
            await toastManager.init();
            console.log('✅ ToastManager initialized');
        }

        console.log('✅ All managers initialized');
    }

    /**
     * Setup dependencies between managers
     */
    setupManagerDependencies() {
        this.managers.auth.setUserManager(this.managers.user);
        this.managers.profile.setUserManager(this.managers.user);
        this.managers.friends.setUserManager(this.managers.user);
    }

    /**
     * Setup global references for cross-module access
     */
    setupGlobalReferences() {
        
        try {
            // Make managers globally accessible
            window.gameHubApp = this;
            
            // Setup modalManager if available
            if (typeof modalManager !== 'undefined') {
                window.modalManager = modalManager;
            }
            
            // Setup toastManager if available
            if (typeof toastManager !== 'undefined') {
                window.toastManager = toastManager;
            }
            
            window.utils = Utils;

            // Make individual managers accessible (will be set after initialization)
            window.managers = {};
            
            console.log('✅ Global references setup completed');
        } catch (error) {
            console.error('Error setting up global references:', error);
        }
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Window events
        window.addEventListener('load', () => this.hideLoadingScreen());
        window.addEventListener('beforeunload', () => this.cleanup());

        // Global error handling
        window.addEventListener('error', (e) => {
            Utils.handleError(e.error, 'Global Error');
        });

        window.addEventListener('unhandledrejection', (e) => {
            Utils.handleError(e.reason, 'Unhandled Promise Rejection');
        });

        // Setup navigation buttons
        this.setupNavigationButtons();

        // Setup footer elements
        this.setupFooterElements();

        // Setup mobile modals
        this.setupMobileModals();
    }

    /**
     * Setup navigation buttons
     */
    setupNavigationButtons() {
        const navButtons = document.querySelectorAll('nav button:not(.burger-menu-button):not(#mobile-menu-button):not(#desktop-register-btn):not(#desktop-login-btn):not(#mobile-register-btn):not(#mobile-login-btn):not(#admin-btn):not(#mobile-profile-option):not(#mobile-friends-option):not(#mobile-account-option):not(#mobile-about-option):not(#mobile-logout-btn):not(#delete-account-btn-mobile)');
        navButtons.forEach(btn => {
            Utils.addEventListenerSafe(btn, 'click', () => {
                if (window.toastManager) {
                    window.toastManager.info('Страница в разработке');
                }
            });
        });
    }

    /**
     * Setup footer elements
     */
    setupFooterElements() {
        // Footer buttons
        const footerButtons = document.querySelectorAll('footer button');
        footerButtons.forEach(btn => {
            Utils.addEventListenerSafe(btn, 'click', () => {
                if (window.toastManager) {
                    window.toastManager.info('Функция в разработке');
                }
            });
        });

        // Footer links
        const footerLinks = document.querySelectorAll('footer a[href="#"]');
        footerLinks.forEach(link => {
            Utils.addEventListenerSafe(link, 'click', (e) => {
                e.preventDefault();
                if (window.toastManager) {
                    window.toastManager.info('Страница в разработке');
                }
            });
        });

        // "All news" button
        const allNewsBtn = document.querySelector('main .text-center button');
        if (allNewsBtn) {
            Utils.addEventListenerSafe(allNewsBtn, 'click', () => {
                if (window.toastManager) {
                    window.toastManager.info('Все новости в разработке');
                }
            });
        }
    }

    /**
     * Setup mobile modals
     */
    setupMobileModals() {
        const closeButtons = document.querySelectorAll('.close-mobile-modal');
        closeButtons.forEach(btn => {
            Utils.addEventListenerSafe(btn, 'click', () => {
                const modal = btn.closest('.fixed');
                if (modal) {
                    modal.classList.add('hidden');
                }
            });
        });
    }

    /**
     * Load initial content
     */
    async loadInitialContent() {
        try {
            // Load games and news
            await this.managers.content.loadGames();
            await this.managers.content.loadNews();

            // Initialize game search
            this.managers.search.init();

        } catch (error) {
            console.error('Error loading initial content:', error);
            if (window.toastManager) {
                window.toastManager.error('Ошибка загрузки контента');
            }
        }
    }

    /**
     * Update UI based on user authentication state
     */
    updateUIForUserState() {
        console.log('GameHubApp - updateUIForUserState called');
        const currentUser = this.managers.auth.getCurrentUser();
        console.log('GameHubApp - updateUIForUserState - currentUser:', currentUser);
        
        if (currentUser) {
            this.showLoggedInUI(currentUser);
        } else {
            this.showLoggedOutUI();
        }
    }

    /**
     * Show UI for logged in user
     */
    showLoggedInUI(user) {
        console.log('GameHubApp - showLoggedInUI called with user:', user);
        
        // Hide login/register buttons
        const loginButtons = document.querySelectorAll('#desktop-login-btn, #mobile-login-btn, #desktop-register-btn, #mobile-register-btn');
        loginButtons.forEach(btn => {
            if (btn) btn.style.display = 'none';
        });

        // Show user profile elements
        const profileElements = document.querySelectorAll('#desktop-profile-btn, #mobile-profile-option, #mobile-account-option, #mobile-friends-option, #mobile-about-option, #mobile-logout-btn, #delete-account-btn-mobile');
        profileElements.forEach(element => {
            if (element) element.style.display = 'block';
        });

        // Show notification history button
        const notificationHistoryBtn = Utils.getElement('notification-history-btn');
        if (notificationHistoryBtn) {
            notificationHistoryBtn.classList.remove('hidden');
            console.log('GameHubApp - notificationHistoryBtn shown');
        }

        // Update profile button text
        const profileBtn = document.getElementById('desktop-profile-btn');
        if (profileBtn) {
            profileBtn.textContent = user.username || 'Профиль';
        }

        // Setup profile button click
        if (profileBtn) {
            Utils.addEventListenerSafe(profileBtn, 'click', () => {
                if (this.managers.profile) {
                    this.managers.profile.showProfile();
                }
            });
        }

        // Setup logout functionality
        const logoutButtons = document.querySelectorAll('#mobile-logout-btn, #delete-account-btn-mobile');
        logoutButtons.forEach(btn => {
            if (btn) {
                Utils.addEventListenerSafe(btn, 'click', () => {
                    this.managers.auth.logout();
                });
            }
        });

        // Setup friends functionality
        const friendsBtn = document.getElementById('mobile-friends-option');
        if (friendsBtn) {
            Utils.addEventListenerSafe(friendsBtn, 'click', () => {
                if (this.managers.friends) {
                    this.managers.friends.showFriends();
                }
            });
        }

        // Setup about functionality
        const aboutBtn = document.getElementById('mobile-about-option');
        if (aboutBtn) {
            Utils.addEventListenerSafe(aboutBtn, 'click', () => {
                if (window.modalManager) {
                    window.modalManager.open('about');
                }
            });
        }

        // Setup account functionality
        const accountBtn = document.getElementById('mobile-account-option');
        if (accountBtn) {
            Utils.addEventListenerSafe(accountBtn, 'click', () => {
                if (this.managers.profile) {
                    this.managers.profile.showAccountSettings();
                }
            });
        }

        console.log('✅ Logged in UI setup completed');
    }

    /**
     * Show UI for logged out user
     */
    showLoggedOutUI() {
        // Show login/register buttons
        const loginButtons = document.querySelectorAll('#desktop-login-btn, #mobile-login-btn, #desktop-register-btn, #mobile-register-btn');
        loginButtons.forEach(btn => {
            if (btn) btn.style.display = 'block';
        });

        // Hide user profile elements
        const profileElements = document.querySelectorAll('#desktop-profile-btn, #mobile-profile-option, #mobile-account-option, #mobile-friends-option, #mobile-about-option, #mobile-logout-btn, #delete-account-btn-mobile');
        profileElements.forEach(element => {
            if (element) element.style.display = 'none';
        });

        // Hide notification history button
        const notificationHistoryBtn = Utils.getElement('notification-history-btn');
        if (notificationHistoryBtn) {
            notificationHistoryBtn.classList.add('hidden');
            console.log('GameHubApp - notificationHistoryBtn hidden');
        }

        // Setup login/register button clicks
        const loginButtonsArray = Array.from(loginButtons);
        loginButtonsArray.forEach(btn => {
            if (btn) {
                Utils.addEventListenerSafe(btn, 'click', () => {
                    if (this.managers.auth) {
                        this.managers.auth.showLogin();
                    }
                });
            }
        });

        const registerButtons = document.querySelectorAll('#desktop-register-btn, #mobile-register-btn');
        registerButtons.forEach(btn => {
            if (btn) {
                Utils.addEventListenerSafe(btn, 'click', () => {
                    if (this.managers.auth) {
                        this.managers.auth.showRegister();
                    }
                });
            }
        });

        console.log('✅ Logged out UI setup completed');
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    /**
     * Show browser warning
     */
    showBrowserWarning(message) {
        console.warn('Browser warning:', message);
        if (window.toastManager) {
            window.toastManager.warning(message);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error('Application error:', message);
        if (window.toastManager) {
            window.toastManager.error(message);
        }
    }

    /**
     * Cleanup before unload
     */
    cleanup() {
        try {
            // Save any pending data
            if (window.gameHubDataManager) {
                window.gameHubDataManager.saveData();
            }
            
            console.log('✅ Cleanup completed');
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }

    /**
     * Get a specific manager
     */
    getManager(name) {
        return this.managers[name];
    }

    /**
     * Get all managers
     */
    getManagers() {
        return this.managers;
    }

    /**
     * Setup managers in global scope
     */
    setupManagersInGlobalScope() {
        try {
            // Make individual managers accessible globally
            Object.entries(this.managers).forEach(([name, manager]) => {
                window.managers[name] = manager;
            });
            
            console.log('✅ Managers setup in global scope');
        } catch (error) {
            console.error('Error setting up managers in global scope:', error);
        }
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new GameHubApp();
    app.init().catch(error => {
        console.error('Failed to initialize GameHub:', error);
    });
});

// Export for potential external use
export { GameHubApp }; 