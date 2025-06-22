/**
 * Modal Manager for GameHub
 * Handles modal window operations, focus management, and accessibility
 */

import { Utils } from './utils.js';

export class ModalManager {
    constructor() {
        this.activeModal = null;
        this.previousFocus = null;
        this.escapeHandlers = new Map();
    }

    /**
     * Show modal window
     * @param {HTMLElement} modalElement - Modal element to show
     * @param {string} displayType - CSS display type
     */
    showModal(modalElement, displayType = 'flex') {
        if (!(modalElement instanceof HTMLElement)) {
            console.warn('Недопустимый элемент модального окна передан в showModal.');
            return;
        }

        this.hideAllModals();

        // Сохранить предыдущий фокус
        this.previousFocus = document.activeElement;

        // Показать модальное окно
        modalElement.style.display = displayType;
        modalElement.classList.remove('hidden');
        modalElement.classList.add('active');
        this.activeModal = modalElement;

        // Установить ARIA атрибуты
        modalElement.setAttribute('aria-hidden', 'false');
        modalElement.setAttribute('tabindex', '-1');

        // Фокусироваться на первом фокусируемом элементе
        this.focusFirstElement(modalElement);

        // Добавить обработчик клавиши Escape
        this.addEscapeHandler(modalElement);

        // Добавить обработчик клика снаружи
        this.addClickOutsideHandler(modalElement);

        // Предотвратить прокрутку тела
        this.preventBodyScroll();
    }

    /**
     * Hide modal window
     * @param {HTMLElement} modalElement - Modal element to hide
     */
    hideModal(modalElement) {
        if (!(modalElement instanceof HTMLElement)) {
            console.warn('Недопустимый элемент модального окна передан в hideModal.');
            return;
        }

        modalElement.classList.remove('active');
        modalElement.classList.add('hidden');
        modalElement.style.display = 'none';

        // Сбросить ARIA атрибуты
        modalElement.setAttribute('aria-hidden', 'true');
        modalElement.removeAttribute('tabindex');

        if (this.activeModal === modalElement) {
            this.activeModal = null;
        }

        // Удалить обработчики событий
        this.removeEscapeHandler(modalElement);
        this.removeClickOutsideHandler(modalElement);

        // Восстановить прокрутку тела
        this.restoreBodyScroll();

        // Восстановить фокус
        this.restoreFocus();
    }

    /**
     * Hide all modals
     */
    hideAllModals() {
        const modals = document.querySelectorAll('.auth-modal, .profile-modal, .friends-modal, #notification-history-modal');
        modals.forEach(modal => this.hideModal(modal));
    }

