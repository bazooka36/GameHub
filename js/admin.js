/**
 * Admin Panel JavaScript
 * Модульная система управления админ панелью
 */

import { DataManager } from './managers/dataManager.js';
import { Utils } from './utils.js';

// Аутентификация администратора
class AdminAuth {
    constructor() {
        this.adminCredentials = {
            username: 'admin',
            password: 'admin123',
            email: 'admin@gamehub.com'
        };
        this.sessionKey = 'adminSession';
        this.initializeCredentials();
    }

    initializeCredentials() {
        const stored = localStorage.getItem('adminCredentials');
        if (!stored) {
            localStorage.setItem('adminCredentials', JSON.stringify(this.adminCredentials));
        } else {
            this.adminCredentials = JSON.parse(stored);
        }
    }

    authenticate(username, password) {
        if (username === this.adminCredentials.username && 
            password === this.adminCredentials.password) {
            const session = {
                isAuthenticated: true,
                username: this.adminCredentials.username,
                email: this.adminCredentials.email,
                loginTime: new Date().toISOString()
            };
            localStorage.setItem(this.sessionKey, JSON.stringify(session));
            return true;
        }
        return false;
    }

    isAuthenticated() {
        const session = Utils.safeGetItem(this.sessionKey);
        if (!session) return false;
        
        try {
            return session.isAuthenticated === true;
        } catch (error) {
            return false;
        }
    }

    logout() {
        localStorage.removeItem(this.sessionKey);
        window.location.href = 'admin-login.html';
    }

    getSession() {
        return Utils.safeGetItem(this.sessionKey);
    }
}

// Менеджер модальных окон
class ModalManager {
    constructor() {
        this.overlay = Utils.getElement('modal-overlay');
        this.modal = this.overlay.querySelector('.modal');
        this.title = Utils.getElement('modal-title');
        this.body = Utils.getElement('modal-body');
        this.closeBtn = Utils.getElement('modal-close');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        Utils.addEventListenerSafe(this.closeBtn, 'click', () => this.close());
        Utils.addEventListenerSafe(this.overlay, 'click', (e) => {
            if (e.target === this.overlay) this.close();
        });
    }

    open(title, content) {
        this.title.textContent = title;
        this.body.innerHTML = content;
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        this.body.innerHTML = '';
    }
}

// Основной класс админ панели
class AdminPanel {
    constructor() {
        this.auth = new AdminAuth();
        this.modal = new ModalManager();
        this.data = window.gameHubDataManager || new DataManager();
        this.currentTab = 'dashboard';
        
        this.init();
    }

    init() {
        // Проверка аутентификации
        if (!this.auth.isAuthenticated()) {
            window.location.href = 'admin-login.html';
            return;
        }

        this.setupEventListeners();
        this.loadDashboard();
        this.updateAdminInfo();
    }

