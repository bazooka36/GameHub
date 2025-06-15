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
     * Get the appropriate container for toasts
     * @returns {HTMLElement} Container element
     */
    getToastContainer() {
        const notificationHistoryModal = Utils.getElement('notification-history-modal');
        
        // If notification modal is open, show toasts inside it
        if (notificationHistoryModal && !notificationHistoryModal.classList.contains('hidden')) {
            return notificationHistoryModal;
        }
        
        // Otherwise use the default toast container
        return Utils.getElement('toast-container');
    }

    /**
     * Show toast notification
     * @param {string} type - Toast type (success, error, info, warning)
     * @param {string} message - Toast message
     * @param {Object} options - Additional options
     */
    show(type, message, options = {}) {
        const {
            duration = 4000,
            persistent = false,
            action = null,
            actionText = null
        } = options;

        // Add to queue if too many toasts
        if (this.currentToasts >= this.maxToasts) {
            this.toastQueue.push({ type, message, options });
            return;
        }

        const container = this.getToastContainer();
        if (!container) {
            console.warn('Toast container not found');
            return;
        }

        const toast = this.createToast(type, message, action, actionText);
        
        // If showing inside modal, add special styling
        if (container.id === 'notification-history-modal') {
            toast.classList.add('toast-in-modal');
        }
        
        container.appendChild(toast);
        this.currentToasts++;

        // Add to history
        this.addToHistory(type, message);

        // Add close button handler
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            Utils.addEventListenerSafe(closeBtn, 'click', () => {
                this.removeToast(toast);
            });
        }

        // Add action button handler
        if (action && actionText) {
            const actionBtn = toast.querySelector('.toast-action');
            if (actionBtn) {
                Utils.addEventListenerSafe(actionBtn, 'click', () => {
                    action();
                    this.removeToast(toast);
                });
            }
        }

        // Auto remove after duration (unless persistent)
        if (!persistent) {
            setTimeout(() => {
                this.removeToast(toast);
            }, duration);
        }

        // Process queue
        this.processQueue();
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
     * Add notification to history
     * @param {string} type - Notification type
     * @param {string} message - Notification message
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

        // Keep only last N notifications
        if (history.length > this.maxHistorySize) {
            history.splice(this.maxHistorySize);
        }

        Utils.safeSetItem(historyKey, history);
    }

    /**
     * Get current user from UserManager
     * @returns {Object|null} Current user
     */
    getCurrentUser() {
        // This will be injected by the main app
        return window.userManager?.getCurrentUser?.() || null;
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
        if (!historyList) return;

        const currentUser = this.getCurrentUser();
        if (!currentUser || !currentUser.id) {
            historyList.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-user-slash text-3xl mb-2" aria-hidden="true"></i>
                    <p>Войдите, чтобы просматривать уведомления</p>
                </div>
            `;
            return;
        }

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
}

// Create singleton instance
export const toastManager = new ToastManager(); 