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
            this.setupNotificationButtons();
            this.setupPasswordVisibilityToggles();
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
            // Вызов clearTestData() удален, так как данные больше не хранятся постоянно
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

            // Инициализация всех менеджеров
            for (const manager of Object.values(this.managers)) {
                if (typeof manager.init === 'function') {
                    manager.init();
                }
            }

            this.setupManagersInGlobalScope();

            // Делаем friendsManager глобальным для onclick
            window.friendsManager = this.managers.friends;

            if (typeof toastManager !== 'undefined') {
                await toastManager.init();
                this.managers.toast = toastManager;
                console.log('✅ ToastManager инициализирован');
            }

            console.log('✅ Все менеджеры инициализированы');
            // Гарантируем работу событий для модалок друзей
            if (this.managers.friends && typeof this.managers.friends.setupEventListeners === 'function') {
                this.managers.friends.setupEventListeners();
            }
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
                if (this.managers.friends && typeof this.managers.friends.showFriendsModal === 'function') {
                    this.managers.friends.showFriendsModal();
                } else {
                    this.showModal('friends-modal');
                }
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

        // Обработчик для кнопки "Удалить" в модальном окне удаления аккаунта
        const confirmDeleteBtn = document.getElementById('confirm-delete-account');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (this.managers.user && typeof this.managers.user.deleteAccount === 'function') {
                    await this.managers.user.deleteAccount();
                }
                const deleteModal = document.getElementById('delete-account-modal');
                if (deleteModal && window.modalManager) {
                    window.modalManager.hideModal(deleteModal);
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
            const contentLoader = this.managers.content;
            if (contentLoader) {
                await contentLoader.loadInitialGames();
                console.log('✅ Начальный контент успешно загружен');
            } else {
                console.warn('ContentLoader не найден. Пропуск загрузки контента.');
            }
        } catch (error) {
            console.error('❌ Ошибка при загрузке начального контента:', error);
            // Показать сообщение об ошибке пользователю, если это уместно
            this.showError('Не удалось загрузить игровой контент.');
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
            // Увеличиваем задержку, чтобы учесть обе анимации
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                document.body.classList.add('loaded');

                // Плавное появление контента после скрытия экрана загрузки
                const header = document.querySelector('header');
                const main = document.querySelector('main');
                const footer = document.querySelector('footer');

                if (header) {
                    header.classList.remove('content-hidden');
                    header.classList.add('content-visible');
                }
                if (main) {
                    main.classList.remove('content-hidden');
                    main.classList.add('content-visible');
                }
                if (footer) {
                    footer.classList.remove('content-hidden');
                    footer.classList.add('content-visible');
                }
            }, 2000); // Общая длительность анимации (0.7s + 0.5s + запас)
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

    setupPasswordVisibilityToggles() {
        // Для формы смены пароля — одна общая кнопка
        const allPasswordsBtn = document.getElementById('toggle-all-passwords-visibility');
        const currentPassword = document.getElementById('current-password');
        const newPassword = document.getElementById('new-password');
        const confirmNewPassword = document.getElementById('confirm-new-password');
        if (allPasswordsBtn && currentPassword && newPassword && confirmNewPassword) {
            allPasswordsBtn.addEventListener('click', () => {
                const isVisible = currentPassword.type === 'text' && newPassword.type === 'text' && confirmNewPassword.type === 'text';
                const newType = isVisible ? 'password' : 'text';
                currentPassword.type = newType;
                newPassword.type = newType;
                confirmNewPassword.type = newType;
                allPasswordsBtn.textContent = isVisible ? 'Показать пароли' : 'Скрыть пароли';
            });
        }
        // Для формы входа — индивидуальная кнопка
        const loginPassword = document.getElementById('login-password');
        const toggleLoginPassword = document.getElementById('toggle-login-password-visibility');
        if (loginPassword && toggleLoginPassword) {
            toggleLoginPassword.addEventListener('click', () => {
                const isVisible = loginPassword.type === 'text';
                loginPassword.type = isVisible ? 'password' : 'text';
                toggleLoginPassword.textContent = isVisible ? 'Показать пароль' : 'Скрыть пароль';
            });
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

// После загрузки страницы рендерим 23 карточки игр в стиле Microsoft Store
window.addEventListener('DOMContentLoaded', () => {
    // Популярные игры (пример)
    const games = [
        // --- Слайдер ---
        // Главный слайдер (5 игр)
        {
            title: 'Call of Duty: Modern Warfare',
            image: 'https://cdn.akamai.steamstatic.com/steam/apps/1938090/library_hero.jpg',
        },
        {
            title: 'GTA V',
            image: 'https://cdn.akamai.steamstatic.com/steam/apps/271590/library_hero.jpg',
        },
        {
            title: 'Red Dead Redemption 2',
            image: 'https://cdn.akamai.steamstatic.com/steam/apps/1174180/library_hero.jpg',
        },
        {
            title: 'Cyberpunk 2077',
            image: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/library_hero.jpg',
        },
        {
            title: 'Dota 2',
            image: 'https://cdn.akamai.steamstatic.com/steam/apps/570/library_hero.jpg',
        },
        // Боковые карточки (3 игры)
        {
            title: 'Insurgency: Sandstorm',
            image: 'https://cdn.akamai.steamstatic.com/steam/apps/581320/library_hero.jpg',
        },
        {
            title: 'Squad',
            image: 'https://cdn.akamai.steamstatic.com/steam/apps/393380/library_hero.jpg',
        },
        {
            title: 'Call of Duty: Black Ops III',
            image: 'https://cdn.akamai.steamstatic.com/steam/apps/311210/library_hero.jpg',
        },
        // --- Сетка внизу --- (8 игр)
        {
            title: 'Call of Duty: Modern Warfare',
            image: 'https://cdn.akamai.steamstatic.com/steam/apps/2000950/library_600x900.jpg',
            price: '$59.99 USD',
            tags: ['Шутер от первого лица', 'Военные действия', 'Война', 'Экшен']
        },
        {
            title: 'Insurgency: Sandstorm',
            image: 'https://cdn.akamai.steamstatic.com/steam/apps/581320/library_600x900.jpg',
            price: '$24.99 USD',
            tags: ['Шутер от первого лица', 'Военные действия', 'Война', 'Атмосферная']
        },
        {
            title: 'Squad',
            image: 'https://cdn.akamai.steamstatic.com/steam/apps/393380/library_600x900.jpg',
            price: '$29.99 USD',
            tags: ['Военные действия', 'Шутер от первого лица', 'Атмосферная', 'Реализм']
        },
        {
            title: 'Call of Duty: Black Ops III',
            image: 'https://cdn.akamai.steamstatic.com/steam/apps/311210/library_600x900.jpg',
            price: '$69.99 USD',
            tags: ['Шутер от первого лица', 'Военные действия', 'Война', 'Экшен']
        },
        {
            title: 'Detroit: Become Human',
            image: 'https://cdn.akamai.steamstatic.com/steam/apps/1222140/library_600x900.jpg',
            price: '$39.99 USD',
            tags: ['Интерактивное кино', 'Приключение', 'Выбор имеет значение']
        },
        {
            title: 'Far Cry 5',
            image: 'https://cdn.akamai.steamstatic.com/steam/apps/552520/library_600x900.jpg',
            price: '$49.99 USD',
            tags: ['Открытый мир', 'Шутер', 'Приключение']
        },
        {
            title: 'The Witcher 3: Wild Hunt',
            image: 'https://cdn.akamai.steamstatic.com/steam/apps/292030/library_600x900.jpg',
            price: '$39.99 USD',
            tags: ['RPG', 'Открытый мир', 'Фэнтези']
        },
        {
            title: 'Elden Ring',
            image: 'https://cdn.akamai.steamstatic.com/steam/apps/1245620/library_600x900.jpg',
            price: '$59.99 USD',
            tags: ['Souls-like', 'RPG', 'Открытый мир']
        },
        {
            title: 'God of War',
            image: 'https://cdn.akamai.steamstatic.com/steam/apps/1593500/library_600x900.jpg',
            price: '$49.99 USD',
            tags: ['Экшен', 'Приключение', 'Мифология']
        },
        {
            title: 'Stray',
            image: 'https://cdn.akamai.steamstatic.com/steam/apps/1332010/library_600x900.jpg',
            price: '$29.99 USD',
            tags: ['Приключение', 'Милота', 'Киберпанк']
        },
    ];
    // Индекс для слайдера
    let sliderIndex = 0;
    const mainSliderGames = games.slice(0, 5);
    const sideSliderGames = games.slice(5, 8);
    const gridGames = games.slice(8, 18);
    // Рендер
    function renderAll() {
        if (window.managers && window.managers.content) {
            window.managers.content.renderMainSliderCard(mainSliderGames[sliderIndex]);
            window.managers.content.renderSideSliderCards(sideSliderGames);
            window.managers.content.renderGamesGrid(gridGames);
        }
        // Назначаем обработчики на кнопки после рендера
        const prevBtn = document.getElementById('games-slider-prev');
        const nextBtn = document.getElementById('games-slider-next');
        if (prevBtn) prevBtn.onclick = () => {
            sliderIndex = (sliderIndex - 1 + mainSliderGames.length) % mainSliderGames.length;
            renderAll();
        };
        if (nextBtn) nextBtn.onclick = () => {
            sliderIndex = (sliderIndex + 1) % mainSliderGames.length;
            renderAll();
        };
    }
    renderAll();
});