/**
 * Toast Notification Manager for GameHub
 * Handles toast notifications, history, and user feedback
 */

import { Utils } from './utils.js';

export class ToastManager {
    constructor() {
        this.maxToasts = 3;
        this.currentToasts = 0;
        this.toastQueue = [];
        this.history = [];
        this.maxHistorySize = 50;
    }

    /**
     * Initialize the toast manager
     */
    async init() {
        this.setupNotificationHistory();
        this.checkUserNotifications();
        console.log('✅ ToastManager initialized');
    }

    /**
     * Get the appropriate container for toasts
     * @returns {HTMLElement} Container element
     */
    getToastContainer() {
        const notificationHistoryModal = Utils.getElement('notification-history-modal');
        
        // Если модальное окно уведомлений открыто, показываем тосты внутри него
        if (notificationHistoryModal && !notificationHistoryModal.classList.contains('hidden')) {
            return notificationHistoryModal;
        }
        
        // Иначе используем контейнер тостов по умолчанию
        return Utils.getElement('toast-container');
    }

    /**
     * Показать уведомление тост
     * @param {string} type - Тип тоста (success, error, info, warning)
     * @param {string} message - Сообщение тоста
     * @param {Object} options - Дополнительные опции
     */
    show(type, message, options = {}) {
        const { // Добавлено
            duration = 4000,
            persistent = false,
            action = null,
            actionText = null
        } = options;

        // Добавить в очередь если слишком много тостов
        if (this.currentToasts >= this.maxToasts) {
            this.toastQueue.push({ type, message, options });
            return;
        }

        const container = this.getToastContainer();
        if (!container) {
            console.warn('Контейнер тостов не найден');
            return;
        }

        const toast = this.createToast(type, message, action, actionText); // Изменено
        
        // Если показываем внутри модального окна, добавляем специальные стили
        if (container.id === 'notification-history-modal') {
            toast.classList.add('toast-in-modal');
        }
        
        container.appendChild(toast);
        this.currentToasts++;

        // Добавить в историю
        this.addToHistory(type, message);

        // Добавить обработчик кнопки закрытия
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            Utils.addEventListenerSafe(closeBtn, 'click', () => {
                this.removeToast(toast);
            });
        }

        // Добавить обработчик кнопки действия
        if (action && actionText) {
            const actionBtn = toast.querySelector('.toast-action');
            if (actionBtn) {
                Utils.addEventListenerSafe(actionBtn, 'click', () => {
                    action();
                    this.removeToast(toast);
                });
            }
        }

        // Автоматически удалить после продолжительности (если не постоянный)
        if (!persistent) {
            setTimeout(() => {
                this.removeToast(toast);
            }, duration);
        }

