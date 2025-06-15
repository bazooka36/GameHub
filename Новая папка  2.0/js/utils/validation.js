/**
 * Validation utilities for forms and data
 */

export class Validator {
    constructor() {
        this.errors = [];
    }

    /**
     * Validate email format
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate password strength
     */
    static validatePassword(password) {
        const errors = [];
        
        if (password.length < 8) {
            errors.push('Пароль должен содержать минимум 8 символов');
        }
        
        if (!/[a-z]/.test(password)) {
            errors.push('Пароль должен содержать хотя бы одну строчную букву');
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push('Пароль должен содержать хотя бы одну заглавную букву');
        }
        
        if (!/\d/.test(password)) {
            errors.push('Пароль должен содержать хотя бы одну цифру');
        }
        
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Пароль должен содержать хотя бы один специальный символ');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate username
     */
    static validateUsername(username) {
        const errors = [];
        
        if (username.length < 3) {
            errors.push('Имя пользователя должно содержать минимум 3 символа');
        }
        
        if (username.length > 20) {
            errors.push('Имя пользователя не должно превышать 20 символов');
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            errors.push('Имя пользователя может содержать только буквы, цифры и знак подчеркивания');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Sanitize HTML to prevent XSS
     */
    static sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Escape HTML entities
     */
    static escapeHTML(str) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return str.replace(/[&<>"']/g, (m) => map[m]);
    }

    /**
     * Validate form data
     */
    static validateForm(formData, rules) {
        const errors = {};
        
        for (const [field, rule] of Object.entries(rules)) {
            const value = formData[field];
            
            if (rule.required && (!value || value.trim() === '')) {
                errors[field] = `${rule.label} обязательно для заполнения`;
                continue;
            }
            
            if (value && rule.type === 'email' && !this.isValidEmail(value)) {
                errors[field] = 'Введите корректный email адрес';
            }
            
            if (value && rule.type === 'password') {
                const passwordValidation = this.validatePassword(value);
                if (!passwordValidation.isValid) {
                    errors[field] = passwordValidation.errors[0];
                }
            }
            
            if (value && rule.type === 'username') {
                const usernameValidation = this.validateUsername(value);
                if (!usernameValidation.isValid) {
                    errors[field] = usernameValidation.errors[0];
                }
            }
            
            if (value && rule.minLength && value.length < rule.minLength) {
                errors[field] = `${rule.label} должен содержать минимум ${rule.minLength} символов`;
            }
            
            if (value && rule.maxLength && value.length > rule.maxLength) {
                errors[field] = `${rule.label} не должен превышать ${rule.maxLength} символов`;
            }
            
            if (value && rule.pattern && !rule.pattern.test(value)) {
                errors[field] = rule.patternMessage || 'Неверный формат';
            }
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    /**
     * Check if passwords match
     */
    static passwordsMatch(password, confirmPassword) {
        return password === confirmPassword;
    }

    /**
     * Validate file upload
     */
    static validateFile(file, options = {}) {
        const errors = [];
        const {
            maxSize = 5 * 1024 * 1024, // 5MB default
            allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            maxWidth = 1920,
            maxHeight = 1080
        } = options;
        
        if (file.size > maxSize) {
            errors.push(`Размер файла не должен превышать ${Math.round(maxSize / 1024 / 1024)}MB`);
        }
        
        if (!allowedTypes.includes(file.type)) {
            errors.push('Неподдерживаемый тип файла');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Real-time validation for input fields
     */
    static setupRealTimeValidation(input, rules) {
        const validateField = () => {
            const value = input.value;
            const validation = this.validateForm({ [input.name]: value }, {
                [input.name]: rules
            });
            
            const errorElement = input.parentNode.querySelector('.error-message');
            
            if (!validation.isValid) {
                if (errorElement) {
                    errorElement.textContent = validation.errors[input.name];
                    errorElement.style.display = 'block';
                }
                input.classList.add('error');
            } else {
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
                input.classList.remove('error');
            }
        };
        
        input.addEventListener('blur', validateField);
        input.addEventListener('input', validateField);
    }
}

/**
 * Form validation rules
 */
export const FORM_RULES = {
    login: {
        email: {
            type: 'email',
            required: true,
            label: 'Email'
        },
        password: {
            type: 'password',
            required: true,
            label: 'Пароль'
        }
    },
    
    register: {
        email: {
            type: 'email',
            required: true,
            label: 'Email'
        },
        password: {
            type: 'password',
            required: true,
            label: 'Пароль'
        },
        confirmPassword: {
            type: 'password',
            required: true,
            label: 'Подтверждение пароля'
        }
    },
    
    profile: {
        username: {
            type: 'username',
            required: true,
            label: 'Имя пользователя'
        }
    },
    
    support: {
        email: {
            type: 'email',
            required: true,
            label: 'Email'
        },
        subject: {
            required: true,
            minLength: 5,
            maxLength: 100,
            label: 'Тема'
        },
        message: {
            required: true,
            minLength: 10,
            maxLength: 1000,
            label: 'Сообщение'
        }
    }
}; 