    /**
     * Focus first focusable element in modal
     * @param {HTMLElement} modalElement - Modal element
     */
    focusFirstElement(modalElement) {
        const focusableElements = modalElement.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length > 0) {
            setTimeout(() => {
                if (focusableElements[0]) {
                    focusableElements[0].focus();
                }
            }, 100);
        }
    }

    /**
     * Add escape key handler
     * @param {HTMLElement} modalElement - Modal element
     */
    addEscapeHandler(modalElement) {
        const escapeHandler = (e) => {
            if (e.key === 'Escape' && this.activeModal === modalElement) {
                this.hideModal(modalElement);
            }
        };

        this.escapeHandlers.set(modalElement, escapeHandler);
        document.addEventListener('keydown', escapeHandler);
    }

    /**
     * Remove escape key handler
     * @param {HTMLElement} modalElement - Modal element
     */
    removeEscapeHandler(modalElement) {
        const handler = this.escapeHandlers.get(modalElement);
        if (handler) {
            document.removeEventListener('keydown', handler);
            this.escapeHandlers.delete(modalElement);
        }
    }

    /**
     * Add click outside handler
     * @param {HTMLElement} modalElement - Modal element
     */
    addClickOutsideHandler(modalElement) {
        const clickHandler = (e) => {
            if (e.target === modalElement) {
                this.hideModal(modalElement);
            }
        };

        modalElement.addEventListener('click', clickHandler);
        modalElement._clickOutsideHandler = clickHandler;
    }

    /**
     * Remove click outside handler
     * @param {HTMLElement} modalElement - Modal element
     */
    removeClickOutsideHandler(modalElement) {
        if (modalElement._clickOutsideHandler) {
            modalElement.removeEventListener('click', modalElement._clickOutsideHandler);
            delete modalElement._clickOutsideHandler;
        }
    }

    /**
     * Prevent body scroll when modal is open
     */
    preventBodyScroll() {
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = this.getScrollbarWidth() + 'px';
    }

    /**
     * Restore body scroll
     */
    restoreBodyScroll() {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }

    /**
     * Get scrollbar width
     * @returns {number} Scrollbar width
     */
    getScrollbarWidth() {
        return window.innerWidth - document.documentElement.clientWidth;
    }

    /**
     * Restore previous focus
     */
    restoreFocus() {
        if (this.previousFocus && typeof this.previousFocus.focus === 'function') {
            setTimeout(() => this.previousFocus.focus(), 100);
        }
    }

    /**
     * Create modal with dynamic content
     * @param {Object} options - Modal options
     * @returns {HTMLElement|null} Created modal element
     */
    createModal(options = {}) {
        const {
            id = `dynamic-modal-${Date.now()}`,
            title = '',
            content = '',
            className = 'auth-modal',
            showCloseButton = true,
            closeOnEscape = true,
            closeOnClickOutside = true
        } = options;

        if (!title && !content) {
            console.warn('Modal must have either a title or content.');
            return null;
        }

        const modal = document.createElement('div');
        modal.id = id;
        modal.className = className;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', `${id}-title`);
        modal.setAttribute('aria-describedby', `${id}-content`);

        modal.innerHTML = `
            <div class="auth-content">
                ${title ? `<h2 id="${id}-title" class="text-xl font-bold text-white mb-4">${title}</h2>` : ''}
                ${showCloseButton ? `
                    <button type="button" class="absolute top-3 right-3 text-gray-400 hover:text-gray-200 transition close-modal-btn" aria-label="Закрыть">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                ` : ''}
                <div id="${id}-content">
                    ${content}
                </div>
            </div>
        `;

        if (showCloseButton) {
            const closeBtn = modal.querySelector('.close-modal-btn');
            if (closeBtn) {
                Utils.addEventListenerSafe(closeBtn, 'click', () => this.hideModal(modal));
            }
        }

        document.body.appendChild(modal);

        return modal;
    }

    /**
     * Show confirmation dialog
     * @param {Object} options - Confirmation options
     * @returns {Promise<boolean>} User choice
     */
    async showConfirmation(options = {}) {
        const {
            title = 'Подтверждение',
            message = 'Вы уверены?',
            confirmText = 'Да',
            cancelText = 'Отмена',
            confirmClass = 'bg-gray-700 hover:bg-gray-600',
            cancelClass = 'bg-gray-700 hover:bg-gray-600'
        } = options;

        return new Promise((resolve) => {
            const modal = this.createModal({
                id: 'confirmation-modal',
                title,
                content: `
                    <p class="text-gray-300 mb-4">${message}</p>
                    <div class="flex gap-4">
                        <button type="button" class="confirm-btn ${confirmClass} text-white px-4 py-2 rounded transition">
                            ${confirmText}
                        </button>
                        <button type="button" class="cancel-btn ${cancelClass} text-white px-4 py-2 rounded transition">
                            ${cancelText}
                        </button>
                    </div>
                `,
                showCloseButton: false
            });

            if (!modal) {
                console.error('Failed to create confirmation modal.');
                resolve(false);
                return;
            }

            const confirmBtn = modal.querySelector('.confirm-btn');
            const cancelBtn = modal.querySelector('.cancel-btn');

            const cleanup = () => {
                Utils.removeEventListenerSafe(confirmBtn, 'click', handleConfirm);
                Utils.removeEventListenerSafe(cancelBtn, 'click', handleCancel);
                this.hideModal(modal);
                setTimeout(() => modal.remove(), 300);
            };

            const handleConfirm = () => {
                cleanup();
                resolve(true);
            };

            const handleCancel = () => {
                cleanup();
                resolve(false);
            };

            Utils.addEventListenerSafe(confirmBtn, 'click', handleConfirm);
            Utils.addEventListenerSafe(cancelBtn, 'click', handleCancel);

            this.showModal(modal);
        });
    }

    /**
     * Show alert dialog
     * @param {Object} options - Alert options
     * @returns {Promise<void>}
     */
    async showAlert(options = {}) {
        const {
            title = 'Уведомление',
            message = '',
            buttonText = 'OK',
            buttonClass = 'bg-blue-600 hover:bg-blue-700'
        } = options;

        return new Promise((resolve) => {
            const modal = this.createModal({
                id: 'alert-modal',
                title,
                content: `
                    <p class="text-gray-300 mb-4">${message}</p>
                    <div class="flex justify-end">
                        <button type="button" class="alert-btn ${buttonClass} text-white px-4 py-2 rounded transition">
                            ${buttonText}
                        </button>
                    </div>
                `,
                showCloseButton: false
            });

            if (!modal) {
                console.error('Failed to create alert modal.');
                resolve();
                return;
            }

            const alertBtn = modal.querySelector('.alert-btn');

            const cleanup = () => {
                Utils.removeEventListenerSafe(alertBtn, 'click', handleClick);
                this.hideModal(modal);
                setTimeout(() => modal.remove(), 300);
            };

            const handleClick = () => {
                cleanup();
                resolve();
            };

            Utils.addEventListenerSafe(alertBtn, 'click', handleClick);

            this.showModal(modal);
        });
    }

    /**
     * Cleanup all event handlers
     */
    cleanup() {
        this.escapeHandlers.forEach((handler, modal) => {
            document.removeEventListener('keydown', handler);
        });
        this.escapeHandlers.clear();
        this.restoreBodyScroll();
    }
}

// Create singleton instance
export const modalManager = new ModalManager();