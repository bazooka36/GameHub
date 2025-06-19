/**
 * Главная точка входа приложения GameHub
 * Импортирует все модули и инициализирует приложение
 */

import { Utils } from './utils.js';
import { modalManager } from './modalManager.js';
import { toastManager } from './toastManager.js';

// Импорт менеджеров (они будут созданы как отдельные модули)
import { UserManager } from './managers/userManager.js';
import { AuthManager } from './managers/authManager.js';
import { ProfileManager } from './managers/profileManager.js';
import { FriendsManager } from './managers/friendsManager.js';
import { ContentLoader } from './managers/contentLoader.js';
import { GameSearch } from './managers/gameSearch.js';
import { SupportManager } from './managers/supportManager.js';
import { DataManager } from './managers/dataManager.js';

/**
 * Главный класс приложения
 */
class GameHubApp {
    constructor() {
        this.managers = {};
        this.isInitialized = false;
    }

    /**
     * Инициализация приложения
     */
    async init() {
        try {
            console.log('🚀 Инициализация GameHub...');

            this.initializeDataManager();
            this.setupGlobalReferences();

            const support = Utils.checkBrowserSupport();
            if (!support.localStorage) {
                this.showBrowserWarning('localStorage не поддерживается вашим браузером');
            }

            await this.initializeManagers();

            if (typeof modalManager !== 'undefined') {
                modalManager.hideAllModals();
            }

            this.setupEventListeners();
            await this.loadInitialContent();
            this.hideLoadingScreen();
            this.updateUIForUserState();

            this.isInitialized = true;
            console.log('✅ GameHub успешно инициализирован');
        } catch (error) {
            console.error('❌ Не удалось инициализировать GameHub:', error);
            this.showError('Ошибка инициализации приложения: ' + error.message);
        }
    }

    /**
     * Инициализация DataManager как глобального слоя данных
     */
    initializeDataManager() {
        try {
            window.gameHubDataManager = new DataManager();
            window.gameHubDataManager.initializeTestData();
            console.log('✅ DataManager инициализирован');
        } catch (error) {
            console.error('❌ Не удалось инициализировать DataManager:', error);
        }
    }

    /**
     * Инициализация всех менеджеров
     */

    async initializeManagers() {
        try {
            this.managers = {
                user: new UserManager(),
                auth: new AuthManager(),
                profile: new ProfileManager(),
                friends: new FriendsManager(),
                content: new ContentLoader(),
                search: new GameSearch(),
                support: new SupportManager(),
            };

            this.setupManagerDependencies();

            // Инициализируем менеджеры по порядку
            const initOrder = ['user', 'auth', 'profile', 'friends', 'content', 'search', 'support'];

            for (const name of initOrder) {
                const manager = this.managers[name];
                if (manager && typeof manager.init === 'function') {
                    try {
                        await manager.init();
                        console.log(`✅ Менеджер ${name} инициализирован`);
                    } catch (error) {
                        console.error(`❌ Ошибка инициализации менеджера ${name}:`, error);
                    }
                } else {
                    console.warn(`⚠️ Менеджер ${name} не найден или не имеет метода init`);
                }
            }

            this.setupManagersInGlobalScope();

            if (typeof toastManager !== 'undefined') {
                await toastManager.init();
                console.log('✅ ToastManager инициализирован');
            }

            console.log('✅ Все менеджеры инициализированы');
        } catch (error) {
            console.error('❌ Критическая ошибка инициализации менеджеров:', error);
            throw error;
        }
    }

    /**
     * Настройка зависимостей между менеджерами
     */
    setupManagerDependencies() {
        this.managers.auth.setUserManager(this.managers.user);
        this.managers.profile.setUserManager(this.managers.user);
        this.managers.friends.setUserManager(this.managers.user);
    }

