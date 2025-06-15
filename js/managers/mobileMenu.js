/**
 * Mobile Menu Manager - Handles mobile menu functionality
 */

export class MobileMenu {
    constructor() {
        this.isMenuOpen = false;
    }

    async init() {
        console.log('MobileMenu initialized');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Mobile menu button
        const mobileMenuBtn = document.getElementById('mobile-menu-button');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Mobile menu items
        const mobileMenuItems = document.querySelectorAll('#mobile-menu button');
        mobileMenuItems.forEach(item => {
            item.addEventListener('click', () => this.handleMobileMenuItemClick(item));
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            const mobileMenu = document.getElementById('mobile-menu');
            const mobileMenuBtn = document.getElementById('mobile-menu-button');
            
            if (mobileMenu && mobileMenuBtn && 
                !mobileMenu.contains(e.target) && 
                !mobileMenuBtn.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) { // md breakpoint
                this.closeMobileMenu();
            }
        });

        // Mobile modals
        this.setupMobileModals();
    }

    toggleMobileMenu() {
        if (this.isMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileMenuBtn = document.getElementById('mobile-menu-button');
        
        if (mobileMenu) {
            mobileMenu.classList.remove('hidden');
            this.isMenuOpen = true;
        }
        
        if (mobileMenuBtn) {
            mobileMenuBtn.setAttribute('aria-expanded', 'true');
        }

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    closeMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileMenuBtn = document.getElementById('mobile-menu-button');
        
        if (mobileMenu) {
            mobileMenu.classList.add('hidden');
            this.isMenuOpen = false;
        }
        
        if (mobileMenuBtn) {
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }

        // Restore body scroll
        document.body.style.overflow = '';
    }

    handleMobileMenuItemClick(item) {
        const itemId = item.id;
        
        switch (itemId) {
            case 'mobile-profile-option':
                this.showProfileModal();
                break;
            case 'mobile-friends-option':
                this.showFriendsModal();
                break;
            case 'mobile-notifications-option':
                this.showNotificationsHistory();
                break;
            case 'mobile-settings-option':
                this.showSettingsModal();
                break;
            case 'mobile-account-option':
                this.toggleAccountSubmenu();
                break;
            case 'mobile-about-option':
                this.showAboutModal();
                break;
            case 'mobile-logout-btn':
                this.handleLogout();
                break;
            case 'delete-account-btn-mobile':
                this.showDeleteAccountModal();
                break;
            default:
                // Handle other menu items
                this.closeMobileMenu();
                break;
        }
    }

    showProfileModal() {
        this.closeMobileMenu();
        // Trigger profile modal
        const profileManager = window.gameHubApp?.getManager('profile');
        if (profileManager && typeof profileManager.showProfileModal === 'function') {
            profileManager.showProfileModal();
        }
    }

    showFriendsModal() {
        this.closeMobileMenu();
        // Trigger friends modal
        const friendsManager = window.gameHubApp?.getManager('friends');
        if (friendsManager && typeof friendsManager.showFriendsModal === 'function') {
            friendsManager.showFriendsModal();
        }
    }

    showNotificationsHistory() {
        this.closeMobileMenu();
        const notificationHistoryBtn = document.getElementById('notification-history-btn');
        if (notificationHistoryBtn) {
            notificationHistoryBtn.click();
        }
    }

    showSettingsModal() {
        this.closeMobileMenu();
        const settingsManager = window.gameHubApp?.getManager('settings');
        if (settingsManager && typeof settingsManager.showSettingsModal === 'function') {
            settingsManager.showSettingsModal();
        }
    }

    showAboutModal() {
        this.closeMobileMenu();
        const modal = document.getElementById('about-modal');
        if (modal) {
            modal.classList.add('active');
            
            // Add close button handler
            const closeBtn = document.getElementById('close-about');
            if (closeBtn) {
                const closeHandler = () => {
                    modal.classList.remove('active');
                    closeBtn.removeEventListener('click', closeHandler);
                };
                closeBtn.addEventListener('click', closeHandler);
            }
            
            // Add click outside handler
            const clickOutsideHandler = (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    modal.removeEventListener('click', clickOutsideHandler);
                }
            };
            modal.addEventListener('click', clickOutsideHandler);
            
            // Add escape key handler
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    modal.classList.remove('active');
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);
        }
    }

    toggleAccountSubmenu() {
        const submenu = document.getElementById('mobile-account-submenu');
        if (submenu) {
            const isHidden = submenu.classList.contains('hidden');
            if (isHidden) {
                submenu.classList.remove('hidden');
            } else {
                submenu.classList.add('hidden');
            }
        }
    }

    handleLogout() {
        this.closeMobileMenu();
        // Trigger logout
        const authManager = window.gameHubApp?.getManager('auth');
        if (authManager && typeof authManager.logout === 'function') {
            authManager.logout();
        }
    }

    showDeleteAccountModal() {
        this.closeMobileMenu();
        // Trigger delete account modal
        const modalManager = window.modalManager;
        if (modalManager && typeof modalManager.showModal === 'function') {
            modalManager.showModal('delete-account-modal');
        }
    }

    setupMobileModals() {
        // Mobile GameHub info modal
        const mobileGamehubModal = document.getElementById('mobile-gamehub-modal');
        const closeGamehubBtn = document.getElementById('close-mobile-gamehub-modal');
        
        if (closeGamehubBtn) {
            closeGamehubBtn.addEventListener('click', () => {
                if (mobileGamehubModal) {
                    mobileGamehubModal.classList.add('hidden');
                }
            });
        }

        // Mobile subscribe modal
        const mobileSubscribeModal = document.getElementById('mobile-subscribe-modal');
        const closeSubscribeBtns = document.querySelectorAll('.close-mobile-modal');
        
        closeSubscribeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (mobileSubscribeModal) {
                    mobileSubscribeModal.classList.add('hidden');
                }
            });
        });

        // Handle footer links on mobile
        this.setupMobileFooterLinks();
    }

    setupMobileFooterLinks() {
        // Footer social links
        const instagramLink = document.querySelector('a[href*="instagram"]');
        const discordLink = document.querySelector('a[href*="discord"]');
        
        if (instagramLink) {
            instagramLink.addEventListener('click', (e) => {
                if (window.innerWidth < 768) {
                    e.preventDefault();
                    this.showMobileGamehubModal();
                }
            });
        }
        
        if (discordLink) {
            discordLink.addEventListener('click', (e) => {
                if (window.innerWidth < 768) {
                    e.preventDefault();
                    this.showMobileGamehubModal();
                }
            });
        }

        // Footer support form
        const submitSupportBtn = document.getElementById('submit-support-ticket');
        if (submitSupportBtn) {
            submitSupportBtn.addEventListener('click', (e) => {
                if (window.innerWidth < 768) {
                    e.preventDefault();
                    this.showMobileSubscribeModal();
                }
            });
        }
    }

    showMobileGamehubModal() {
        const modal = document.getElementById('mobile-gamehub-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    showMobileSubscribeModal() {
        const modal = document.getElementById('mobile-subscribe-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    updateMobileMenuForUserState(isLoggedIn) {
        const mobileProfileOptions = document.querySelector('.mobile-profile-options');
        
        if (mobileProfileOptions) {
            if (isLoggedIn) {
                mobileProfileOptions.classList.remove('hidden');
            } else {
                mobileProfileOptions.classList.add('hidden');
            }
        }
    }

    getMenuState() {
        return this.isMenuOpen;
    }
} 