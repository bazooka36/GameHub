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

        for (const [name, manager] of Object.entries(this.managers)) {
            if (typeof manager.init === 'function') {
                await manager.init();
                console.log(`✅ Менеджер ${name} инициализирован`);
            }
        }

        this.setupManagersInGlobalScope();

        if (typeof toastManager !== 'undefined') {
            await toastManager.init();
            console.log('✅ ToastManager инициализирован');
        }

        console.log('✅ Все менеджеры инициализированы');
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
        this.setupAuthButtons(); // Вызываем setupAuthButtons здесь
    }

    setupAuthButtons() {
    const registerButtons = document.querySelectorAll('#desktop-register-btn');
    const loginButtons = document.querySelectorAll('#desktop-login-btn');
    const authModal = document.getElementById('auth-modal');

    registerButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modalManager.showModal(authModal);
            document.getElementById('show-register')?.click(); // Переключаемся на вкладку регистрации
        });
    });

    loginButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modalManager.showModal(authModal);
            document.getElementById('show-login')?.click(); // Переключаемся на вкладку входа
        });
    });
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
            await this.managers.content.loadGames();
            await this.managers.content.loadNews();
            this.managers.search.init();
        } catch (error) {
            console.error('Ошибка загрузки начального контента:', error);
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