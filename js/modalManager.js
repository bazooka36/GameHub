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
        if (!modalElement) {
            console.warn('Modal element is required');
            return;
        }
        
        this.hideAllModals();
        
        // Store previous focus
        this.previousFocus = document.activeElement;
        
        // Show modal
        modalElement.style.display = displayType;
        modalElement.classList.remove('hidden');
        modalElement.classList.add('active');
        this.activeModal = modalElement;

        // Set ARIA attributes
        modalElement.setAttribute('aria-hidden', 'false');
        modalElement.setAttribute('tabindex', '-1');

        // Focus first focusable element
        this.focusFirstElement(modalElement);

        // Add escape key handler
        this.addEscapeHandler(modalElement);

        // Add click outside handler
        this.addClickOutsideHandler(modalElement);

        // Prevent body scroll
        this.preventBodyScroll();
    }

    /**
     * Hide modal window
     * @param {HTMLElement} modalElement - Modal element to hide
     */
    hideModal(modalElement) {
        if (!modalElement) return;
        
        // Hide modal
        modalElement.classList.remove('active');
        modalElement.classList.add('hidden');
        modalElement.style.display = 'none';
        
        // Reset ARIA attributes
        modalElement.setAttribute('aria-hidden', 'true');
        modalElement.removeAttribute('tabindex');
        
        if (this.activeModal === modalElement) {
            this.activeModal = null;
        }

        // Remove event handlers
        this.removeEscapeHandler(modalElement);
        this.removeClickOutsideHandler(modalElement);

        // Restore body scroll
        this.restoreBodyScroll();

        // Restore focus
        this.restoreFocus();
    }

    /**
     * Hide all modals
     */
    hideAllModals() {
        const modals = document.querySelectorAll('.auth-modal, .profile-modal, .friends-modal, #notification-history-modal, #mobile-gamehub-modal, #mobile-subscribe-modal');
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
            setTimeout(() => focusableElements[0].focus(), 100);
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
     * @returns {HTMLElement} Created modal element
     */
    createModal(options = {}) {
        const {
            id = 'dynamic-modal',
            title = '',
            content = '',
            className = 'auth-modal',
            showCloseButton = true,
            closeOnEscape = true,
            closeOnClickOutside = true
        } = options;

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

        // Add close button handler
        if (showCloseButton) {
            const closeBtn = modal.querySelector('.close-modal-btn');
            if (closeBtn) {
                Utils.addEventListenerSafe(closeBtn, 'click', () => this.hideModal(modal));
            }
        }

        // Add to DOM
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
            confirmClass = 'bg-red-600 hover:bg-red-700',
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