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

            // Загрузить текущего пользователя из хранилища
            this.currentUser = this.getCurrentUser();
            console.log('UserManager - init - currentUser:', this.currentUser);

            // Обновить UI в зависимости от состояния пользователя
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

        // Скрыть кнопки аутентификации
        const authButtons = document.querySelectorAll('#desktop-register-btn, #desktop-login-btn');
        authButtons.forEach(btn => {
            if (btn) btn.style.display = 'none';
        });

        // Показать бургер-меню
        const burgerMenu = document.querySelector('.burger-menu');
        if (burgerMenu) burgerMenu.style.display = 'block';

        // Показать кнопку истории уведомлений
        const notificationHistoryBtn = Utils.getElement('notification-history-btn');
        console.log('UserManager - notificationHistoryBtn found:', !!notificationHistoryBtn);
        if (notificationHistoryBtn) {
            notificationHistoryBtn.classList.remove('hidden');
            notificationHistoryBtn.style.display = 'flex'; // Принудительно показываем
            console.log('UserManager - notificationHistoryBtn shown');
        } else {
            console.warn('UserManager - notificationHistoryBtn not found');
        }

        // Проверить уведомления поддержки
        this.checkSupportNotifications(email);

        // Кнопка администратора теперь полностью скрыта с основного сайта
        // Доступ к панели администратора доступен только через прямой URL: admin.html
        const adminBtn = Utils.getElement('admin-btn');
        if (adminBtn) {
            adminBtn.classList.add('hidden');
        }

        // Сгенерировать ID пользователя если не существует
        const currentUser = this.getCurrentUser();
        if (currentUser && !currentUser.id) {
            currentUser.id = Utils.generateUniqueId();
            this.setCurrentUser(currentUser);
            this.updateUserInArray(currentUser);
        }
        // Обновить бургер-меню: никнейм и аватар
        this.updateBurgerMenuProfile(currentUser);
    }

    updateBurgerMenuProfile(user) {
        const avatar = document.getElementById('burger-profile-avatar');
        const username = document.getElementById('burger-profile-username');
        if (avatar) {
            avatar.src = user && user.avatar ? user.avatar : 'https://via.placeholder.com/40';
        }
        if (username) {
            username.textContent = user && user.username ? user.username : 'Профиль';
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
     * Обработать выход пользователя
     */
    handleLogout() {
        this.setCurrentUser(null);

        // Скрыть бургер-меню
        const burgerMenu = document.querySelector('.burger-menu');
        if (burgerMenu) burgerMenu.style.display = 'none';

        // Показать кнопки аутентификации
        const authButtons = document.querySelectorAll('#desktop-register-btn, #desktop-login-btn');
        authButtons.forEach(btn => {
            if (btn) btn.style.display = '';
        });

        // Скрыть кнопку истории уведомлений
        const notificationHistoryBtn = Utils.getElement('notification-history-btn');
        if (notificationHistoryBtn) notificationHistoryBtn.classList.add('hidden');

        // Скрыть кнопку администратора
        const adminBtn = Utils.getElement('admin-btn');
        if (adminBtn) adminBtn.classList.add('hidden');

        // Обновить UI
        this.updateAuthUI();

        toastManager.success('Вы успешно вышли из аккаунта');

        // Сбросить бургер-меню на дефолт
        this.updateBurgerMenuProfile(null);
    }

    /**
     * Обновить UI аутентификации
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
     * Настроить кнопки выхода
     */
    setupLogoutButtons() {
        const logoutButtons = document.querySelectorAll('#desktop-logout-btn');
        logoutButtons.forEach(btn => {
            // Удаляем предыдущий обработчик, если он был добавлен
            btn.removeEventListener('click', this.handleLogout);

            // Добавляем новый обработчик
            btn.addEventListener('click', () => {
                this.handleLogout();
            });
        });
    }

    /**
     * Настроить кнопки удаления аккаунта
     */
    setupDeleteAccountButtons() {
        const deleteButtons = document.querySelectorAll('#desktop-delete-account-btn');
        deleteButtons.forEach(btn => {
            Utils.addEventListenerSafe(btn, 'click', () => {
                this.showDeleteAccountModal();
            });
        });
    }

    /**
     * Настроить функциональность бургер-меню
     */
    setupBurgerMenu() {
        const burgerMenuButton = document.querySelector('.burger-menu-button');
        const burgerMenu = document.querySelector('.burger-menu');
        const burgerMenuContent = document.querySelector('.burger-menu-content');
        const burgerMenuOverlay = document.querySelector('.burger-menu-overlay');

        if (!burgerMenuButton || !burgerMenu || !burgerMenuContent || !burgerMenuOverlay) {
            console.warn('Элементы бургер-меню не найдены.');
            return;
        }

        // Удаляем предыдущие обработчики, если они были добавлены
        burgerMenuButton.removeEventListener('click', this.toggleBurgerMenu);
        burgerMenuOverlay.removeEventListener('click', this.closeBurgerMenu);

        // Добавляем новые обработчики
        burgerMenuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            burgerMenuContent.classList.toggle('active');
            burgerMenuOverlay.classList.toggle('active');
        });

        burgerMenuOverlay.addEventListener('click', () => {
            burgerMenuContent.classList.remove('active');
            burgerMenuOverlay.classList.remove('active');
        });


        // Опция профиля для десктопа
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

        // Опция друзей для десктопа
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

        // Опция о проекте для десктопа
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

        // Опция смены пароля для десктопа
        const changePasswordOption = Utils.getElement('desktop-change-password-btn');
        if (changePasswordOption) {
            Utils.addEventListenerSafe(changePasswordOption, 'click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                modalManager.showModal(document.getElementById('change-password-modal'));
                if (window.innerWidth >= 768) {
                    burgerMenuContent.classList.remove('active');
                    burgerMenuOverlay.classList.remove('active');
                } else {
                    burgerMenu.classList.remove('active');
                }
            });
        }

        // Опция удаления аккаунта для десктопа
        const deleteAccountOption = Utils.getElement('desktop-delete-account-btn');
        if (deleteAccountOption) {
            Utils.addEventListenerSafe(deleteAccountOption, 'click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                modalManager.showModal(document.getElementById('delete-account-modal'));
                if (window.innerWidth >= 768) {
                    burgerMenuContent.classList.remove('active');
                    burgerMenuOverlay.classList.remove('active');
                } else {
                    burgerMenu.classList.remove('active');
                }
            });
        }

        // Закрыть бургер-меню при клике снаружи (только для десктопа, так как оверлей обрабатывает это)
        document.addEventListener('click', (e) => {
            if (window.innerWidth >= 768) {
                // Оверлей обрабатывает закрытие для десктопа
                return;
            } else if (burgerMenu && !burgerMenu.contains(e.target)) {
                burgerMenu.classList.remove('active');
            }
        });
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
            confirmClass: 'bg-gray-700 hover:bg-gray-600',
            cancelClass: 'bg-gray-700 hover:bg-gray-600'
        });

        if (confirmed) {
            this.deleteAccount();
        }
    }

    /**
     * Delete current user's account
     */
    async deleteAccount() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            toastManager.error('Нет активного пользователя для удаления');
            return;
        }

        const users = Utils.safeGetItem('users', []);
        const updatedUsers = users.filter(user => user.email !== currentUser.email);
        Utils.safeSetItem('users', updatedUsers);

        this.setCurrentUser(null);
        toastManager.success('Аккаунт успешно удален');
        modalManager.hideModal(document.getElementById('delete-account-modal'));
        window.location.reload();
    }

    /**
     * Create a new user and set them as current user
     * @param {Object} userData - User data
     * @returns {Object|null} Created user object
     */
    createUser(userData) {
        const users = Utils.safeGetItem('users', []);
        if (this.userExists(userData.email)) {
            return null; // User already exists
        }

        const newUser = {
            id: this.findNextAvailableId(),
            email: userData.email,
            password: userData.password, // In a real app, hash this
            username: `user${this.findNextAvailableId()}`,
            avatar: '',
            friends: [],
            friendRequests: [],
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        Utils.safeSetItem('users', users);
        this.setCurrentUser(newUser); // Set new user as current

        return newUser;
    }

    /**
     * Finds the next available user ID.
     * Reuses IDs if there are gaps.
     * @returns {number} The next available user ID.
     */
    findNextAvailableId() {
        const users = Utils.safeGetItem('users', []);
        if (users.length === 0) {
            return 100001; // Начальный ID
        }

        const ids = users.map(u => u.id).sort((a, b) => a - b);
        let expectedId = 100001;

        for (const id of ids) {
            if (id > expectedId) {
                return expectedId; // Найден пробел, используем его
            }
            expectedId = id + 1;
        }

        return expectedId; // Пробелов нет, возвращаем следующий по порядку ID
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
            // Обновить последний вход
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
     * Показать модальное окно профиля
     */
    showProfileModal() {
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
            const modal = document.getElementById('profile-modal');
            if (modal) {
                modal.classList.add('active');
            } else {
                console.error('Модальное окно профиля не найдено.');
                if (toastManager) {
                    toastManager.error('Не удалось открыть модальное окно профиля.');
                }
            }
        }
    }

    /**
     * Показать модальное окно друзей
     */
    showFriendsModal() {
        // Попробовать получить менеджер друзей из разных источников
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
            // Резервный вариант: напрямую показать модальное окно
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

    setupUserInterface() {
        // Remove admin button references
        const userMenu = Utils.getElement('user-menu');
        const loginBtn = Utils.getElement('desktop-login-btn');
        const registerBtn = Utils.getElement('desktop-register-btn');
        const logoutBtn = Utils.getElement('desktop-logout-btn');

        // Update UI based on auth state
        if (this.isAuthenticated()) {
            if (loginBtn) loginBtn.classList.add('hidden');
            if (registerBtn) registerBtn.classList.add('hidden');
            if (logoutBtn) logoutBtn.classList.remove('hidden');
        } else {
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (registerBtn) registerBtn.classList.remove('hidden');
            if (logoutBtn) logoutBtn.classList.add('hidden');
        }
    }

    async getAllUsers() {
        throw new Error('Admin functionality has been removed');
    }

    /**
     * Verify user's current password
     * @param {string} email - User's email
     * @param {string} password - Password to verify
     * @returns {boolean} True if password is correct
     */
    verifyPassword(email, password) {
        const users = Utils.safeGetItem('users', []);
        const user = users.find(u => u.email === email);
        return user && user.password === password;
    }

    /**
     * Update user's password
     * @param {string} email - User's email
     * @param {string} newPassword - New password
     */
    updateUserPassword(email, newPassword) {
        const users = Utils.safeGetItem('users', []);
        const userIndex = users.findIndex(u => u.email === email);

        if (userIndex !== -1) {
            users[userIndex].password = newPassword;
            Utils.safeSetItem('users', users);

            // If the updated user is the current user, update the session
            if (this.currentUser && this.currentUser.email === email) {
                this.currentUser.password = newPassword;
                this.setCurrentUser(this.currentUser);
            }
        }
    }
} 