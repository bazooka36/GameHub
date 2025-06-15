/**
 * User Manager for GameHub
 * Handles user authentication, profile management, and UI updates
 */

import { Utils } from '../utils.js';
import { modalManager } from '../modalManager.js';
import { toastManager } from '../toastManager.js';

export class UserManager {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the user manager
     */
    async init() {
        try {
            console.log('UserManager - init started');
            
            // Load current user from storage
            this.currentUser = this.getCurrentUser();
            console.log('UserManager - init - currentUser:', this.currentUser);
            
            // Update UI based on user state
            this.updateAuthUI();
            
            this.isInitialized = true;
            console.log('UserManager initialized');
        } catch (error) {
            console.error('Error initializing UserManager:', error);
            throw error;
        }
    }

    /**
     * Get current user from storage
     * @returns {Object|null} Current user object
     */
    getCurrentUser() {
        const user = Utils.safeGetItem('currentUser');
        console.log('UserManager - getCurrentUser:', user);
        return user;
    }

    /**
     * Set current user in storage
     * @param {Object} user - User object
     * @returns {boolean} Success status
     */
    setCurrentUser(user) {
        console.log('UserManager - setCurrentUser:', user);
        this.currentUser = user;
        return Utils.safeSetItem('currentUser', user);
    }

    /**
     * Update user in users array
     * @param {Object} user - Updated user object
     */
    updateUserInArray(user) {
        const users = Utils.safeGetItem('users', []);
        const userIndex = users.findIndex(u => u.email === user.email);
        
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...user };
            Utils.safeSetItem('users', users);
        }
    }

    /**
     * Update UI for logged in user
     * @param {string} email - User email
     */
    updateUIForLoggedInUser(email) {
        console.log('UserManager - updateUIForLoggedInUser called with email:', email);
        
        // Hide auth buttons
        const authButtons = document.querySelectorAll('#desktop-register-btn, #desktop-login-btn, #mobile-register-btn, #mobile-login-btn');
        authButtons.forEach(btn => {
            if (btn) btn.style.display = 'none';
        });

        // Show burger menu
        const burgerMenu = document.querySelector('.burger-menu');
        if (burgerMenu) burgerMenu.style.display = 'block';

        // Show mobile profile options
        const mobileProfileOptions = document.querySelector('.mobile-profile-options');
        if (mobileProfileOptions) mobileProfileOptions.classList.remove('hidden');

        // Show notification history button
        const notificationHistoryBtn = Utils.getElement('notification-history-btn');
        console.log('UserManager - notificationHistoryBtn found:', !!notificationHistoryBtn);
        if (notificationHistoryBtn) {
            notificationHistoryBtn.classList.remove('hidden');
            console.log('UserManager - notificationHistoryBtn shown');
        }

        // Check for support notifications
        this.checkSupportNotifications(email);

        // Admin button is now completely hidden from main site
        // Access to admin panel is only available through direct URL: admin.html
        const adminBtn = Utils.getElement('admin-btn');
        if (adminBtn) {
            adminBtn.classList.add('hidden');
        }

        // Generate user ID if not exists
        const currentUser = this.getCurrentUser();
        if (currentUser && !currentUser.id) {
            currentUser.id = Utils.generateUniqueId();
            this.setCurrentUser(currentUser);
            this.updateUserInArray(currentUser);
        }
    }

    /**
     * Check for support notifications
     */
    checkSupportNotifications(email) {
        const supportManager = window.gameHubApp?.getManager('support');
        if (supportManager && email) {
            const unreadCount = supportManager.getUserUnreadCount(email);
            if (unreadCount > 0) {
                toastManager.info(`У вас ${unreadCount} непрочитанное(ых) уведомление(й) от администратора`);
            }
        }
    }

    /**
     * Handle user logout
     */
    handleLogout() {
        this.setCurrentUser(null);
        
        // Hide burger menu
        const burgerMenu = document.querySelector('.burger-menu');
        if (burgerMenu) burgerMenu.style.display = 'none';

        // Show auth buttons
        const authButtons = document.querySelectorAll('#desktop-register-btn, #desktop-login-btn, #mobile-register-btn, #mobile-login-btn');
        authButtons.forEach(btn => {
            if (btn) btn.style.display = '';
        });

        // Hide mobile profile options
        const mobileProfileOptions = document.querySelector('.mobile-profile-options');
        if (mobileProfileOptions) mobileProfileOptions.classList.add('hidden');

        // Hide notification history button
        const notificationHistoryBtn = Utils.getElement('notification-history-btn');
        if (notificationHistoryBtn) notificationHistoryBtn.classList.add('hidden');

        // Hide admin button
        const adminBtn = Utils.getElement('admin-btn');
        if (adminBtn) adminBtn.classList.add('hidden');

        // Update UI
        this.updateAuthUI();
        
        toastManager.success('Вы успешно вышли из аккаунта');
    }

    /**
     * Update authentication UI
     */
    updateAuthUI() {
        console.log('UserManager - updateAuthUI called');
        const currentUser = this.getCurrentUser();
        console.log('UserManager - updateAuthUI - currentUser:', currentUser);
        
        if (currentUser) {
            this.updateUIForLoggedInUser(currentUser.email);
        }
        this.setupLogoutButtons();
        this.setupDeleteAccountButtons();
        this.setupBurgerMenu();
    }

    /**
     * Setup logout buttons
     */
    setupLogoutButtons() {
        const logoutButtons = document.querySelectorAll('#desktop-logout-btn, #mobile-logout-btn');
        logoutButtons.forEach(btn => {
            Utils.addEventListenerSafe(btn, 'click', () => {
                this.handleLogout();
            });
        });
    }

    /**
     * Setup delete account buttons
     */
    setupDeleteAccountButtons() {
        const deleteButtons = document.querySelectorAll('#desktop-delete-account-btn, #delete-account-btn-mobile');
        deleteButtons.forEach(btn => {
            Utils.addEventListenerSafe(btn, 'click', () => {
                this.showDeleteAccountModal();
            });
        });
    }

    /**
     * Setup burger menu functionality
     */
    setupBurgerMenu() {
        const burgerMenuButton = document.querySelector('.burger-menu-button');
        const burgerMenu = document.querySelector('.burger-menu');
        const burgerMenuContent = document.querySelector('.burger-menu-content');
        const burgerMenuOverlay = document.querySelector('.burger-menu-overlay');
        const accountOption = Utils.getElement('account-option');
        const accountSubmenu = Utils.getElement('account-submenu');
        const mobileAccountOption = Utils.getElement('mobile-account-option');
        const mobileAccountSubmenu = Utils.getElement('mobile-account-submenu');

        if (burgerMenuButton && burgerMenuContent && burgerMenuOverlay) {
            Utils.addEventListenerSafe(burgerMenuButton, 'click', (e) => {
                e.stopPropagation();
                // Check if it's a desktop view
                if (window.innerWidth >= 768) {
                    burgerMenuContent.classList.toggle('active');
                    burgerMenuOverlay.classList.toggle('active');
                } else {
                    // For mobile, use the existing burgerMenu toggle
                    burgerMenu.classList.toggle('active');
                }
            });

            // Close desktop burger menu when clicking overlay
            Utils.addEventListenerSafe(burgerMenuOverlay, 'click', () => {
                if (window.innerWidth >= 768) {
                    burgerMenuContent.classList.remove('active');
                    burgerMenuOverlay.classList.remove('active');
                }
            });
        }

        // Desktop profile option
        const profileOption = Utils.getElement('profile-option');
        if (profileOption) {
            Utils.addEventListenerSafe(profileOption, 'click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showProfileModal();
                if (window.innerWidth >= 768) {
                    burgerMenuContent.classList.remove('active');
                    burgerMenuOverlay.classList.remove('active');
                } else {
                    burgerMenu.classList.remove('active');
                }
            });
        }

        // Desktop friends option
        const friendsOption = Utils.getElement('friends-option');
        if (friendsOption) {
            Utils.addEventListenerSafe(friendsOption, 'click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showFriendsModal();
                if (window.innerWidth >= 768) {
                    burgerMenuContent.classList.remove('active');
                    burgerMenuOverlay.classList.remove('active');
                } else {
                    burgerMenu.classList.remove('active');
                }
            });
        }

        // Desktop about option
        const aboutOption = Utils.getElement('about-option');
        if (aboutOption) {
            Utils.addEventListenerSafe(aboutOption, 'click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showAboutModal();
                if (window.innerWidth >= 768) {
                    burgerMenuContent.classList.remove('active');
                    burgerMenuOverlay.classList.remove('active');
                } else {
                    burgerMenu.classList.remove('active');
                }
            });
        }

        // Desktop account submenu
        if (accountOption && accountSubmenu) {
            Utils.addEventListenerSafe(accountOption, 'click', (e) => {
                e.stopPropagation();
                accountSubmenu.classList.toggle('active');
            });
        }

        // Mobile account submenu
        if (mobileAccountOption && mobileAccountSubmenu) {
            Utils.addEventListenerSafe(mobileAccountOption, 'click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                mobileAccountSubmenu.classList.toggle('active');
            });
        }

        // Close burger menu when clicking outside (only for desktop now that overlay handles it)
        document.addEventListener('click', (e) => {
            if (window.innerWidth >= 768) {
                // Overlay handles closing for desktop
                return;
            } else if (burgerMenu && !burgerMenu.contains(e.target)) {
                burgerMenu.classList.remove('active');
            }
        });
    }

    /**
     * Setup admin button functionality
     */
    setupAdminButton() {
        const adminBtn = Utils.getElement('admin-btn');
        if (adminBtn) {
            Utils.addEventListenerSafe(adminBtn, 'click', () => {
                window.location.href = 'admin.html';
            });
        }
    }

    /**
     * Show delete account confirmation modal
     */
    async showDeleteAccountModal() {
        const confirmed = await modalManager.showConfirmation({
            title: 'Удалить аккаунт',
            message: 'Вы уверены, что хотите удалить свой аккаунт? Это действие необратимо.',
            confirmText: 'Удалить',
            cancelText: 'Отмена',
            confirmClass: 'bg-red-600 hover:bg-red-700',
            cancelClass: 'bg-gray-700 hover:bg-gray-600'
        });

        if (confirmed) {
            this.deleteAccount();
        }
    }

    /**
     * Delete user account
     */
    deleteAccount() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;

        const users = Utils.safeGetItem('users', []);
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        
        if (userIndex !== -1) {
            users.splice(userIndex, 1);
            Utils.safeSetItem('users', users);
        }

        // Clear user data
        this.setCurrentUser(null);
        
        // Clear friends data
        if (Utils.isLocalStorageAvailable()) {
            localStorage.removeItem(`friends_${currentUser.id}`);
            localStorage.removeItem(`friend_requests_${currentUser.id}`);
            localStorage.removeItem(`notificationHistory_${currentUser.id}`);
        }

        // Update UI
        this.handleLogout();
        
        toastManager.success('Аккаунт успешно удален');
    }

    /**
     * Create new user
     * @param {Object} userData - User data
     * @returns {Object} Created user
     */
    createUser(userData) {
        const { email, password, username } = userData;
        
        const userId = Utils.generateUniqueId();
        const newUser = {
            email,
            password,
            id: userId,
            username: username || email.split('@')[0],
            avatar: null,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        const users = Utils.safeGetItem('users', []);
        users.push(newUser);
        Utils.safeSetItem('users', users);

        return newUser;
    }

    /**
     * Authenticate user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Object|null} User object or null
     */
    authenticateUser(email, password) {
        const users = Utils.safeGetItem('users', []);
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Update last login
            user.lastLogin = new Date().toISOString();
            this.updateUserInArray(user);
            this.setCurrentUser(user);
        }
        
        return user;
    }

    /**
     * Check if user exists
     * @param {string} email - User email
     * @returns {boolean} User exists
     */
    userExists(email) {
        const users = Utils.safeGetItem('users', []);
        return users.some(user => user.email === email);
    }

    /**
     * Check if username is unique
     * @param {string} username - Username to check
     * @returns {boolean} Username is unique
     */
    isUsernameUnique(username) {
        const currentUser = this.getCurrentUser();
        const users = Utils.safeGetItem('users', []);
        
        return !users.some(user => 
            user.username === username && user.id !== currentUser?.id
        );
    }

    /**
     * Update user profile
     * @param {Object} updates - Profile updates
     * @returns {boolean} Success status
     */
    updateProfile(updates) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return false;

        const updatedUser = { ...currentUser, ...updates };
        this.setCurrentUser(updatedUser);
        this.updateUserInArray(updatedUser);

        return true;
    }

    /**
     * Get user by ID
     * @param {string} userId - User ID
     * @returns {Object|null} User object or null
     */
    getUserById(userId) {
        const users = Utils.safeGetItem('users', []);
        return users.find(user => user.id === userId) || null;
    }

    /**
     * Get user by email
     * @param {string} email - User email
     * @returns {Object|null} User object or null
     */
    getUserByEmail(email) {
        const users = Utils.safeGetItem('users', []);
        return users.find(user => user.email === email) || null;
    }

    /**
     * Get all users (for admin purposes)
     * @returns {Array} Array of users
     */
    getAllUsers() {
        return Utils.safeGetItem('users', []);
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        // Remove event listeners if needed
        console.log('UserManager cleanup completed');
    }

    /**
     * Show profile modal
     */
    showProfileModal() {
        // Try to get profile manager from different sources
        let profileManager = null;
        
        if (window.managers && window.managers.profile) {
            profileManager = window.managers.profile;
        } else if (window.gameHubApp && window.gameHubApp.getManager) {
            profileManager = window.gameHubApp.getManager('profile');
        } else if (window.profileManager) {
            profileManager = window.profileManager;
        }
        
        if (profileManager && typeof profileManager.showProfileModal === 'function') {
            profileManager.showProfileModal();
        } else {
            console.error('Profile manager not found or showProfileModal method not available');
            // Fallback: directly show the modal
            const modal = document.getElementById('profile-modal');
            if (modal) {
                modal.classList.add('active');
            }
        }
    }

    /**
     * Show friends modal
     */
    showFriendsModal() {
        // Try to get friends manager from different sources
        let friendsManager = null;
        
        if (window.managers && window.managers.friends) {
            friendsManager = window.managers.friends;
        } else if (window.gameHubApp && window.gameHubApp.getManager) {
            friendsManager = window.gameHubApp.getManager('friends');
        } else if (window.friendsManager) {
            friendsManager = window.friendsManager;
        }
        
        if (friendsManager && typeof friendsManager.showFriendsModal === 'function') {
            friendsManager.showFriendsModal();
        } else {
            console.error('Friends manager not found or showFriendsModal method not available');
            // Fallback: directly show the modal
            const modal = document.getElementById('friends-modal');
            if (modal) {
                modal.classList.add('active');
            }
        }
    }

    /**
     * Show about modal
     */
    showAboutModal() {
        const modal = document.getElementById('about-modal');
        if (modal) {
            modal.classList.add('active');
            
            // Add close button handler
            const closeBtn = document.getElementById('close-about');
            if (closeBtn) {
                const closeHandler = () => {
                    modal.classList.remove('active');
                    closeBtn.removeEventListener('click', closeHandler);
                };
                closeBtn.addEventListener('click', closeHandler);
            }
            
            // Add click outside handler
            const clickOutsideHandler = (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    modal.removeEventListener('click', clickOutsideHandler);
                }
            };
            modal.addEventListener('click', clickOutsideHandler);
            
            // Add escape key handler
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    modal.classList.remove('active');
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);
        }
    }
} 