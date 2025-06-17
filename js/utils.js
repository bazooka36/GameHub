/**
 * Utility functions for GameHub
 * Handles localStorage, validation, security, and common operations
 */

export const Utils = {
    /**
     * Check if localStorage is available
     * @returns {boolean}
     */
    isLocalStorageAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * Safe localStorage get operation
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} Stored value or default
     */
    safeGetItem(key, defaultValue = null) {
        if (!this.isLocalStorageAvailable()) {
            console.warn('localStorage is not available');
            return defaultValue;
        }
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return defaultValue;
        }
    },

    /**
     * Safe localStorage set operation
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} Success status
     */
    safeSetItem(key, value) {
        if (!this.isLocalStorageAvailable()) {
            console.warn('localStorage is not available');
            return false;
        }
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error writing to localStorage:', e);
            return false;
        }
    },

    /**
     * Escape HTML to prevent XSS attacks
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Generate unique user ID
     * @returns {string} Unique ID
     */
    generateUniqueId() {
        let lastId = parseInt(this.safeGetItem('lastUserId', '0'));
        if (lastId < 100000) {
            lastId = 100000;
        }
        lastId++;
        this.safeSetItem('lastUserId', lastId.toString());
        return lastId;
    },

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} Is valid email
     */
    validateEmail(email) {
        if (!email || typeof email !== 'string') return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Alias for validateEmail
     * @param {string} email - Email to validate
     * @returns {boolean} Is valid email
     */
    isValidEmail(email) {
        return this.validateEmail(email);
    },

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {object} Validation result with details
     */
    validatePassword(password) {
        if (!password || typeof password !== 'string') {
            return { isValid: false, errors: ['Пароль не может быть пустым'] };
        }

        const errors = [];
        const minLength = 8;
        const hasLower = /[a-zа-яё]/.test(password);
        const hasDigit = /[0-9]/.test(password);

        if (password.length < minLength) {
            errors.push(`Минимум ${minLength} символов`);
        }
        if (!hasLower) {
            errors.push('Хотя бы одна строчная буква');
        }
        if (!hasDigit) {
            errors.push('Хотя бы одна цифра');
        }

        return {
            isValid: errors.length === 0,
            errors,
            strength: this.calculatePasswordStrength(password, hasLower, hasDigit)
        };
    },

    /**
     * Вычисление силы пароля (0-100)
     * @param {string} password - Пароль для проверки
     * @param {boolean} hasLower - Есть ли строчные буквы
     * @param {boolean} hasDigit - Есть ли цифры
     * @returns {number} Оценка силы
     */
    calculatePasswordStrength(password, hasLower, hasDigit) {
        let score = 0;
        
        // Вклад длины
        score += Math.min(password.length * 4, 40);
        
        // Вклад разнообразия символов
        if (hasLower) score += 10;
        if (hasDigit) score += 10;
        
        // Бонус за более длинные пароли
        if (password.length > 12) score += 10;
        
        return Math.min(score, 100);
    },

    /**
     * Get element safely with error handling
     * @param {string} id - Element ID
     * @returns {HTMLElement|null} Element or null
     */
    getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with id '${id}' not found`);
        }
        return element;
    },

    /**
     * Add event listener safely
     * @param {HTMLElement} element - Target element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     */
    addEventListenerSafe(element, event, handler, options = {}) {
        if (element && typeof element.addEventListener === 'function') {
            element.addEventListener(event, handler, options);
        } else {
            console.warn('Cannot add event listener to element:', element);
        }
    },

    /**
     * Remove event listener safely
     * @param {HTMLElement} element - Target element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     */
    removeEventListenerSafe(element, event, handler, options = {}) {
        if (element && typeof element.removeEventListener === 'function') {
            element.removeEventListener(event, handler, options);
        }
    },

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in ms
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Форматирование даты для отображения
     * @param {string|Date} date - Дата для форматирования
     * @returns {string} Отформатированная дата
     */
    formatDate(date) {
        if (!date) return '';
        
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) return '';

        const now = new Date();
        const diff = now - dateObj;
        
        // Только что
        if (diff < 60000) return 'только что';
        
        // Минуты назад
        if (diff < 3600000) return `${Math.floor(diff / 60000)}м назад`;
        
        // Часы назад
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}ч назад`;
        
        // Дни назад
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}д назад`;
        
        // Полная дата
        return dateObj.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    /**
     * Generate random string
     * @param {number} length - String length
     * @returns {string} Random string
     */
    generateRandomString(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    /**
     * Check if browser supports modern features
     * @returns {object} Support status
     */
    checkBrowserSupport() {
        return {
            localStorage: this.isLocalStorageAvailable(),
            fetch: typeof fetch !== 'undefined',
            promises: typeof Promise !== 'undefined'
        };
    },

    /**
     * Обработка ошибок корректно
     * @param {Error} error - Объект ошибки
     * @param {string} context - Контекст ошибки
     */
    handleError(error, context = 'Неизвестно') {
        console.error(`Ошибка в ${context}:`, error);
        
        // В продакшене вы можете захотеть отправить это в сервис отслеживания ошибок
        if (process.env.NODE_ENV === 'production') {
            // Отправить в сервис отслеживания ошибок
            console.warn('В продакшене ошибка была бы отправлена в сервис отслеживания');
        }
    },

    /**
     * Validate form data
     * @param {Object} data - Form data
     * @param {Object} rules - Validation rules
     * @returns {Object} Validation result
     */
    validateForm(data, rules) {
        const errors = {};
        
        for (const [field, rule] of Object.entries(rules)) {
            const value = data[field];
            
            if (rule.required && (!value || value.trim() === '')) {
                errors[field] = rule.required;
                continue;
            }
            
            if (value && rule.minLength && value.length < rule.minLength) {
                errors[field] = rule.minLength;
                continue;
            }
            
            if (value && rule.maxLength && value.length > rule.maxLength) {
                errors[field] = rule.maxLength;
                continue;
            }
            
            if (value && rule.pattern && !rule.pattern.test(value)) {
                errors[field] = rule.pattern;
                continue;
            }
            
            if (value && rule.custom) {
                const customError = rule.custom(value, data);
                if (customError) {
                    errors[field] = customError;
                }
            }
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },

    /**
     * Show a toast notification using the global toastManager if available.
     * This is a convenience function for displaying simple toasts.
     * @param {string} message - The message to display in the toast.
     * @param {string} type - The type of toast (e.g., 'info', 'success', 'error', 'warning').
     */
    showToast(message, type = 'info') {
        if (window.toastManager) {
            window.toastManager.show(type, message);
        } else {
            console.warn('ToastManager not available. Cannot show toast:', message);
        }
    },

    /**
     * Show a warning message to the user, typically for browser compatibility issues.
     * @param {string} message - The warning message to display.
     */
    showBrowserWarning(message) {
        if (window.toastManager) {
            window.toastManager.warning(message, { persistent: true });
        } else {
            alert(`Предупреждение: ${message}`);
        }
    }
};