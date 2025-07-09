/**
 * Support Manager for GameHub
 * Handles support tickets, admin responses, and notifications
 */

import { Utils } from '../utils.js';

export class SupportManager {
    constructor() {
        this.tickets = Utils.safeGetItem('supportTickets', []);
        this.notifications = Utils.safeGetItem('notifications', []);
    }

    /**
     * Initialize support manager
     */
    async init() {
        this.loadSupportTickets();
        this.setupEventListeners();
        console.log('✅ SupportManager initialized');
    }

    /**
     * Setup event listeners for support functionality
     */
    setupEventListeners() {
        // Desktop support form
        const submitBtn = document.querySelector('#submit-support-ticket');
        if (submitBtn) {
            Utils.addEventListenerSafe(submitBtn, 'click', (e) => {
                e.preventDefault();
                this.submitSupportTicket();
            });
        }
    }

    /**
     * Submit support ticket from main form
     */
    submitSupportTicket() {
        const email = document.getElementById('support-email')?.value?.trim();
        const subject = document.getElementById('support-subject')?.value?.trim();
        const message = document.getElementById('support-message')?.value?.trim();

        if (!this.validateSupportForm(email, subject, message)) {
            return;
        }

        const ticket = this.createSupportTicket(email, subject, message);
        this.saveSupportTicket(ticket);
        this.clearSupportForm();
        this.notifyAdmin(ticket);
        
        if (window.toastManager) {
            window.toastManager.success('Ваше сообщение отправлено администратору. Мы ответим вам в ближайшее время.');
        }
    }

    /**
     * Validate support form
     */
    validateSupportForm(email, subject, message) {
        if (!email) {
            if (window.toastManager) {
                window.toastManager.error('Пожалуйста, введите email');
            }
            return false;
        }

        if (!Utils.isValidEmail(email)) {
            if (window.toastManager) {
                window.toastManager.error('Пожалуйста, введите корректный email');
            }
            return false;
        }

        if (!subject) {
            if (window.toastManager) {
                window.toastManager.error('Пожалуйста, введите тему сообщения');
            }
            return false;
        }

        if (!message) {
            if (window.toastManager) {
                window.toastManager.error('Пожалуйста, введите сообщение');
            }
            return false;
        }

        if (message.length < 10) {
            if (window.toastManager) {
                window.toastManager.error('Сообщение должно содержать минимум 10 символов');
            }
            return false;
        }

        return true;
    }

    /**
     * Create support ticket
     */
    createSupportTicket(email, subject, message) {
        return {
            id: Utils.generateUniqueId(),
            email: email,
            subject: subject,
            message: message,
            status: 'pending', // pending, in_progress, resolved
            priority: 'normal', // low, normal, high, urgent
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            responses: [],
            isRead: false
        };
    }

    /**
     * Save support ticket
     */
    saveSupportTicket(ticket) {
        this.tickets.unshift(ticket);
        
        // Keep only last N tickets
        if (this.tickets.length > 100) {
            this.tickets.splice(100);
        }

        Utils.safeSetItem('supportTickets', this.tickets);
    }

    /**
     * Load support tickets from storage
     */
    loadSupportTickets() {
        this.tickets = Utils.safeGetItem('supportTickets', []);
    }

    /**
     * Clear support form
     */
    clearSupportForm() {
        const emailInput = document.getElementById('support-email');
        const subjectInput = document.getElementById('support-subject');
        const messageInput = document.getElementById('support-message');

        if (emailInput) emailInput.value = '';
        if (subjectInput) subjectInput.value = '';
        if (messageInput) messageInput.value = '';
    }

    /**
     * Notify admin about new ticket
     */
    notifyAdmin(ticket) {
        // Save admin notification
        const adminNotifications = Utils.safeGetItem('adminNotifications', []);
        adminNotifications.unshift({
            id: Utils.generateUniqueId(),
            type: 'support_ticket',
            title: 'Новое сообщение в техподдержке',
            message: `От: ${ticket.email}\nТема: ${ticket.subject}`,
            ticketId: ticket.id,
            createdAt: new Date().toISOString(),
            isRead: false
        });

        // Keep only last 50 notifications
        if (adminNotifications.length > 50) {
            adminNotifications.splice(50);
        }

        Utils.safeSetItem('adminNotifications', adminNotifications);
    }

    /**
     * Get all support tickets (for admin)
     */
    getAllTickets() {
        return this.tickets;
    }

    /**
     * Get pending tickets count
     */
    getPendingTicketsCount() {
        return this.tickets.filter(ticket => ticket.status === 'pending').length;
    }