    setupEventListeners() {
        // Навигация
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            Utils.addEventListenerSafe(btn, 'click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Выход
        Utils.addEventListenerSafe(Utils.getElement('admin-logout'), 'click', () => {
            this.auth.logout();
        });

        // Поиск пользователей
        Utils.addEventListenerSafe(Utils.getElement('user-search'), 'input', () => {
            this.filterUsers();
        });

        Utils.addEventListenerSafe(Utils.getElement('user-filter'), 'change', () => {
            this.filterUsers();
        });

        // Кнопки действий
        Utils.addEventListenerSafe(Utils.getElement('add-game-btn'), 'click', () => {
            this.showAddGameModal();
        });

        Utils.addEventListenerSafe(Utils.getElement('add-news-btn'), 'click', () => {
            this.showAddNewsModal();
        });

        // Настройки
        Utils.addEventListenerSafe(Utils.getElement('save-admin-settings'), 'click', () => {
            this.saveAdminSettings();
        });

        Utils.addEventListenerSafe(Utils.getElement('save-site-settings'), 'click', () => {
            this.saveSiteSettings();
        });
    }

    switchTab(tabName) {
        // Обновляем активную кнопку
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Обновляем активный контент
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        Utils.getElement(tabName).classList.add('active');

        this.currentTab = tabName;
        this.loadTabContent(tabName);
    }

    loadTabContent(tabName) {
        switch (tabName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'games':
                this.loadGames();
                break;
            case 'news':
                this.loadNews();
                break;
            case 'support':
                this.loadSupport();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    loadDashboard() {
        const stats = this.data.getStats();
        
        Utils.getElement('total-users').textContent = stats.totalUsers;
        Utils.getElement('total-games').textContent = stats.totalGames;
        Utils.getElement('total-news').textContent = stats.totalNews;
        Utils.getElement('support-tickets').textContent = stats.openTickets + stats.resolvedTickets;

        this.loadRecentActivity();
    }

    loadRecentActivity() {
        const activityList = Utils.getElement('activity-list');
        const activities = [];

        // Добавляем последние действия
        const recentUsers = this.data.getUsers().slice(-3);
        recentUsers.forEach(user => {
            activities.push({
                type: 'user',
                title: `Новый пользователь: ${user.username}`,
                time: user.createdAt || new Date().toISOString()
            });
        });

        const recentNews = this.data.getNews().slice(-3);
        recentNews.forEach(news => {
            activities.push({
                type: 'news',
                title: `Новая новость: ${news.title}`,
                time: news.createdAt
            });
        });

        // Сортируем по времени
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));

        activityList.innerHTML = activities.slice(0, 10).map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${activity.type === 'user' ? '👤' : '📰'}</div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-time">${Utils.formatDate(activity.time)}</div>
                </div>
            </div>
        `).join('');
    }

    loadUsers() {
        const users = this.data.getUsers();
        const tbody = Utils.getElement('users-table-body');
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${Utils.formatDate(user.createdAt)}</td>
                <td>
                    <span class="status-${user.status || 'active'}">
                        ${user.status === 'blocked' ? 'Заблокирован' : 'Активен'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="adminPanel.viewUser('${user.id}')">
                        Просмотр
                    </button>
                    ${user.status === 'blocked' ? 
                        `<button class="btn btn-success btn-sm" onclick="adminPanel.unblockUser('${user.id}')">
                            Разблокировать
                        </button>` :
                        `<button class="btn btn-warning btn-sm" onclick="adminPanel.blockUser('${user.id}')">
                            Заблокировать
                        </button>`
                    }
                    <button class="btn btn-danger btn-sm" onclick="adminPanel.deleteUser('${user.id}')">
                        Удалить
                    </button>
                </td>
            </tr>
        `).join('');
    }

    filterUsers() {
        const searchTerm = Utils.getElement('user-search').value.toLowerCase();
        const filterValue = Utils.getElement('user-filter').value;
        const users = this.data.getUsers();
        
        const filteredUsers = users.filter(user => {
            const matchesSearch = user.username.toLowerCase().includes(searchTerm) ||
                                user.email.toLowerCase().includes(searchTerm);
            const matchesFilter = filterValue === 'all' || user.status === filterValue;
            return matchesSearch && matchesFilter;
        });
        
        const tbody = Utils.getElement('users-table-body');
        tbody.innerHTML = filteredUsers.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${Utils.formatDate(user.createdAt)}</td>
                <td>
                    <span class="status-${user.status || 'active'}">
                        ${user.status === 'blocked' ? 'Заблокирован' : 'Активен'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="adminPanel.viewUser('${user.id}')">
                        Просмотр
                    </button>
                    ${user.status === 'blocked' ? 
                        `<button class="btn btn-success btn-sm" onclick="adminPanel.unblockUser('${user.id}')">
                            Разблокировать
                        </button>` :
                        `<button class="btn btn-warning btn-sm" onclick="adminPanel.blockUser('${user.id}')">
                            Заблокировать
                        </button>`
                    }
                    <button class="btn btn-danger btn-sm" onclick="adminPanel.deleteUser('${user.id}')">
                        Удалить
                    </button>
                </td>
            </tr>
        `).join('');
    }

    loadGames() {
        const games = this.data.getGames();
        const tbody = Utils.getElement('games-table-body');
        
        tbody.innerHTML = games.map(game => `
            <tr>
                <td>${game.id}</td>
                <td>${game.title}</td>
                <td>${game.description}</td>
                <td>${Utils.formatDate(game.createdAt)}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="adminPanel.editGame('${game.id}')">
                        Редактировать
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="adminPanel.deleteGame('${game.id}')">
                        Удалить
                    </button>
                </td>
            </tr>
        `).join('');
    }

    loadNews() {
        const news = this.data.getNews();
        const tbody = Utils.getElement('news-table-body');
        
        tbody.innerHTML = news.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${item.title}</td>
                <td>${item.content.substring(0, 100)}...</td>
                <td>${Utils.formatDate(item.createdAt)}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="adminPanel.editNews('${item.id}')">
                        Редактировать
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="adminPanel.deleteNews('${item.id}')">
                        Удалить
                    </button>
                </td>
            </tr>
        `).join('');
    }

