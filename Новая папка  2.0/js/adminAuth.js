/**
 * Admin Authentication Module
 * Отдельная система аутентификации для админа
 */

export class AdminAuth {
    constructor() {
        this.adminCredentials = {
            username: 'admin',
            password: 'admin123', // В продакшене используйте более сложный пароль
            email: 'admin@gamehub.com'
        };
        
        this.adminSessionKey = 'adminSession';
        this.adminCredentialsKey = 'adminCredentials';
        
        // Инициализация учетных данных админа при первом запуске
        this.initializeAdminCredentials();
    }

    /**
     * Инициализация учетных данных админа
     */
    initializeAdminCredentials() {
        const storedCredentials = localStorage.getItem(this.adminCredentialsKey);
        if (!storedCredentials) {
            // Сохраняем учетные данные админа при первом запуске
            localStorage.setItem(this.adminCredentialsKey, JSON.stringify(this.adminCredentials));
            console.log('✅ Admin credentials initialized');
        } else {
            // Загружаем сохраненные учетные данные
            this.adminCredentials = JSON.parse(storedCredentials);
        }
    }

    /**
     * Аутентификация админа
     * @param {string} username - Имя пользователя
     * @param {string} password - Пароль
     * @returns {boolean} - Успешность аутентификации
     */
    authenticate(username, password) {
        try {
            // Проверяем учетные данные
            if (username === this.adminCredentials.username && 
                password === this.adminCredentials.password) {
                
                // Создаем сессию админа
                const adminSession = {
                    isAuthenticated: true,
                    username: this.adminCredentials.username,
                    email: this.adminCredentials.email,
                    loginTime: new Date().toISOString(),
                    sessionId: this.generateSessionId()
                };
                
                localStorage.setItem(this.adminSessionKey, JSON.stringify(adminSession));
                console.log('✅ Admin authenticated successfully');
                return true;
            }
            
            console.log('❌ Admin authentication failed');
            return false;
        } catch (error) {
            console.error('Error during admin authentication:', error);
            return false;
        }
    }

    /**
     * Проверка аутентификации админа
     * @returns {boolean} - Аутентифицирован ли админ
     */
    isAuthenticated() {
        try {
            const session = localStorage.getItem(this.adminSessionKey);
            if (!session) return false;
            
            const adminSession = JSON.parse(session);
            return adminSession.isAuthenticated === true;
        } catch (error) {
            console.error('Error checking admin authentication:', error);
            return false;
        }
    }

    /**
     * Получение информации о сессии админа
     * @returns {Object|null} - Информация о сессии или null
     */
    getSession() {
        try {
            const session = localStorage.getItem(this.adminSessionKey);
            return session ? JSON.parse(session) : null;
        } catch (error) {
            console.error('Error getting admin session:', error);
            return null;
        }
    }

    /**
     * Выход админа
     */
    logout() {
        try {
            localStorage.removeItem(this.adminSessionKey);
            console.log('✅ Admin logged out');
        } catch (error) {
            console.error('Error during admin logout:', error);
        }
    }

    /**
     * Изменение пароля админа
     * @param {string} currentPassword - Текущий пароль
     * @param {string} newPassword - Новый пароль
     * @returns {boolean} - Успешность изменения пароля
     */
    changePassword(currentPassword, newPassword) {
        try {
            // Проверяем текущий пароль
            if (currentPassword !== this.adminCredentials.password) {
                console.log('❌ Current password is incorrect');
                return false;
            }

            // Обновляем пароль
            this.adminCredentials.password = newPassword;
            localStorage.setItem(this.adminCredentialsKey, JSON.stringify(this.adminCredentials));
            
            console.log('✅ Admin password changed successfully');
            return true;
        } catch (error) {
            console.error('Error changing admin password:', error);
            return false;
        }
    }

    /**
     * Изменение имени пользователя админа
     * @param {string} currentPassword - Текущий пароль для подтверждения
     * @param {string} newUsername - Новое имя пользователя
     * @returns {boolean} - Успешность изменения имени пользователя
     */
    changeUsername(currentPassword, newUsername) {
        try {
            // Проверяем пароль
            if (currentPassword !== this.adminCredentials.password) {
                console.log('❌ Password is incorrect');
                return false;
            }

            // Проверяем новое имя пользователя
            if (!newUsername || newUsername.trim().length < 3) {
                console.log('❌ Username must be at least 3 characters long');
                return false;
            }

            // Обновляем имя пользователя
            this.adminCredentials.username = newUsername.trim();
            localStorage.setItem(this.adminCredentialsKey, JSON.stringify(this.adminCredentials));
            
            console.log('✅ Admin username changed successfully');
            return true;
        } catch (error) {
            console.error('Error changing admin username:', error);
            return false;
        }
    }

    /**
     * Получение учетных данных админа (только для отображения)
     * @returns {Object} - Учетные данные админа
     */
    getCredentials() {
        return {
            username: this.adminCredentials.username,
            email: this.adminCredentials.email
        };
    }

    /**
     * Генерация ID сессии
     * @returns {string} - Уникальный ID сессии
     */
    generateSessionId() {
        return 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Проверка активности сессии (можно добавить таймаут)
     * @returns {boolean} - Активна ли сессия
     */
    isSessionActive() {
        try {
            const session = this.getSession();
            if (!session) return false;

            // Проверяем, не истекла ли сессия (24 часа)
            const loginTime = new Date(session.loginTime);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);

            if (hoursDiff > 24) {
                this.logout();
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error checking session activity:', error);
            return false;
        }
    }

    /**
     * Очистка всех данных админа (для сброса)
     */
    resetAdminData() {
        try {
            localStorage.removeItem(this.adminSessionKey);
            localStorage.removeItem(this.adminCredentialsKey);
            console.log('✅ Admin data reset successfully');
        } catch (error) {
            console.error('Error resetting admin data:', error);
        }
    }
}

// Создаем глобальный экземпляр для использования в других модулях
export const adminAuth = new AdminAuth(); 