    /**
     * Get ticket by ID
     */
    getTicketById(ticketId) {
        return this.tickets.find(ticket => ticket.id === ticketId);
    }

    /**
     * Update ticket status
     */
    updateTicketStatus(ticketId, status) {
        const ticket = this.getTicketById(ticketId);
        if (ticket) {
            ticket.status = status;
            ticket.updatedAt = new Date().toISOString();
            Utils.safeSetItem('supportTickets', this.tickets);
        }
    }

    /**
     * Add admin response to ticket
     */
    addAdminResponse(ticketId, response) {
        const ticket = this.getTicketById(ticketId);
        if (ticket) {
            ticket.responses.push({
                id: Utils.generateUniqueId(),
                message: response,
                createdAt: new Date().toISOString(),
                isAdmin: true
            });
            ticket.status = 'in_progress';
            ticket.updatedAt = new Date().toISOString();
            Utils.safeSetItem('supportTickets', this.tickets);

            // Notify user about response
            this.notifyUser(ticket, response);
        }
    }

    /**
     * Notify user about admin response
     */
    notifyUser(ticket, response) {
        // Save user notification
        const userNotifications = Utils.safeGetItem(`userNotifications_${ticket.email}`, []);
        userNotifications.unshift({
            id: Utils.generateUniqueId(),
            type: 'admin_response',
            title: 'Ответ от администратора',
            message: `Тема: ${ticket.subject}\nОтвет: ${response.substring(0, 100)}${response.length > 100 ? '...' : ''}`,
            ticketId: ticket.id,
            createdAt: new Date().toISOString(),
            isRead: false
        });

        // Keep only last 20 notifications per user
        if (userNotifications.length > 20) {
            userNotifications.splice(20);
        }

        Utils.safeSetItem(`userNotifications_${ticket.email}`, userNotifications);
    }

    /**
     * Get user notifications
     */
    getUserNotifications(email) {
        return Utils.safeGetItem(`userNotifications_${email}`, []);
    }

    /**
     * Mark user notification as read
     */
    markUserNotificationAsRead(email, notificationId) {
        const notifications = this.getUserNotifications(email);
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.isRead = true;
            Utils.safeSetItem(`userNotifications_${email}`, notifications);
        }
    }

    /**
     * Get admin notifications
     */
    getAdminNotifications() {
        return Utils.safeGetItem('adminNotifications', []);
    }

    /**
     * Mark admin notification as read
     */
    markAdminNotificationAsRead(notificationId) {
        const notifications = this.getAdminNotifications();
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.isRead = true;
            Utils.safeSetItem('adminNotifications', notifications);
        }
    }

    /**
     * Clear admin notifications
     */
    clearAdminNotifications() {
        Utils.safeSetItem('adminNotifications', []);
    }

    /**
     * Get unread notifications count for user
     */
    getUserUnreadCount(email) {
        const notifications = this.getUserNotifications(email);
        return notifications.filter(n => !n.isRead).length;
    }

    /**
     * Get unread admin notifications count
     */
    getAdminUnreadCount() {
        const notifications = this.getAdminNotifications();
        return notifications.filter(n => !n.isRead).length;
    }

    /**
     * Handles support tickets and notifications
     */
    async submitTicket(ticket) {
        // Save ticket
        this.tickets.unshift({
            ...ticket,
            id: Utils.generateId(),
            status: 'open',
            createdAt: new Date().toISOString(),
            responses: []
        });

        // Keep only last 100 tickets
        if (this.tickets.length > 100) {
            this.tickets.splice(100);
        }

        Utils.safeSetItem('supportTickets', this.tickets);
        return ticket;
    }

    // Remove admin response methods
    async addResponse(ticketId, response) {
        const ticket = this.tickets.find(t => t.id === ticketId);
        if (!ticket) return null;

        ticket.responses.push({
            ...response,
            id: Utils.generateId(),
            createdAt: new Date().toISOString()
        });

        Utils.safeSetItem('supportTickets', this.tickets);
        return ticket;
    }

    // Remove admin notification methods
    getNotifications() {
        return this.notifications;
    }

    // Remove admin notification methods
    markNotificationAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            Utils.safeSetItem('notifications', this.notifications);
        }
    }

    // Remove admin notification methods
    clearNotifications() {
        this.notifications = [];
        Utils.safeSetItem('notifications', []);
    }

    // Remove admin notification methods
    getUnreadCount() {
        return this.notifications.filter(n => !n.read).length;
    }
} 