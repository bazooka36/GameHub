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

        // Setup managers in global scope
        this.setupManagersInGlobalScope();

        // Setup notification history
        if (window.toastManager) {
            window.toastManager.setupNotificationHistory();
        }

        console.log('✅ settings manager initialized');
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
        const navButtons = document.querySelectorAll('nav button');
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
        const currentUser = this.managers.user.getCurrentUser();
        
        if (currentUser) {
            // User is logged in
            this.showLoggedInUI(currentUser);
        } else {
            // User is not logged in
            this.showLoggedOutUI();
        }
    }

    /**
     * Show UI for logged in user
     */
    showLoggedInUI(user) {
        // Hide login/register buttons
        const loginBtns = document.querySelectorAll('#desktop-login-btn, #mobile-login-btn');
        const registerBtns = document.querySelectorAll('#desktop-register-btn, #mobile-register-btn');
        
        loginBtns.forEach(btn => btn.classList.add('hidden'));
        registerBtns.forEach(btn => btn.classList.add('hidden'));

        // Show user menu - remove hidden class to make it visible
        const burgerMenu = document.querySelector('.burger-menu');
        if (burgerMenu) {
            burgerMenu.classList.remove('hidden');
            burgerMenu.style.display = 'block';
        }

        // Show mobile profile options
        const mobileProfileOptions = document.querySelector('.mobile-profile-options');
        if (mobileProfileOptions) {
            mobileProfileOptions.classList.remove('hidden');
        }

        // Update mobile menu
        this.managers.mobile.updateMobileMenuForUserState(true);

        // Admin button is completely hidden from main site
        // Access to admin panel is only available through direct URL: admin.html
        const adminBtn = document.getElementById('admin-btn');
        if (adminBtn) {
            adminBtn.classList.add('hidden');
        }
    }

    /**
     * Show UI for logged out user
     */
    showLoggedOutUI() {
        // Show login/register buttons
        const loginBtns = document.querySelectorAll('#desktop-login-btn, #mobile-login-btn');
        const registerBtns = document.querySelectorAll('#desktop-register-btn, #mobile-register-btn');
        
        loginBtns.forEach(btn => btn.classList.remove('hidden'));
        registerBtns.forEach(btn => btn.classList.remove('hidden'));

        // Hide user menu - add hidden class and set display none
        const burgerMenu = document.querySelector('.burger-menu');
        if (burgerMenu) {
            burgerMenu.classList.add('hidden');
            burgerMenu.style.display = 'none';
        }

        // Hide mobile profile options
        const mobileProfileOptions = document.querySelector('.mobile-profile-options');
        if (mobileProfileOptions) {
            mobileProfileOptions.classList.add('hidden');
        }

        // Update mobile menu
        this.managers.mobile.updateMobileMenuForUserState(false);

        // Hide admin button
        const adminBtn = document.getElementById('admin-btn');
        if (adminBtn) {
            adminBtn.classList.add('hidden');
        }
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }

    /**
     * Show browser warning
     */
    showBrowserWarning(message) {
        console.warn('Browser Warning:', message);
        if (window.toastManager) {
            window.toastManager.warning(message);
        } else {
            alert('Предупреждение: ' + message);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error('Application Error:', message);
        if (window.toastManager) {
            window.toastManager.error(message);
        } else {
            alert('Ошибка: ' + message);
        }
    }

    /**
     * Cleanup before unload
     */
    cleanup() {
        try {
            // Save any pending data
            if (this.managers.user) {
                this.managers.user.saveUserData();
            }
            
            console.log('🧹 GameHub cleanup completed');
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
            Object.entries(this.managers).forEach(([name, manager]) => {
                window[`${name}Manager`] = manager;
                window.managers[name] = manager;
            });
            console.log('✅ Managers setup in global scope');
        } catch (error) {
            console.error('Error setting up managers in global scope:', error);
        }
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const app = new GameHubApp();
    await app.init();
});

// Export for potential external use
export { GameHubApp }; 