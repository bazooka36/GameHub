/**
 * Security utilities for protection against common attacks
 */

export class Security {
    constructor() {
        this.csrfToken = this.generateCSRFToken();
        this.rateLimitMap = new Map();
    }

    /**
     * Generate CSRF token
     */
    generateCSRFToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Validate CSRF token
     */
    validateCSRFToken(token) {
        return token === this.csrfToken;
    }

    /**
     * Rate limiting for API calls
     */
    checkRateLimit(key, maxRequests = 10, timeWindow = 60000) {
        const now = Date.now();
        const userRequests = this.rateLimitMap.get(key) || [];
        
        // Remove old requests outside the time window
        const validRequests = userRequests.filter(timestamp => now - timestamp < timeWindow);
        
        if (validRequests.length >= maxRequests) {
            return {
                allowed: false,
                retryAfter: Math.ceil((validRequests[0] + timeWindow - now) / 1000)
            };
        }
        
        validRequests.push(now);
        this.rateLimitMap.set(key, validRequests);
        
        return { allowed: true };
    }

    /**
     * Sanitize user input to prevent XSS
     */
    static sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * Validate and sanitize URL
     */
    static sanitizeURL(url) {
        try {
            const parsed = new URL(url);
            // Only allow http and https protocols
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                return null;
            }
            return parsed.toString();
        } catch {
            return null;
        }
    }

    /**
     * Hash password using Web Crypto API
     */
    static async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Generate secure random string
     */
    static generateSecureString(length = 32) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Validate file upload security
     */
    static validateFileSecurity(file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml'
        ];
        
        if (file.size > maxSize) {
            return { valid: false, error: 'Файл слишком большой' };
        }
        
        if (!allowedTypes.includes(file.type)) {
            return { valid: false, error: 'Неподдерживаемый тип файла' };
        }
        
        return { valid: true };
    }

    /**
     * Prevent clickjacking
     */
    static preventClickjacking() {
        if (window.self !== window.top) {
            window.top.location = window.self.location;
        }
    }

    /**
     * Set secure headers (for server-side implementation)
     */
    static getSecurityHeaders() {
        return {
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.tailwindcss.com cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' cdnjs.cloudflare.com; connect-src 'self';"
        };
    }

    /**
     * Validate email format and check for common attack patterns
     */
    static validateEmailSecurity(email) {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { valid: false, error: 'Неверный формат email' };
        }
        
        // Check for suspicious patterns
        const suspiciousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /data:text\/html/i
        ];
        
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(email)) {
                return { valid: false, error: 'Email содержит недопустимые символы' };
            }
        }
        
        return { valid: true };
    }

    /**
     * Log security events
     */
    static logSecurityEvent(event, details = {}) {
        const securityLog = {
            timestamp: new Date().toISOString(),
            event,
            details,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // In production, this would be sent to a security monitoring service
        console.warn('Security Event:', securityLog);
        
        // Store in localStorage for debugging
        const logs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
        logs.push(securityLog);
        
        // Keep only last 100 logs
        if (logs.length > 100) {
            logs.splice(0, logs.length - 100);
        }
        
        localStorage.setItem('securityLogs', JSON.stringify(logs));
    }

    /**
     * Check for suspicious activity
     */
    static detectSuspiciousActivity() {
        const suspiciousPatterns = [
            // Check for rapid form submissions
            () => {
                const recentSubmissions = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
                const now = Date.now();
                const recent = recentSubmissions.filter(time => now - time < 60000);
                return recent.length > 10;
            },
            
            // Check for rapid API calls
            () => {
                const recentCalls = JSON.parse(localStorage.getItem('apiCalls') || '[]');
                const now = Date.now();
                const recent = recentCalls.filter(time => now - time < 60000);
                return recent.length > 50;
            }
        ];
        
        for (const check of suspiciousPatterns) {
            if (check()) {
                this.logSecurityEvent('suspicious_activity_detected', {
                    pattern: check.toString()
                });
                return true;
            }
        }
        
        return false;
    }

    /**
     * Initialize security measures
     */
    static init() {
        // Prevent clickjacking
        this.preventClickjacking();
        
        // Set up security monitoring
        setInterval(() => {
            if (this.detectSuspiciousActivity()) {
                console.warn('Подозрительная активность обнаружена');
            }
        }, 30000);
        
        // Monitor for XSS attempts
        const originalInnerHTML = Element.prototype.innerHTML;
        Element.prototype.innerHTML = function(value) {
            if (typeof value === 'string') {
                value = this.sanitizeInput(value);
            }
            return originalInnerHTML.call(this, value);
        };
        
        console.log('Security measures initialized');
    }
}

// Auto-initialize security
Security.init(); 