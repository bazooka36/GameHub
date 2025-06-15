/**
 * Admin Panel Integration for GameHub
 * Provides full integration with main site managers
 */

import { Utils } from './utils.js';
import { modalManager } from './modalManager.js';
import { toastManager } from './toastManager.js';
import { adminAuth } from './adminAuth.js';

export class AdminPanel {
    constructor() {
        this.isInitialized = false;
        this.userManager = null;
        this.authManager = null;
        
        // Check admin authentication before initializing
        this.checkAdminAccess();
    }

    /**
     * Check if current user has admin access
     */
    checkAdminAccess() {
        // Проверяем аутентификацию админа
        if (!adminAuth.isAuthenticated() || !adminAuth.isSessionActive()) {
            this.showAccessDenied();
            return;
        }
        
        // Админ аутентифицирован, продолжаем инициализацию
        this.waitForManagers();
    }

    /**
     * Show access denied message and redirect
     */
    showAccessDenied() {
        document.body.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-family: 'Inter', sans-serif;
                text-align: center;
                padding: 2rem;
            ">
                <div style="
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    border-radius: 20px;
                    padding: 3rem;
                    max-width: 500px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                ">
                    <i class="fas fa-shield-alt" style="font-size: 4rem; margin-bottom: 1rem; color: #ff6b6b;"></i>
                    <h1 style="font-size: 2rem; margin-bottom: 1rem; font-weight: 700;">Доступ запрещен</h1>
                    <p style="font-size: 1.1rem; margin-bottom: 2rem; opacity: 0.9;">
                        У вас нет прав для доступа к админ панели. 
                        Пожалуйста, войдите в систему через страницу входа.
                    </p>
                    <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                        <button onclick="window.location.href='admin-login.html'" style="
                            background: linear-gradient(135deg, #667eea, #764ba2);
                            color: white;
                            border: none;
                            padding: 1rem 2rem;
                            border-radius: 12px;
                            font-size: 1rem;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                        " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                            <i class="fas fa-sign-in-alt" style="margin-right: 0.5rem;"></i>
                            Войти в систему
                        </button>
                        <button onclick="window.location.href='index.html'" style="
                            background: transparent;
                            color: white;
                            border: 2px solid rgba(255, 255, 255, 0.3);
                            padding: 1rem 2rem;
                            border-radius: 12px;
                            font-size: 1rem;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.background='rgba(255, 255, 255, 0.1)'" onmouseout="this.style.background='transparent'">
                            <i class="fas fa-home" style="margin-right: 0.5rem;"></i>
                            На главную
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Wait for main managers to be available
     */
    waitForManagers() {
        const checkManagers = () => {
            if (window.userManager && window.toastManager && window.modalManager) {
                this.userManager = window.userManager;
                this.authManager = window.authManager;
                
                this.init();
                console.log('AdminPanel initialized successfully with main app managers');
            } else {
                setTimeout(checkManagers, 100);
            }
        };
        checkManagers();
    }

    /**
     * Initialize admin panel
     */
    async init() {
        try {
            this.setupEventListeners();
            this.loadDashboard();
            this.isInitialized = true;
        } catch (error) {
            console.error('Error initializing AdminPanel:', error);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.nav-link').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Add news button
        const addNewsBtn = document.getElementById('add-news-btn');
        if (addNewsBtn) {
            addNewsBtn.addEventListener('click', () => {
                this.openModal('add-news-modal');
            });
        }

        // Add game button
        const addGameBtn = document.getElementById('add-game-btn');
        if (addGameBtn) {
            addGameBtn.addEventListener('click', () => {
                this.openModal('add-game-modal');
            });
        }

        // Form submissions
        const addNewsForm = document.getElementById('add-news-form');
        if (addNewsForm) {
            addNewsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addNews();
            });
        }

        const addGameForm = document.getElementById('add-game-form');
        if (addGameForm) {
            addGameForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addGame();
            });
        }

        // File uploads
        const newsImage = document.getElementById('news-image');
        if (newsImage) {
            newsImage.addEventListener('change', (e) => {
                this.handleImageUpload(e, 'news-preview-img', 'news-image-preview');
            });
        }

        const gameImage = document.getElementById('game-image');
        if (gameImage) {
            gameImage.addEventListener('change', (e) => {
                this.handleImageUpload(e, 'game-preview-img', 'game-image-preview');
            });
        }