        // Обработать очередь
        this.processQueue();
    }

    /**
     * Convenience methods for different toast types
     */
    info(message, options) {
        this.show('info', message, options);
    }

    success(message, options) {
        this.show('success', message, options);
    }

    error(message, options) {
        this.show('error', message, options);
    }

    warning(message, options) {
        this.show('warning', message, options);
    }

    /**
     * Create toast element
     * @param {string} type - Toast type
     * @param {string} message - Toast message
     * @param {Function} action - Action function
     * @param {string} actionText - Action button text
     * @returns {HTMLElement} Toast element
     */
    createToast(type, message, action = null, actionText = null) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle',
            warning: 'fas fa-exclamation-triangle'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');

        const actionButton = action && actionText ? 
            `<button class="toast-action bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded text-sm ml-2 transition">
                ${actionText}
            </button>` : '';

        toast.innerHTML = `
            <i class="${icons[type] || 'fas fa-bell'}" aria-hidden="true"></i>
            <span>${Utils.escapeHtml(message)}</span>
            ${actionButton}
            <button class="toast-close" aria-label="Закрыть уведомление">&times;</button>
        `;

        return toast;
    }

    /**
     * Remove toast element
     * @param {HTMLElement} toast - Toast element to remove
     */
    removeToast(toast) {
        if (toast && toast.parentElement) {
            toast.remove();
            this.currentToasts--;
            this.processQueue();
        }
    }

    /**
     * Process toast queue
     */
    processQueue() {
        if (this.toastQueue.length > 0 && this.currentToasts < this.maxToasts) {
            const { type, message, options } = this.toastQueue.shift();
            this.show(type, message, options);
        }
    }

    /**
     * Добавить уведомление в историю
     * @param {string} type - Тип уведомления
     * @param {string} message - Сообщение уведомления
     */
    addToHistory(type, message) {
        const currentUser = this.getCurrentUser();
        if (!currentUser || !currentUser.id) return;

        const historyKey = `notificationHistory_${currentUser.id}`;
        const history = Utils.safeGetItem(historyKey, []);
        
        history.unshift({
            type,
            message,
            timestamp: new Date().toISOString()
        });

        // Оставить только последние N уведомлений
        if (history.length > this.maxHistorySize) {
            history.splice(this.maxHistorySize);
        }

        Utils.safeSetItem(historyKey, history);
    }

    /**
     * Получить текущего пользователя из UserManager
     * @returns {Object|null} Текущий пользователь
     */
    getCurrentUser() {
        // Попробовать получить из window.managers.user сначала (основное приложение)
        if (window.managers?.user?.getCurrentUser) {
            return window.managers.user.getCurrentUser();
        }
        
        // Резервный вариант: попробовать window.userManager (устаревший)
        if (window.userManager?.getCurrentUser) {
            return window.userManager.getCurrentUser();
        }
        
        // Финальный резервный вариант: попробовать получить из localStorage напрямую
        try {
            const userData = localStorage.getItem('currentUser');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error getting current user from localStorage:', error);
            return null;
        }
    }

    /**
     * Setup notification history functionality
     */
    setupNotificationHistory() {
        const notificationHistoryBtn = Utils.getElement('notification-history-btn');
        const notificationHistoryModal = Utils.getElement('notification-history-modal');
        const clearNotificationsBtn = Utils.getElement('clear-notifications');

        if (notificationHistoryBtn && notificationHistoryModal) {
            Utils.addEventListenerSafe(notificationHistoryBtn, 'click', () => {
                const isOpening = notificationHistoryModal.classList.contains('hidden');
                notificationHistoryModal.classList.toggle('hidden');
                
                if (isOpening) {
                    // Modal is opening - move existing toasts inside
                    this.moveToastsToModal();
                    this.loadNotificationHistory();
                } else {
                    // Modal is closing - move toasts back to default container
                    this.moveToastsToDefault();
                }
            });
        }

        if (clearNotificationsBtn) {
            Utils.addEventListenerSafe(clearNotificationsBtn, 'click', () => {
                this.clearNotificationHistory();
            });
        }

        // Close modal when clicking outside
        if (notificationHistoryModal) {
            Utils.addEventListenerSafe(notificationHistoryModal, 'click', (e) => {
                if (e.target === notificationHistoryModal) {
                    notificationHistoryModal.classList.add('hidden');
                    this.moveToastsToDefault();
                }
            });
        }
    }

    /**
     * Move existing toasts to the modal container
     */
    moveToastsToModal() {
        const defaultContainer = Utils.getElement('toast-container');
        const modalContainer = Utils.getElement('notification-history-modal');
        
        if (!defaultContainer || !modalContainer) return;
        
        const toasts = Array.from(defaultContainer.querySelectorAll('.toast'));
        toasts.forEach(toast => {
            toast.classList.add('toast-in-modal');
            modalContainer.appendChild(toast);
        });
    }

    /**
     * Move toasts back to the default container
     */
    moveToastsToDefault() {
        const defaultContainer = Utils.getElement('toast-container');
        const modalContainer = Utils.getElement('notification-history-modal');
        
        if (!defaultContainer || !modalContainer) return;
        
        const toasts = Array.from(modalContainer.querySelectorAll('.toast'));
        toasts.forEach(toast => {
            toast.classList.remove('toast-in-modal');
            defaultContainer.appendChild(toast);
        });
    }

    /**
     * Load notification history
     */
    loadNotificationHistory() {
        const historyList = Utils.getElement('notification-history-list');
        if (!historyList) {
            console.log('ToastManager - loadNotificationHistory: historyList not found');
            return;
        }

        const currentUser = this.getCurrentUser();
        console.log('ToastManager - loadNotificationHistory - currentUser:', currentUser);
        
        if (!currentUser || !currentUser.id) {
            console.log('ToastManager - loadNotificationHistory: No user or user.id found');
            historyList.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-user-slash text-3xl mb-2" aria-hidden="true"></i>
                    <p>Войдите, чтобы просматривать уведомления</p>
                </div>
            `;
            return;
        }

        console.log('ToastManager - loadNotificationHistory: Loading notifications for user:', currentUser.id);
        const historyKey = `notificationHistory_${currentUser.id}`;
        let history = Utils.safeGetItem(historyKey, []);
        
        // Filter old notifications (older than 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        history = history.filter(notification => new Date(notification.timestamp) > thirtyDaysAgo);
        
        Utils.safeSetItem(historyKey, history);

        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-bell-slash text-3xl mb-2" aria-hidden="true"></i>
                    <p>Нет уведомлений</p>
                </div>
            `;
        } else {
            historyList.innerHTML = history.map(notification => `
                <div class="notification-history-item ${notification.type}">
                    <i class="fas fa-${this.getNotificationIcon(notification.type)}" aria-hidden="true"></i>
                    <span>${Utils.escapeHtml(notification.message)}</span>
                    <span class="notif-time">${this.formatTime(notification.timestamp)}</span>
                </div>
            `).join('');
        }
    }

    /**
     * Clear notification history
     */
    clearNotificationHistory() {
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.id) {
            Utils.safeSetItem(`notificationHistory_${currentUser.id}`, []);
            this.loadNotificationHistory();
        }
    }

    /**
     * Get notification icon
     * @param {string} type - Notification type
     * @returns {string} Icon class
     */
    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            info: 'info-circle',
            warning: 'exclamation-triangle'
        };
        return icons[type] || 'bell';
    }

    /**
     * Format timestamp for display
     * @param {string} timestamp - ISO timestamp
     * @returns {string} Formatted time
     */
    formatTime(timestamp) {
        return Utils.formatDate(timestamp);
    }

    /**
     * Show success notification
     * @param {string} message - Message
     * @param {Object} options - Options
     */
    success(message, options = {}) {
        this.show('success', message, options);
    }

    /**
     * Show error notification
     * @param {string} message - Message
     * @param {Object} options - Options
     */
    error(message, options = {}) {
        this.show('error', message, options);
    }

    /**
     * Show info notification
     * @param {string} message - Message
     * @param {Object} options - Options
     */
    info(message, options = {}) {
        this.show('info', message, options);
    }

    /**
     * Show warning notification
     * @param {string} message - Message
     * @param {Object} options - Options
     */
    warning(message, options = {}) {
        this.show('warning', message, options);
    }

    /**
     * Show persistent notification (doesn't auto-hide)
     * @param {string} type - Notification type
     * @param {string} message - Message
     * @param {Object} options - Options
     */
    persistent(type, message, options = {}) {
        this.show(type, message, { ...options, persistent: true });
    }

    /**
     * Show notification with action button
     * @param {string} type - Notification type
     * @param {string} message - Message
     * @param {Function} action - Action function
     * @param {string} actionText - Action button text
     * @param {Object} options - Additional options
     */
    withAction(type, message, action, actionText, options = {}) {
        this.show(type, message, { ...options, action, actionText });
    }

    /**
     * Clear all current toasts
     */
    clearAll() {
        const container = Utils.getElement('toast-container');
        if (container) {
            container.innerHTML = '';
            this.currentToasts = 0;
            this.toastQueue = [];
        }
    }

    /**
     * Get notification count for current user
     * @returns {number} Notification count
     */
    getNotificationCount() {
        const currentUser = this.getCurrentUser();
        if (!currentUser || !currentUser.id) return 0;

        const historyKey = `notificationHistory_${currentUser.id}`;
        const history = Utils.safeGetItem(historyKey, []);
        return history.length;
    }

    /**
     * Update notification badge
     */
    updateNotificationBadge() {
        const count = this.getNotificationCount();
        const badge = Utils.getElement('notification-badge');
        
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count.toString();
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }

    /**
     * Check for user notifications and show them
     */
    checkUserNotifications() {
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.email) {
            const supportManager = window.gameHubApp?.getManager('support');
            if (supportManager) {
                const notifications = supportManager.getUserNotifications(currentUser.email);
                const unreadCount = supportManager.getUserUnreadCount(currentUser.email);
                
                if (unreadCount > 0) {
                    this.info(`У вас ${unreadCount} непрочитанное(ых) уведомление(й) от администратора`);
                }
            }
        }
    }
}

// Create singleton instance
export const toastManager = new ToastManager();