    loadSupport() {
        const tickets = this.data.getSupportTickets();
        const tbody = Utils.getElement('support-table-body');
        
        tbody.innerHTML = tickets.map(ticket => `
            <tr>
                <td>${ticket.id}</td>
                <td>${ticket.subject}</td>
                <td>${ticket.message.substring(0, 100)}...</td>
                <td>${Utils.formatDate(ticket.createdAt)}</td>
                <td>
                    <span class="status-${ticket.status}">
                        ${ticket.status === 'open' ? 'Открыт' : 'Решен'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="adminPanel.respondToTicket('${ticket.id}')">
                        Ответить
                    </button>
                    ${ticket.status === 'open' ? 
                        `<button class="btn btn-success btn-sm" onclick="adminPanel.resolveTicket('${ticket.id}')">
                            Решить
                        </button>` : ''
                    }
                </td>
            </tr>
        `).join('');
    }

    loadSettings() {
        const session = this.auth.getSession();
        if (session) {
            Utils.getElement('admin-username-input').value = session.username || '';
            Utils.getElement('admin-email-input').value = session.email || '';
        }

        const siteSettings = Utils.safeGetItem('siteSettings', {});
        Utils.getElement('site-name-input').value = siteSettings.siteName || 'GameHub';
        Utils.getElement('site-description-input').value = siteSettings.siteDescription || '';
    }

    updateAdminInfo() {
        const session = this.auth.getSession();
        if (session) {
            Utils.getElement('admin-username').textContent = Utils.escapeHtml(session.username);
            Utils.getElement('admin-email').textContent = Utils.escapeHtml(session.email);
            Utils.getElement('admin-login-time').textContent = Utils.formatDate(session.loginTime);
        }
    }

    // Методы для работы с пользователями
    viewUser(userId) {
        const user = this.data.getUserById(userId);
        if (!user) {
            this.showToast('Пользователь не найден', 'error');
            return;
        }

        const content = `
            <div class="user-details">
                <p><strong>ID:</strong> ${user.id}</p>
                <p><strong>Имя пользователя:</strong> ${user.username}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Дата регистрации:</strong> ${Utils.formatDate(user.createdAt)}</p>
                <p><strong>Статус:</strong> ${user.status === 'blocked' ? 'Заблокирован' : 'Активен'}</p>
            </div>
        `;

        this.modal.open('Информация о пользователе', content);
    }

    blockUser(userId) {
        if (this.data.updateUser(userId, { status: 'blocked' })) {
            this.showToast('Пользователь заблокирован', 'success');
            this.loadUsers();
        } else {
            this.showToast('Ошибка при блокировке пользователя', 'error');
        }
    }

    unblockUser(userId) {
        if (this.data.updateUser(userId, { status: 'active' })) {
            this.showToast('Пользователь разблокирован', 'success');
            this.loadUsers();
        } else {
            this.showToast('Ошибка при разблокировке пользователя', 'error');
        }
    }