        // Storage management
        const cleanStorageBtn = document.getElementById('clean-storage-btn');
        if (cleanStorageBtn) {
            cleanStorageBtn.addEventListener('click', () => {
                this.cleanOldData();
                this.updateStorageInfo();
                this.showNotification('success', 'Старые данные очищены');
            });
        }

        const checkStorageBtn = document.getElementById('check-storage-btn');
        if (checkStorageBtn) {
            checkStorageBtn.addEventListener('click', () => {
                this.updateStorageInfo();
                this.showNotification('info', 'Размер хранилища обновлен');
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Change admin password
        const changePasswordBtn = document.getElementById('change-admin-password-btn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                this.openModal('change-admin-password-modal');
            });
        }

        // Change admin password form
        const changePasswordForm = document.getElementById('change-admin-password-form');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.changeAdminPassword();
            });
        }

        // User management
        this.setupUserManagement();
    }

    /**
     * Setup user management functionality
     */
    setupUserManagement() {
        // Add user management buttons to user list
        this.loadUsers();
    }

    /**
     * Switch between tabs
     */
    switchTab(tabName) {
        // Update nav buttons
        document.querySelectorAll('.nav-link').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) activeTab.classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const activeContent = document.getElementById(tabName);
        if (activeContent) activeContent.classList.add('active');

        // Load content for the tab
        this.loadContent();
    }

    /**
     * Load content based on active tab
     */
    loadContent() {
        const activeTab = document.querySelector('.nav-link.active');
        if (!activeTab) return;

        const tabName = activeTab.dataset.tab;
        switch(tabName) {
            case 'news':
                this.loadNews();
                break;
            case 'games':
                this.loadGames();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'notifications':
                this.loadNotifications();
                break;
        }
    }

    /**
     * Load dashboard data
     */
    loadDashboard() {
        this.updateStats();
        this.loadRecentContent();
        this.updateStorageInfo();
    }

    /**
     * Update statistics
     */
    updateStats() {
        const news = JSON.parse(localStorage.getItem('news') || '[]');
        const games = JSON.parse(localStorage.getItem('games') || '[]');
        const users = this.userManager ? this.userManager.getAllUsers() : [];
        const notifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');

        const newsCount = document.getElementById('news-count');
        const gamesCount = document.getElementById('games-count');
        const usersCount = document.getElementById('users-count');
        const notificationsCount = document.getElementById('notifications-count');

        if (newsCount) newsCount.textContent = news.length;
        if (gamesCount) gamesCount.textContent = games.length;
        if (usersCount) usersCount.textContent = users.length;
        if (notificationsCount) notificationsCount.textContent = notifications.length;
    }

    /**
     * Load recent content for dashboard
     */
    loadRecentContent() {
        const news = JSON.parse(localStorage.getItem('news') || '[]');
        const games = JSON.parse(localStorage.getItem('games') || '[]');

        // Recent news
        const recentNewsContainer = document.getElementById('recent-news');
        if (recentNewsContainer) {
            const recentNewsHtml = news.slice(0, 5).map(item => `
                <div class="content-item flex items-center gap-4">
                    <img src="${item.imageData}" alt="${item.title}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 12px;">
                    <div class="flex-1">
                        <div class="font-bold text-lg">${item.title}</div>
                        <div class="text-sm text-gray-600">${new Date(item.date).toLocaleDateString()}</div>
                    </div>
                </div>
            `).join('');

            recentNewsContainer.innerHTML = recentNewsHtml || '<p class="text-gray-600">Нет новостей</p>';
        }

        // Recent games
        const recentGamesContainer = document.getElementById('recent-games');
        if (recentGamesContainer) {
            const recentGamesHtml = games.slice(0, 5).map(item => `
                <div class="content-item flex items-center gap-4">
                    <img src="${item.imageData}" alt="${item.title}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 12px;">
                    <div class="flex-1">
                        <div class="font-bold text-lg">${item.title}</div>
                        <div class="text-sm text-gray-600">${item.genre} • ${item.rating}★</div>
                    </div>
                </div>
            `).join('');

            recentGamesContainer.innerHTML = recentGamesHtml || '<p class="text-gray-600">Нет игр</p>';
        }
    }

    /**
     * Load news list
     */
    loadNews() {
        const news = JSON.parse(localStorage.getItem('news') || '[]');
        const newsListContainer = document.getElementById('news-list');
        
        if (!newsListContainer) return;

        const newsHtml = news.map(item => `
            <div class="content-item">
                <div class="flex items-center gap-4">
                    <img src="${item.imageData}" alt="${item.title}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 12px;">
                    <div class="flex-1">
                        <h3 class="font-bold text-lg">${item.title}</h3>
                        <p class="text-gray-600 text-sm">${item.content.substring(0, 100)}...</p>
                        <div class="text-xs text-gray-500 mt-2">Опубликовано: ${new Date(item.date).toLocaleDateString()}</div>
                    </div>
                    <div class="flex gap-2">
                        <button class="btn btn-primary text-sm" onclick="adminPanel.deleteNews('${item.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        newsListContainer.innerHTML = newsHtml || '<p class="text-gray-600 text-center py-8">Нет новостей</p>';
    }

    /**
     * Load games list
     */
    loadGames() {
        const games = JSON.parse(localStorage.getItem('games') || '[]');
        const gamesListContainer = document.getElementById('games-list');
        
        if (!gamesListContainer) return;

        const gamesHtml = games.map(item => `
            <div class="content-item">
                <div class="flex items-center gap-4">
                    <img src="${item.imageData}" alt="${item.title}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 12px;">
                    <div class="flex-1">
                        <h3 class="font-bold text-lg">${item.title}</h3>
                        <p class="text-gray-600 text-sm">${item.description.substring(0, 100)}...</p>
                        <div class="flex gap-4 text-xs text-gray-500 mt-2">
                            <span>Жанр: ${item.genre}</span>
                            <span>Рейтинг: ${item.rating}★</span>
                            <span>Игроков: ${item.players}</span>
                            <span>Категория: ${item.category}</span>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button class="btn btn-primary text-sm" onclick="adminPanel.deleteGame('${item.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        gamesListContainer.innerHTML = gamesHtml || '<p class="text-gray-600 text-center py-8">Нет игр</p>';
    }

    /**
     * Load users list with management options
     */
    loadUsers() {
        const users = this.userManager ? this.userManager.getAllUsers() : [];
        const usersListContainer = document.getElementById('users-list');
        
        if (!usersListContainer) return;

        const usersHtml = users.map(user => `
            <div class="content-item">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <i class="fas fa-user text-xl"></i>
                    </div>
                    <div class="flex-1">
                        <h3 class="font-bold">${user.username || user.email}</h3>
                        <p class="text-gray-600 text-sm">${user.email}</p>
                        <div class="text-xs text-gray-500">ID: ${user.id}</div>
                        <div class="text-xs text-gray-500">Зарегистрирован: ${new Date(user.createdAt || Date.now()).toLocaleDateString()}</div>
                    </div>
                    <div class="flex gap-2">
                        <button class="btn btn-warning text-sm" onclick="adminPanel.resetUserPassword('${user.id}')">
                            <i class="fas fa-key"></i>
                        </button>
                        <button class="btn btn-danger text-sm" onclick="adminPanel.deleteUser('${user.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        usersListContainer.innerHTML = usersHtml || '<p class="text-gray-600 text-center py-8">Нет пользователей</p>';
    }

    /**
     * Load notifications list
     */
    loadNotifications() {
        const notifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
        const notificationsListContainer = document.getElementById('notifications-list');
        
        if (!notificationsListContainer) return;

        const notificationsHtml = notifications.map(notification => `
            <div class="content-item">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-bell text-xl"></i>
                    </div>
                    <div class="flex-1">
                        <h3 class="font-bold">${notification.title}</h3>
                        <p class="text-gray-600">${notification.message}</p>
                        <div class="text-xs text-gray-500 mt-2">${new Date(notification.date).toLocaleString()}</div>
                    </div>
                    <div class="text-sm">
                        <span class="px-2 py-1 rounded ${notification.type === 'success' ? 'bg-green-100 text-green-800' : notification.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}">
                            ${notification.type}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');

        notificationsListContainer.innerHTML = notificationsHtml || '<p class="text-gray-600 text-center py-8">Нет уведомлений</p>';
    }

    /**
     * Add news
     */
    async addNews() {
        const title = document.getElementById('news-title')?.value;
        const content = document.getElementById('news-content')?.value;
        const imageFile = document.getElementById('news-image')?.files[0];

        if (!title || !content) {
            this.showNotification('error', 'Пожалуйста, заполните все поля');
            return;
        }

        if (!imageFile) {
            this.showNotification('error', 'Пожалуйста, выберите изображение');
            return;
        }

        this.showLoading(true);
        try {
            this.checkAndCleanStorage();
            
            const imageData = await this.convertFileToBase64(imageFile);
            const news = {
                id: 'news_' + Date.now(),
                title,
                content,
                imageData,
                date: new Date().toISOString()
            };

            const existingNews = JSON.parse(localStorage.getItem('news') || '[]');
            existingNews.unshift(news);
            localStorage.setItem('news', JSON.stringify(existingNews));

            // Send notification to all users
            this.sendNotificationToUsers('Новая новость!', `Опубликована новость: ${title}`);

            this.showNotification('success', 'Новость успешно опубликована');
            this.closeModal('add-news-modal');
            this.resetForm('add-news-form');
            this.loadContent();
            this.updateStats();
        } catch (error) {
            console.error('Error adding news:', error);
            this.showNotification('error', error.message || 'Ошибка при публикации новости');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Add game
     */
    async addGame() {
        const title = document.getElementById('game-title')?.value;
        const description = document.getElementById('game-description')?.value;
        const genre = document.getElementById('game-genre')?.value;
        const rating = document.getElementById('game-rating')?.value;
        const players = document.getElementById('game-players')?.value;
        const category = document.getElementById('game-category')?.value;
        const imageFile = document.getElementById('game-image')?.files[0];

        if (!title || !description || !genre || !rating || !players || !category) {
            this.showNotification('error', 'Пожалуйста, заполните все поля');
            return;
        }

        if (!imageFile) {
            this.showNotification('error', 'Пожалуйста, выберите изображение');
            return;
        }

        this.showLoading(true);
        try {
            this.checkAndCleanStorage();
            
            const imageData = await this.convertFileToBase64(imageFile);
            const game = {
                id: 'game_' + Date.now(),
                title,
                description,
                genre,
                rating,
                players,
                category,
                imageData,
                price: 'Бесплатно',
                date: new Date().toISOString()
            };

            const existingGames = JSON.parse(localStorage.getItem('games') || '[]');
            existingGames.unshift(game);
            localStorage.setItem('games', JSON.stringify(existingGames));

            // Send notification to all users
            this.sendNotificationToUsers('Новая игра!', `Добавлена игра: ${title}`);

            this.showNotification('success', 'Игра успешно опубликована');
            this.closeModal('add-game-modal');
            this.resetForm('add-game-form');
            this.loadContent();
            this.updateStats();
        } catch (error) {
            console.error('Error adding game:', error);
            this.showNotification('error', error.message || 'Ошибка при публикации игры');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Reset user password
     */
    async resetUserPassword(userId) {
        const user = this.userManager.getUserById(userId);
        if (!user) {
            this.showNotification('error', 'Пользователь не найден');
            return;
        }

        const confirmed = await modalManager.showConfirmation({
            title: 'Сброс пароля',
            message: `Вы уверены, что хотите сбросить пароль для пользователя ${user.email}?`,
            confirmText: 'Сбросить',
            cancelText: 'Отмена'
        });

        if (confirmed) {
            // Generate new password
            const newPassword = 'password123'; // Simple default password
            user.password = newPassword;
            this.userManager.updateUserInArray(user);
            
            this.showNotification('success', `Пароль для ${user.email} сброшен на: ${newPassword}`);
        }
    }

    /**
     * Delete user
     */
    async deleteUser(userId) {
        const user = this.userManager.getUserById(userId);
        if (!user) {
            this.showNotification('error', 'Пользователь не найден');
            return;
        }

        const confirmed = await modalManager.showConfirmation({
            title: 'Удалить пользователя',
            message: `Вы уверены, что хотите удалить пользователя ${user.email}? Это действие необратимо.`,
            confirmText: 'Удалить',
            cancelText: 'Отмена',
            confirmClass: 'bg-red-600 hover:bg-red-700'
        });

        if (confirmed) {
            const users = this.userManager.getAllUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            
            if (userIndex !== -1) {
                users.splice(userIndex, 1);
                Utils.safeSetItem('users', users);
                
                // Clear user data
                if (Utils.isLocalStorageAvailable()) {
                    localStorage.removeItem(`friends_${userId}`);
                    localStorage.removeItem(`friend_requests_${userId}`);
                    localStorage.removeItem(`notificationHistory_${userId}`);
                }
                
                this.showNotification('success', 'Пользователь успешно удален');
                this.loadUsers();
                this.updateStats();
            }
        }
    }

    /**
     * Delete news
     */
    deleteNews(id) {
        if (confirm('Вы уверены, что хотите удалить эту новость?')) {
            const news = JSON.parse(localStorage.getItem('news') || '[]');
            const filteredNews = news.filter(item => item.id !== id);
            localStorage.setItem('news', JSON.stringify(filteredNews));
            this.showNotification('success', 'Новость удалена');
            this.loadContent();
            this.updateStats();
        }
    }

    /**
     * Delete game
     */
    deleteGame(id) {
        if (confirm('Вы уверены, что хотите удалить эту игру?')) {
            const games = JSON.parse(localStorage.getItem('games') || '[]');
            const filteredGames = games.filter(item => item.id !== id);
            localStorage.setItem('games', JSON.stringify(filteredGames));
            this.showNotification('success', 'Игра удалена');
            this.loadContent();
            this.updateStats();
        }
    }

    /**
     * Clear all games and news data
     */
    clearAllContent() {
        if (confirm('Вы уверены, что хотите удалить ВСЕ игры и новости? Это действие необратимо!')) {
            // Clear games data
            localStorage.removeItem('games');
            
            // Clear news data
            localStorage.removeItem('news');
            
            this.showNotification('success', 'Все игры и новости удалены');
            this.loadContent();
            this.updateStats();
        }
    }

    /**
     * Send notification to all users
     */
    sendNotificationToUsers(title, message) {
        const users = this.userManager ? this.userManager.getAllUsers() : [];
        users.forEach(user => {
            const userNotifications = JSON.parse(localStorage.getItem(`notificationHistory_${user.id}`) || '[]');
            userNotifications.unshift({
                type: 'info',
                message: `${title}: ${message}`,
                timestamp: new Date().toISOString()
            });

            // Keep last 50 notifications
            if (userNotifications.length > 50) {
                userNotifications.splice(50);
            }
            localStorage.setItem(`notificationHistory_${user.id}`, JSON.stringify(userNotifications));
        });

        // Add to admin notifications
        const adminNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
        adminNotifications.unshift({
            title,
            message,
            type: 'success',
            date: new Date().toISOString()
        });
        localStorage.setItem('adminNotifications', JSON.stringify(adminNotifications));
    }

    /**
     * Convert file to base64
     */
    convertFileToBase64(file) {
        return new Promise((resolve, reject) => {
            const MAX_SIZE_MB = 5;
            const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

            if (!file) {
                reject('Файл не выбран');
                return;
            }

            if (file.size > MAX_SIZE_BYTES) {
                reject(`Размер файла превышает ${MAX_SIZE_MB} МБ.`);
                return;
            }

            if (!file.type.startsWith('image/')) {
                reject('Пожалуйста, выберите изображение');
                return;
            }

            this.compressImage(file, 0.7, 800, 600).then(compressedFile => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject('Ошибка при чтении файла');
                reader.readAsDataURL(compressedFile);
            }).catch(reject);
        });
    }

    /**
     * Compress image
     */
    compressImage(file, quality = 0.7, maxWidth = 800, maxHeight = 600) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                let { width, height } = img;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject('Ошибка при сжатии изображения');
                    }
                }, 'image/jpeg', quality);
            };

            img.onerror = () => reject('Ошибка при загрузке изображения');
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Handle image upload
     */
    handleImageUpload(event, previewId, previewContainerId) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewImg = document.getElementById(previewId);
            const previewContainer = document.getElementById(previewContainerId);
            if (previewImg) previewImg.src = e.target.result;
            if (previewContainer) previewContainer.classList.remove('hidden');
        }
        reader.readAsDataURL(file);
    }

    /**
     * Open modal
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('show');
    }

    /**
     * Close modal
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('show');
    }

    /**
     * Reset form
     */
    resetForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }
        
        // Clear image previews
        const previewImages = document.querySelectorAll('.preview-image');
        previewImages.forEach(img => {
            img.src = '';
            img.style.display = 'none';
        });
        
        // Hide preview containers
        const previewContainers = document.querySelectorAll('[id$="-image-preview"]');
        previewContainers.forEach(div => {
            div.classList.add('hidden');
        });
    }

    /**
     * Show loading
     */
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            if (show) {
                loading.classList.add('show');
            } else {
                loading.classList.remove('show');
            }
        }
    }

    /**
     * Show notification
     */
    showNotification(type, message) {
        if (window.toastManager) {
            window.toastManager[type](message);
        } else {
            // Fallback notification
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.innerHTML = `
                <div class="flex items-center gap-2">
                    <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}"></i>
                    <span>${message}</span>
                </div>
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('show');
            }, 100);

            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }, 3000);
        }
    }

    /**
     * Logout from admin panel
     */
    logout() {
        if (confirm('Вы уверены, что хотите выйти из админ-панели?')) {
            // Используем новую систему аутентификации админа
            adminAuth.logout();
            
            // Показываем уведомление об успешном выходе
            this.showNotification('success', 'Вы успешно вышли из админ-панели');
            
            // Перенаправляем на страницу входа
            setTimeout(() => {
                window.location.href = 'admin-login.html';
            }, 1000);
        }
    }

    /**
     * Check and clean storage
     */
    checkAndCleanStorage() {
        try {
            const totalSize = this.getLocalStorageSize();
            const maxSize = 5 * 1024 * 1024; // 5 МБ лимит
            
            if (totalSize > maxSize * 0.8) {
                this.cleanOldData();
                this.showNotification('info', 'Очищены старые данные для освобождения места');
            }
        } catch (error) {
            console.warn('Ошибка при проверке localStorage:', error);
        }
    }

    /**
     * Get localStorage size
     */
    getLocalStorageSize() {
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length + key.length;
            }
        }
        return totalSize;
    }

    /**
     * Clean old data
     */
    cleanOldData() {
        // Clean old notifications
        const adminNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
        if (adminNotifications.length > 20) {
            const cleanedNotifications = adminNotifications.slice(0, 20);
            localStorage.setItem('adminNotifications', JSON.stringify(cleanedNotifications));
        }

        // Clean old news
        const news = JSON.parse(localStorage.getItem('news') || '[]');
        if (news.length > 50) {
            const cleanedNews = news.slice(0, 50);
            localStorage.setItem('news', JSON.stringify(cleanedNews));
        }

        // Clean old games
        const games = JSON.parse(localStorage.getItem('games') || '[]');
        if (games.length > 50) {
            const cleanedGames = games.slice(0, 50);
            localStorage.setItem('games', JSON.stringify(cleanedGames));
        }

        // Clean old user notifications
        const users = this.userManager ? this.userManager.getAllUsers() : [];
        users.forEach(user => {
            const userNotifications = JSON.parse(localStorage.getItem(`notificationHistory_${user.id}`) || '[]');
            if (userNotifications.length > 20) {
                const cleanedUserNotifications = userNotifications.slice(0, 20);
                localStorage.setItem(`notificationHistory_${user.id}`, JSON.stringify(cleanedUserNotifications));
            }
        });
    }

    /**
     * Update storage info
     */
    updateStorageInfo() {
        try {
            const totalSize = this.getLocalStorageSize();
            const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
            const maxSize = 5; // 5 МБ лимит
            const usagePercent = ((totalSize / (maxSize * 1024 * 1024)) * 100).toFixed(1);
            
            const storageSizeElement = document.getElementById('storage-size');
            if (storageSizeElement) {
                storageSizeElement.textContent = `${sizeInMB} МБ (${usagePercent}%)`;
                
                if (usagePercent > 80) {
                    storageSizeElement.style.color = '#f5576c';
                } else if (usagePercent > 60) {
                    storageSizeElement.style.color = '#f59e42';
                } else {
                    storageSizeElement.style.color = '#43e97b';
                }
            }
        } catch (error) {
            console.warn('Ошибка при обновлении информации о хранилище:', error);
        }
    }

    /**
     * Change admin password
     */
    async changeAdminPassword() {
        try {
            const currentPassword = document.getElementById('current-admin-password').value;
            const newPassword = document.getElementById('new-admin-password').value;
            const confirmPassword = document.getElementById('confirm-new-admin-password').value;

            // Валидация
            if (!currentPassword || !newPassword || !confirmPassword) {
                this.showNotification('error', 'Пожалуйста, заполните все поля');
                return;
            }

            if (newPassword !== confirmPassword) {
                this.showNotification('error', 'Новые пароли не совпадают');
                return;
            }

            if (newPassword.length < 6) {
                this.showNotification('error', 'Новый пароль должен содержать минимум 6 символов');
                return;
            }

            // Изменяем пароль через adminAuth
            const success = adminAuth.changePassword(currentPassword, newPassword);
            
            if (success) {
                this.showNotification('success', 'Пароль успешно изменен');
                this.closeModal('change-admin-password-modal');
                this.resetForm('change-admin-password-form');
            } else {
                this.showNotification('error', 'Неверный текущий пароль');
            }

        } catch (error) {
            console.error('Error changing admin password:', error);
            this.showNotification('error', 'Произошла ошибка при изменении пароля');
        }
    }
}

// Global functions for modal handling
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
}

// Initialize admin panel
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
}); 