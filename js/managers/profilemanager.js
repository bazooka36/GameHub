/**
 * Profile Manager - Handles user profile operations
 */

export class ProfileManager {
    constructor() {
        this.currentProfile = null;
        this.userManager = null; // Will be injected by main app
    }

    /**
     * Set user manager reference
     * @param {UserManager} userManager - User manager instance
     */
    setUserManager(userManager) {
        this.userManager = userManager;
        console.log('ProfileManager - UserManager reference set:', userManager);
    }

    async init() {
        console.log('ProfileManager initialized');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Profile modal events
        const profileModal = document.getElementById('profile-modal');
        if (profileModal) {
            const closeBtn = profileModal.querySelector('.profile-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hideProfileModal());
            }
            
            // Close modal when clicking outside
            profileModal.addEventListener('click', (e) => {
                if (e.target === profileModal) {
                    this.hideProfileModal();
                }
            });
        }

        // Profile form events
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileSubmit(e));
        }

        // Avatar click event - open file dialog
        const profileAvatar = document.getElementById('profile-avatar');
        if (profileAvatar) {
            profileAvatar.addEventListener('click', () => this.openAvatarDialog());
        }

        // Avatar upload events
        const avatarInput = document.getElementById('avatar-input');
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => this.handleAvatarUpload(e));
        }

        // Описание профиля: счетчик символов
        const descInput = document.getElementById('user-description');
        const descCount = document.getElementById('desc-char-count');
        if (descInput && descCount) {
            descInput.addEventListener('input', () => {
                descCount.textContent = descInput.value.length;
            });
        }
    }

    showProfileModal() {
        const modal = document.getElementById('profile-modal');
        if (modal) {
            modal.classList.add('active');
            this.loadProfileData();
        }
    }

    hideProfileModal() {
        const modal = document.getElementById('profile-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    loadProfileData() {
        // Load current user profile data
        const currentUser = this.getCurrentUser();
        console.log('ProfileManager - Current user:', currentUser);
        console.log('ProfileManager - UserManager reference:', this.userManager);
        
        const DEFAULT_AVATAR = 'avatars/default-avatar.svg'; // путь к SVG-файлу
        if (currentUser) {
            const usernameInput = document.getElementById('username');
            const profileId = document.getElementById('profile-id');
            const avatarPreview = document.getElementById('avatar-preview');
            const descInput = document.getElementById('user-description');
            const descCount = document.getElementById('desc-char-count');

            if (usernameInput) usernameInput.value = currentUser.username || '';
            if (profileId) {
                // Ensure ID is displayed as a number
                const userId = currentUser.id || 'Неизвестно';
                profileId.textContent = `ID: ${userId}`;
            }
            if (avatarPreview) {
                avatarPreview.src = currentUser.avatar || DEFAULT_AVATAR;
            }
            if (descInput) descInput.value = currentUser.description || '';
            if (descCount) descCount.textContent = descInput.value.length;
        } else {
            // Handle case when user is not found
            console.log('ProfileManager - No current user found');
            const profileId = document.getElementById('profile-id');
            if (profileId) {
                profileId.textContent = 'ID: Не авторизован';
            }
            const avatarPreview = document.getElementById('avatar-preview');
            if (avatarPreview) {
                avatarPreview.src = 'avatars/default-avatar.svg';
            }
        }
    }

    async handleProfileSubmit(e) {
        e.preventDefault();
        const usernameInput = document.getElementById('username');
        const descInput = document.getElementById('user-description');
        const username = usernameInput ? usernameInput.value.trim() : '';
        const description = descInput ? descInput.value.trim() : '';
        if (!username) {
            this.showProfileMessage('Имя пользователя не может быть пустым', 'error');
            return;
        }
        if (username.length > 12) {
            this.showProfileMessage('Максимум символов никнейма — 12', 'error');
            return;
        }
        if (description.length > 150) {
            this.showProfileMessage('Описание не должно превышать 150 символов', 'error');
            return;
        }
        try {
            // Get current user
            const currentUser = this.getCurrentUser();
            if (!currentUser) {
                this.showProfileMessage('Пользователь не найден', 'error');
                return;
            }
            // Проверка ограничения на смену никнейма
            const now = Date.now();
            const maxAttempts = 2;
            let attempts = currentUser.usernameChangeAttempts || 0;
            let nextChange = currentUser.nextUsernameChange || null;
            const isChangingUsername = username !== currentUser.username;
            if (isChangingUsername) {
                if (nextChange && now < nextChange) {
                    const daysLeft = Math.ceil((nextChange - now) / (1000 * 60 * 60 * 24));
                    this.showProfileMessage(`Вы исчерпали лимит смены никнейма. Следующая попытка через ${daysLeft} дн.`, 'error');
                    return;
                }
                if (attempts >= maxAttempts) {
                    // Устанавливаем дату следующей попытки через 30 дней
                    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
                    currentUser.nextUsernameChange = now + thirtyDays;
                    this.showProfileMessage('Вы исчерпали лимит смены никнейма. Следующая попытка через 30 дней.', 'error');
                    // Сохраняем дату блокировки
                    if (this.userManager && typeof this.userManager.setCurrentUser === 'function') {
                        this.userManager.setCurrentUser(currentUser);
                    }
                    if (this.userManager && typeof this.userManager.updateUserInArray === 'function') {
                        this.userManager.updateUserInArray(currentUser);
                    }
                    return;
                }
                attempts++;
            }
            // Check if username is unique
            const userManager = window.managers?.user || window.userManager;
            if (userManager && typeof userManager.isUsernameUnique === 'function') {
                const isUnique = userManager.isUsernameUnique(username);
                if (!isUnique) {
                    this.showProfileMessage('Такое имя пользователя уже занято', 'error');
                    return;
                }
            }
            // Update user profile
            const updatedUser = {
                ...currentUser,
                username: username,
                description: description,
                usernameChangeAttempts: isChangingUsername ? attempts : (currentUser.usernameChangeAttempts || 0),
                nextUsernameChange: isChangingUsername ? (currentUser.nextUsernameChange || null) : (currentUser.nextUsernameChange || null)
            };
            if (isChangingUsername && attempts >= maxAttempts) {
                // Если это была последняя попытка, ставим дату блокировки
                const thirtyDays = 30 * 24 * 60 * 60 * 1000;
                updatedUser.nextUsernameChange = now + thirtyDays;
            }
            // Update through UserManager
            if (userManager && typeof userManager.setCurrentUser === 'function') {
                userManager.setCurrentUser(updatedUser);
            }
            // Update in users array
            if (userManager && typeof userManager.updateUserInArray === 'function') {
                userManager.updateUserInArray(updatedUser);
            }
            // Show success message
            this.showProfileMessage('Профиль обновлен успешно', 'success');
            // Обновить бургер-меню
            if (userManager && typeof userManager.updateBurgerMenuProfile === 'function') {
                userManager.updateBurgerMenuProfile(updatedUser);
            }
            // Close modal after short delay
            setTimeout(() => {
                this.hideProfileModal();
            }, 1500);
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showProfileMessage('Ошибка обновления профиля', 'error');
        }
    }

    handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.showProfileMessage('Пожалуйста, выберите изображение', 'error');
                return;
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                this.showProfileMessage('Размер файла не должен превышать 5MB', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const avatarPreview = document.getElementById('avatar-preview');
                if (avatarPreview) {
                    avatarPreview.src = e.target.result;
                }

                // Save avatar to user profile
                this.saveAvatarToProfile(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }

    saveAvatarToProfile(avatarDataUrl) {
        try {
            const currentUser = this.getCurrentUser();
            if (!currentUser) {
                this.showProfileMessage('Пользователь не найден', 'error');
                return;
            }

            // Update user with new avatar
            const updatedUser = {
                ...currentUser,
                avatar: avatarDataUrl
            };

            // Update through UserManager
            const userManager = window.managers?.user || window.userManager;
            if (userManager && typeof userManager.setCurrentUser === 'function') {
                userManager.setCurrentUser(updatedUser);
            }

            // Update in users array
            if (userManager && typeof userManager.updateUserInArray === 'function') {
                userManager.updateUserInArray(updatedUser);
            }

            this.showProfileMessage('Аватарка обновлена', 'success');
            
            // Обновить бургер-меню
            if (userManager && typeof userManager.updateBurgerMenuProfile === 'function') {
                userManager.updateBurgerMenuProfile(updatedUser);
            }
        } catch (error) {
            console.error('Error saving avatar:', error);
            this.showProfileMessage('Ошибка сохранения аватарки', 'error');
        }
    }

    showProfileMessage(message, type = 'info') {
        const messageEl = document.getElementById('profile-message');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.className = `profile-message ${type}`;
            messageEl.style.display = 'block';
            
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 3000);
        }
    }

    getCurrentUser() {
        // Get current user from UserManager or localStorage
        if (this.userManager && typeof this.userManager.getCurrentUser === 'function') {
            const userFromManager = this.userManager.getCurrentUser();
            console.log('ProfileManager - User from UserManager:', userFromManager);
            return userFromManager;
        }
        
        // Fallback: try to get from localStorage with the same key as UserManager
        const userData = localStorage.getItem('currentUser');
        const userFromStorage = userData ? JSON.parse(userData) : null;
        console.log('ProfileManager - User from localStorage:', userFromStorage);
        return userFromStorage;
    }

    openAvatarDialog() {
        const avatarInput = document.getElementById('avatar-input');
        if (avatarInput) {
            avatarInput.click();
        }
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        const usernameInput = Utils.getElement('username');
        const newUsername = usernameInput.value.trim();
        const profileMessage = Utils.getElement('profile-message');

        if (!newUsername) {
            this.showProfileMessage('Имя пользователя не может быть пустым.', 'error');
            return;
        }

        const currentUser = this.userManager.getCurrentUser();
        if (!currentUser) {
            this.showProfileMessage('Пользователь не найден.', 'error');
            return;
        }

        // Временно отключаем обновление аватара
        // const newAvatar = this.getAvatarData(); 

        try {
            const updatedProfile = {
                username: newUsername,
                // avatar: newAvatar || currentUser.avatar, // Используем новый аватар или оставляем старый
            };

            const success = this.userManager.updateProfile(updatedProfile);

            if (success) {
                // ... existing code ...
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showProfileMessage('Ошибка обновления профиля', 'error');
        }
    }
} 