    deleteUser(userId) {
        if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
            if (this.data.deleteUser(userId)) {
                this.showToast('Пользователь удален', 'success');
                this.loadUsers();
                this.loadDashboard();
            } else {
                this.showToast('Ошибка при удалении пользователя', 'error');
            }
        }
    }

    // Методы для работы с играми
    showAddGameModal() {
        const content = `
            <form id="add-game-form">
                <div class="setting-item">
                    <label for="game-title">Название игры:</label>
                    <input type="text" id="game-title" class="form-input" required>
                </div>
                <div class="setting-item">
                    <label for="game-description">Описание:</label>
                    <textarea id="game-description" class="form-textarea" required></textarea>
                </div>
                <div class="setting-item">
                    <label for="game-image">URL изображения:</label>
                    <input type="url" id="game-image" class="form-input" required>
                </div>
                <div class="setting-item">
                    <label for="game-url">URL игры:</label>
                    <input type="url" id="game-url" class="form-input" required>
                </div>
                <button type="submit" class="btn btn-primary">Добавить игру</button>
            </form>
        `;

        this.modal.open('Добавить игру', content);
        
        Utils.addEventListenerSafe(Utils.getElement('add-game-form'), 'submit', (e) => {
            e.preventDefault();
            this.addGame();
        });
    }

    addGame() {
        const title = Utils.getElement('game-title').value;
        const description = Utils.getElement('game-description').value;
        const image = Utils.getElement('game-image').value;
        const url = Utils.getElement('game-url').value;

        const game = { title, description, image, url };
        this.data.addGame(game);
        
        this.showToast('Игра добавлена', 'success');
        this.modal.close();
        this.loadGames();
        this.loadDashboard();
    }

    editGame(gameId) {
        const game = this.data.getGameById(gameId);
        if (!game) {
            this.showToast('Игра не найдена', 'error');
            return;
        }

        const content = `
            <form id="edit-game-form">
                <div class="setting-item">
                    <label for="edit-game-title">Название игры:</label>
                    <input type="text" id="edit-game-title" class="form-input" value="${game.title}" required>
                </div>
                <div class="setting-item">
                    <label for="edit-game-description">Описание:</label>
                    <textarea id="edit-game-description" class="form-textarea" required>${game.description}</textarea>
                </div>
                <div class="setting-item">
                    <label for="edit-game-image">URL изображения:</label>
                    <input type="url" id="edit-game-image" class="form-input" value="${game.image}" required>
                </div>
                <div class="setting-item">
                    <label for="edit-game-url">URL игры:</label>
                    <input type="url" id="edit-game-url" class="form-input" value="${game.url}" required>
                </div>
                <button type="submit" class="btn btn-primary">Сохранить изменения</button>
            </form>
        `;

        this.modal.open('Редактировать игру', content);
        
        Utils.addEventListenerSafe(Utils.getElement('edit-game-form'), 'submit', (e) => {
            e.preventDefault();
            this.updateGame(gameId);
        });
    }

    updateGame(gameId) {
        const title = Utils.getElement('edit-game-title').value;
        const description = Utils.getElement('edit-game-description').value;
        const image = Utils.getElement('edit-game-image').value;
        const url = Utils.getElement('edit-game-url').value;

        const updates = { title, description, image, url };
        if (this.data.updateGame(gameId, updates)) {
            this.showToast('Игра обновлена', 'success');
            this.modal.close();
            this.loadGames();
        } else {
            this.showToast('Ошибка при обновлении игры', 'error');
        }
    }

    deleteGame(gameId) {
        if (confirm('Вы уверены, что хотите удалить эту игру?')) {
            if (this.data.deleteGame(gameId)) {
                this.showToast('Игра удалена', 'success');
                this.loadGames();
                this.loadDashboard();
            } else {
                this.showToast('Ошибка при удалении игры', 'error');
            }
        }
    }

    // Методы для работы с новостями
    showAddNewsModal() {
        const content = `
            <form id="add-news-form">
                <div class="setting-item">
                    <label for="news-title">Заголовок:</label>
                    <input type="text" id="news-title" class="form-input" required>
                </div>
                <div class="setting-item">
                    <label for="news-content">Содержание:</label>
                    <textarea id="news-content" class="form-textarea" required></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Добавить новость</button>
            </form>
        `;

        this.modal.open('Добавить новость', content);
        
        Utils.addEventListenerSafe(Utils.getElement('add-news-form'), 'submit', (e) => {
            e.preventDefault();
            this.addNews();
        });
    }

    addNews() {
        const title = Utils.getElement('news-title').value;
        const content = Utils.getElement('news-content').value;

        const newsItem = { title, content };
        this.data.addNews(newsItem);
        
        this.showToast('Новость добавлена', 'success');
        this.modal.close();
        this.loadNews();
        this.loadDashboard();
    }

    editNews(newsId) {
        const news = this.data.getNewsById(newsId);
        if (!news) {
            this.showToast('Новость не найдена', 'error');
            return;
        }

        const content = `
            <form id="edit-news-form">
                <div class="setting-item">
                    <label for="edit-news-title">Заголовок:</label>
                    <input type="text" id="edit-news-title" class="form-input" value="${news.title}" required>
                </div>
                <div class="setting-item">
                    <label for="edit-news-content">Содержание:</label>
                    <textarea id="edit-news-content" class="form-textarea" required>${news.content}</textarea>
                </div>
                <button type="submit" class="btn btn-primary">Сохранить изменения</button>
            </form>
        `;

        this.modal.open('Редактировать новость', content);
        
        Utils.addEventListenerSafe(Utils.getElement('edit-news-form'), 'submit', (e) => {
            e.preventDefault();
            this.updateNews(newsId);
        });
    }

    updateNews(newsId) {
        const title = Utils.getElement('edit-news-title').value;
        const content = Utils.getElement('edit-news-content').value;

        const updates = { title, content };
        if (this.data.updateNews(newsId, updates)) {
            this.showToast('Новость обновлена', 'success');
            this.modal.close();
            this.loadNews();
        } else {
            this.showToast('Ошибка при обновлении новости', 'error');
        }
    }

    deleteNews(newsId) {
        console.log('🗑️ Админ панель: удаление новости с ID:', newsId);
        
        if (confirm('Вы уверены, что хотите удалить эту новость?')) {
            console.log('✅ Пользователь подтвердил удаление');
            
            if (this.data.deleteNews(newsId)) {
                this.showToast('Новость удалена', 'success');
                this.loadNews();
                this.loadDashboard();
                console.log('✅ Новость успешно удалена из админ панели');
            } else {
                this.showToast('Ошибка при удалении новости', 'error');
                console.log('❌ Ошибка при удалении новости из админ панели');
            }
        } else {
            console.log('❌ Пользователь отменил удаление');
        }
    }

    // Методы для работы с поддержкой
    respondToTicket(ticketId) {
        const content = `
            <form id="respond-ticket-form">
                <div class="setting-item">
                    <label for="ticket-response">Ваш ответ:</label>
                    <textarea id="ticket-response" class="form-textarea" required></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Отправить ответ</button>
            </form>
        `;

        this.modal.open('Ответить на тикет', content);
        
        Utils.addEventListenerSafe(Utils.getElement('respond-ticket-form'), 'submit', (e) => {
            e.preventDefault();
            this.sendTicketResponse(ticketId);
        });
    }

    sendTicketResponse(ticketId) {
        const response = Utils.getElement('ticket-response').value;
        
        if (this.data.addSupportResponse(ticketId, response)) {
            this.showToast('Ответ отправлен', 'success');
            this.modal.close();
            this.loadSupport();
        } else {
            this.showToast('Ошибка при отправке ответа', 'error');
        }
    }

    resolveTicket(ticketId) {
        if (this.data.updateTicketStatus(ticketId, 'resolved')) {
            this.showToast('Тикет решен', 'success');
            this.loadSupport();
        } else {
            this.showToast('Тикет не найден', 'error');
        }
    }

    // Методы для настроек
    saveAdminSettings() {
        const username = Utils.getElement('admin-username-input').value;
        const email = Utils.getElement('admin-email-input').value;

        if (username && email) {
            // Обновляем сессию
            const session = this.auth.getSession();
            if (session) {
                session.username = username;
                session.email = email;
                localStorage.setItem('adminSession', JSON.stringify(session));
            }

            // Обновляем учетные данные
            this.auth.adminCredentials.username = username;
            this.auth.adminCredentials.email = email;
            localStorage.setItem('adminCredentials', JSON.stringify(this.auth.adminCredentials));

            this.updateAdminInfo();
            this.showToast('Настройки сохранены', 'success');
        } else {
            this.showToast('Заполните все поля', 'error');
        }
    }

    saveSiteSettings() {
        const siteName = Utils.getElement('site-name-input').value;
        const siteDescription = Utils.getElement('site-description-input').value;

        if (siteName) {
            Utils.safeSetItem('siteSettings', { siteName, siteDescription });
            this.showToast('Настройки сайта сохранены', 'success');
        } else {
            this.showToast('Введите название сайта', 'error');
        }
    }

    // Вспомогательный метод для показа уведомлений
    showToast(message, type = 'info') {
        if (window.toastManager) {
            window.toastManager.show(type, message);
        } else {
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Инициализация админ панели
let adminPanel;

document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
    
    // Делаем доступным глобально для onclick обработчиков
    window.adminPanel = adminPanel;
});