    /**
     * Настройка глобальных ссылок для межмодульного доступа
     */
    setupGlobalReferences() {
        try {
            window.gameHubApp = this;
            if (typeof modalManager !== 'undefined') window.modalManager = modalManager;
            if (typeof toastManager !== 'undefined') window.toastManager = toastManager;
            window.utils = Utils;
            window.managers = {};
            console.log('✅ Настройка глобальных ссылок завершена');
        } catch (error) {
            console.error('Ошибка настройки глобальных ссылок:', error);
        }
    }

    /**
     * Получить конкретный менеджер по имени
     * @param {string} name - Имя менеджера
     * @returns {Object|null} Экземпляр менеджера
     */
    getManager(name) {
        return this.managers[name] || null;
    }

    /**
     * Настройка глобальных обработчиков событий
     */
    setupEventListeners() {
        window.addEventListener('load', () => this.hideLoadingScreen());
        window.addEventListener('beforeunload', () => this.cleanup());

        window.addEventListener('error', (e) => {
            Utils.handleError(e.error, 'Глобальная ошибка');
        });

        window.addEventListener('unhandledrejection', (e) => {
            Utils.handleError(e.reason, 'Необработанное отклонение промиса');
        });

        this.setupNavigationButtons();
        this.setupFooterElements();
        this.setupAuthButtons(); 
        this.setupBurgerMenu();
        this.setupModalCloseButtons();
        this.setupGameSearch(); 
        this.setupSupportForm(); 
        this.setupNotificationButtons(); 

        // Добавляем обработчик для кнопки "Выйти"
        const logoutButton = document.getElementById('desktop-logout-btn');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                const authManager = this.managers.auth;
                if (authManager && typeof authManager.logout === 'function') {
                    authManager.logout();
                    console.log('Пользователь вышел из системы.');
                } else {
                    console.warn('Менеджер аутентификации не найден или метод logout отсутствует.');
                }
            });
        } else {
            console.warn('Кнопка "Выйти" не найдена.');
        }
    }

    setupAuthButtons() {
        const registerButtons = document.querySelectorAll('#desktop-register-btn');
        const loginButtons = document.querySelectorAll('#desktop-login-btn');
        const authModal = document.getElementById('auth-modal');

        if (!authModal) {
            console.error('auth-modal не найден.');
            return;
        }

        // Обработчики для кнопки регистрации
        registerButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modalManager.showModal(authModal);
                const registerTab = document.getElementById('show-register');
                if (registerTab) {
                    registerTab.click(); // Переключаемся на вкладку регистрации
                } else {
                    console.warn('Вкладка регистрации не найдена.');
                }
            });
        });

        // Обработчики для кнопки входа
        loginButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modalManager.showModal(authModal);
                const loginTab = document.getElementById('show-login');
                if (loginTab) {
                    loginTab.click(); // Переключаемся на вкладку входа
                } else {
                    console.warn('Вкладка входа не найдена.');
                }
            });
        });
    }

    setupBurgerMenu() {
        // Обработчик для кнопки бургер-меню
        const burgerButton = document.querySelector('.burger-menu-button');
        if (burgerButton) {
            burgerButton.addEventListener('click', () => {
                const burgerMenu = document.querySelector('.burger-menu');
                if (burgerMenu) {
                    burgerMenu.classList.toggle('active');
                    burgerButton.setAttribute('aria-expanded',
                        burgerMenu.classList.contains('active').toString());
                }
            });
        }

        // Обработчики для элементов бургер-меню
        const menuItems = document.querySelectorAll('.burger-menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const action = item.id;
                this.handleBurgerMenuAction(action);

                // Закрыть меню после выбора
                const burgerMenu = document.querySelector('.burger-menu');
                if (burgerMenu) {
                    burgerMenu.classList.remove('active');
                }
            });
        });
    }

    handleBurgerMenuAction(action) {
        switch (action) {
            case 'profile-option':
                this.showModal('profile-modal');
                break;
            case 'friends-option':
                this.showModal('friends-modal');
                break;
            case 'desktop-change-password-btn':
                this.showModal('change-password-modal');
                break;
            case 'desktop-delete-account-btn':
                this.showModal('delete-account-modal');
                break;
            case 'desktop-logout-btn':
                if (this.managers.auth && typeof this.managers.auth.logout === 'function') {
                    this.managers.auth.logout();
                }
                break;
            case 'about-option':
                this.showModal('about-modal');
                break;
            default:
                console.warn('Неизвестное действие бургер-меню:', action);
        }
    }

    setupModalCloseButtons() {
        // Обработчики для кнопок закрытия всех модальных окон
        const closeButtons = document.querySelectorAll('.auth-modal button[aria-label="Закрыть"], .profile-close, .friends-close');

        closeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const modal = button.closest('.auth-modal, .profile-modal, .friends-modal');
                if (modal) {
                    modalManager.hideModal(modal);
                }
            });
        });

        // Обработчики для кнопки "Закрыть" в модальном окне "О проекте"
        const closeAboutBtn = document.getElementById('close-about');
        if (closeAboutBtn) {
            closeAboutBtn.addEventListener('click', () => {
                const aboutModal = document.getElementById('about-modal');
                if (aboutModal) {
                    modalManager.hideModal(aboutModal);
                }
            });
        }

        // Обработчики для кнопки "Отмена" в модальном окне удаления аккаунта
        const cancelDeleteBtn = document.getElementById('cancel-delete-account');
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => {
                const deleteModal = document.getElementById('delete-account-modal');
                if (deleteModal) {
                    modalManager.hideModal(deleteModal);
                }
            });
        }
    }

    setupGameSearch() {
        // Обработчик для кнопки поиска
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const searchManager = this.managers.search;
                if (searchManager && typeof searchManager.performSearch === 'function') {
                    searchManager.performSearch();
                } else {
                    console.warn('Менеджер поиска не найден');
                }
            });
        }

        // Обработчики для фильтров поиска
        const filterButtons = document.querySelectorAll('.search-filter');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                const searchManager = this.managers.search;
                if (searchManager && typeof searchManager.handleFilterClick === 'function') {
                    searchManager.handleFilterClick(e);
                } else {
                    console.warn('Менеджер поиска не найден');
                }
            });
        });

        // Обработчик для кнопки очистки поиска
        const clearSearchBtn = document.getElementById('clear-search');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                const searchManager = this.managers.search;
                if (searchManager && typeof searchManager.clearSearch === 'function') {
                    searchManager.clearSearch();
                } else {
                    console.warn('Менеджер поиска не найден');
                }
            });
        }

        // Обработчик для поля поиска (Enter)
        const searchInput = document.getElementById('game-search');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const searchManager = this.managers.search;
                    if (searchManager && typeof searchManager.performSearch === 'function') {
                        searchManager.performSearch();
                    }
                }
            });
        }
    }

    setupSupportForm() {
        // Обработчик для кнопки отправки запроса в техподдержку
        const submitSupportBtn = document.getElementById('submit-support-ticket');
        if (submitSupportBtn) {
            submitSupportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const supportManager = this.managers.support;
                if (supportManager && typeof supportManager.submitSupportTicket === 'function') {
                    supportManager.submitSupportTicket();
                } else {
                    console.warn('Менеджер техподдержки не найден');
                    if (window.toastManager) {
                        window.toastManager.error('Функция техподдержки недоступна');
                    }
                }
            });
        }
    }

    setupNotificationButtons() {
        // Обработчик для кнопки истории уведомлений
        const notificationHistoryBtn = document.getElementById('notification-history-btn');
        if (notificationHistoryBtn) {
            notificationHistoryBtn.addEventListener('click', () => {
                const notificationModal = document.getElementById('notification-history-modal');
                if (notificationModal) {
                    // Используем более надежный способ переключения видимости
                    if (notificationModal.classList.contains('hidden')) {
                        notificationModal.classList.remove('hidden');
                        notificationModal.style.display = 'flex';
                    } else {
                        notificationModal.classList.add('hidden');
                        notificationModal.style.display = 'none';
                    }
                    
                    // Загрузить историю уведомлений
                    if (window.toastManager && typeof window.toastManager.loadNotificationHistory === 'function') {
                        window.toastManager.loadNotificationHistory();
                    }
                    
                    console.log('🔔 Модальное окно уведомлений переключено');
                } else {
                    console.warn('❌ Модальное окно уведомлений не найдено');
                }
            });
            console.log('✅ Обработчик кнопки уведомлений настроен');
        } else {
            console.warn('❌ Кнопка уведомлений не найдена');
        }
    
        // Обработчик для кнопки очистки уведомлений
        const clearNotificationsBtn = document.getElementById('clear-notifications');
        if (clearNotificationsBtn) {
            clearNotificationsBtn.addEventListener('click', () => {
                if (window.toastManager && typeof window.toastManager.clearNotificationHistory === 'function') {
                    window.toastManager.clearNotificationHistory();
                }
            });
        }
    
        // Закрытие модального окна уведомлений при клике снаружи
        const notificationModal = document.getElementById('notification-history-modal');
        if (notificationModal) {
            notificationModal.addEventListener('click', (e) => {
                if (e.target === notificationModal) {
                    notificationModal.classList.add('hidden');
                    notificationModal.style.display = 'none';
                }
            });
        }
    }

    handleAuthButtonClick(button) {
        const id = button.id;
        const actions = {
            login: () => this.showAuthModal('login'),
            register: () => this.showAuthModal('register'),
            logout: () => this.managers.auth.logout(),
            profile: () => this.showModal('profile-modal'),
            friends: () => this.showModal('friends-modal'),
            about: () => this.showModal('about-modal'),
        };

        for (const [key, action] of Object.entries(actions)) {
            if (id.includes(key)) {
                action();
                break;
            }
        }
    }

    showAuthModal(mode) {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modalManager.showModal(modal, { mode: mode }); // Явно передаем режим
        } else {
            console.warn('auth-modal не найден.');
            if (window.toastManager) {
                window.toastManager.error('Модальное окно аутентификации не найдено.');
            }
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modalManager.showModal(modal);
        } else {
            console.warn(`${modalId} не найден.`);
            if (window.toastManager) {
                window.toastManager.error(`Модальное окно "${modalId}" не найдено.`);
            }
        }
    }

    setupNavigationButtons() {
        const navButtons = document.querySelectorAll('nav button:not(.burger-menu-button)');
        navButtons.forEach(btn => {
            if (btn) {
                Utils.addEventListenerSafe(btn, 'click', () => {
                    if (window.toastManager) {
                        window.toastManager.info('Страница в разработке');
                    }
                });
            }
        });
    }

    setupFooterElements() {
        const footerButtons = document.querySelectorAll('footer button');
        footerButtons.forEach(btn => {
            if (btn) {
                Utils.addEventListenerSafe(btn, 'click', () => {
                    if (window.toastManager) {
                        window.toastManager.info('Функция в разработке');
                    }
                });
            }
        });

        const footerLinks = document.querySelectorAll('footer a[href="#"]');
        footerLinks.forEach(link => {
            if (link) {
                Utils.addEventListenerSafe(link, (e) => {
                    e.preventDefault();
                    if (window.toastManager) {
                        window.toastManager.info('Страница в разработке');
                    }
                });
            }
        });

        const allNewsBtn = document.querySelector('main .text-center button');
        if (allNewsBtn) {
            Utils.addEventListenerSafe(allNewsBtn, 'click', () => {
                if (window.toastManager) {
                    window.toastManager.info('Все новости в разработке');
                }
            });
        }
    }

    async loadInitialContent() {
        try {
            console.log('🔄 Загрузка начального контента...');
            
            // Убеждаемся, что DataManager инициализирован
            if (!window.gameHubDataManager) {
                console.warn('DataManager не найден, создаем новый...');
                window.gameHubDataManager = new DataManager();
                window.gameHubDataManager.initializeTestData();
            }
            
            // Загружаем контент
            await this.managers.content.loadGames();
            await this.managers.content.loadNews();
            
            // Инициализируем поиск
            if (this.managers.search && typeof this.managers.search.init === 'function') {
                this.managers.search.init();
            }
            
            console.log('✅ Начальный контент загружен');
            console.log(`📊 Загружено: ${this.managers.content.getGames().length} игр, ${this.managers.content.getNews().length} новостей`);
            
        } catch (error) {
            console.error('❌ Ошибка загрузки начального контента:', error);
            if (window.toastManager) {
                window.toastManager.error('Ошибка загрузки контента');
            }
        }
    }

    updateUIForUserState() {
        try {
            const currentUser = this.managers.auth.getCurrentUser();
            if (currentUser) {
                this.showLoggedInUI(currentUser);
            } else {
                this.showLoggedOutUI();
            }
        } catch (error) {
            console.error('Ошибка обновления UI для состояния пользователя:', error);
            this.showError('Ошибка обновления пользовательского интерфейса.');
        }
    }

    showLoggedInUI(user) {
        this.updateUIElements({
            loginButtonsVisible: false,
            profileElementsVisible: true,
            burgerMenuVisible: true // Показываем бургер-меню
        });
        const profileBtn = document.getElementById('desktop-profile-btn');
        if (profileBtn) {
            profileBtn.textContent = user.username || 'Профиль';
        }
    }

    showLoggedOutUI() {
        this.updateUIElements({
            loginButtonsVisible: true,
            profileElementsVisible: false,
            burgerMenuVisible: false // Скрываем бургер-меню
        });
    }

    updateUIElements({ loginButtonsVisible, profileElementsVisible, burgerMenuVisible }) {
        this.toggleElementsVisibility('#desktop-login-btn, #desktop-register-btn', loginButtonsVisible);
        this.toggleElementsVisibility('#desktop-profile-btn', profileElementsVisible);

        // Добавляем отображение/скрытие бургер-меню
        const burgerMenu = document.querySelector('.burger-menu');
        if (burgerMenu) {
            burgerMenu.style.display = burgerMenuVisible ? 'block' : 'none';
        }
    }

    toggleElementsVisibility(selectors, isVisible) {
        const elements = document.querySelectorAll(selectors);
        elements.forEach(element => {
            if (element) {
                element.style.display = isVisible ? 'block' : 'none';
            }
        });
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        } else {
            console.warn('Элемент экрана загрузки не найден.');
        }
    }

    showBrowserWarning(message) {
        if (window.toastManager && typeof window.toastManager.warning === 'function') {
            window.toastManager.warning(message);
        } else {
            alert(`Предупреждение: ${message}`);
        }
    }

    showError(message) {
        console.error('Ошибка приложения:', message);
        if (window.toastManager) {
            window.toastManager.error(message);
        }
    }

    cleanup() {
        try {
            if (window.gameHubDataManager && typeof window.gameHubDataManager.saveData === 'function') {
                window.gameHubDataManager.saveData();
            } else {
                console.warn('DataManager не найден или метод saveData отсутствует.');
            }
        } catch (error) {
            console.error('Ошибка во время очистки:', error);
        }
    }

    setupManagersInGlobalScope() {
        try {
            Object.entries(this.managers).forEach(([name, manager]) => {
                if (manager) {
                    window.managers[name] = manager;
                } else {
                    console.warn(`Менеджер ${name} не инициализирован.`);
                }
            });
        } catch (error) {
            console.error('Ошибка настройки менеджеров в глобальной области видимости:', error);
        }
    }
}

// Инициализация приложения когда DOM готов
document.addEventListener('DOMContentLoaded', () => {
    const app = new GameHubApp();
    app.init().catch(error => {
        console.error('Не удалось инициализировать GameHub:', error);
    });
});

// Экспорт для потенциального внешнего использования
export { GameHubApp };