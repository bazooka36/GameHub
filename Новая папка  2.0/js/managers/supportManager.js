/**
 * Support Manager - Handles support ticket functionality
 */

export class SupportManager {
    constructor() {
        this.supportTickets = [];
    }

    async init() {
        console.log('SupportManager initialized');
        this.loadSupportTickets();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Support form submission
        const submitSupportBtn = document.getElementById('submit-support-ticket');
        if (submitSupportBtn) {
            submitSupportBtn.addEventListener('click', (e) => this.handleSupportSubmit(e));
        }

        // Support form inputs
        const supportEmail = document.getElementById('support-email');
        const supportSubject = document.getElementById('support-subject');
        const supportMessage = document.getElementById('support-message');

        if (supportEmail) {
            supportEmail.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSupportSubmit(e);
                }
            });
        }

        if (supportSubject) {
            supportSubject.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSupportSubmit(e);
                }
            });
        }

        if (supportMessage) {
            supportMessage.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.handleSupportSubmit(e);
                }
            });
        }
    }

    async handleSupportSubmit(e) {
        e.preventDefault();

        const email = document.getElementById('support-email')?.value.trim();
        const subject = document.getElementById('support-subject')?.value.trim();
        const message = document.getElementById('support-message')?.value.trim();

        // Validation
        if (!email || !subject || !message) {
            this.showSupportMessage('Пожалуйста, заполните все поля', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showSupportMessage('Пожалуйста, введите корректный email', 'error');
            return;
        }

        if (message.length < 10) {
            this.showSupportMessage('Сообщение должно содержать минимум 10 символов', 'error');
            return;
        }

        try {
            // Create support ticket
            const ticket = {
                id: Date.now(),
                email: email,
                subject: subject,
                message: message,
                status: 'pending',
                createdAt: new Date().toISOString(),
                ticketNumber: this.generateTicketNumber()
            };

            // Add to tickets list
            this.supportTickets.push(ticket);
            this.saveSupportTickets();

            // Clear form
            this.clearSupportForm();

            // Show success message
            this.showSupportMessage(`Заявка #${ticket.ticketNumber} отправлена успешно!`, 'success');

            // Simulate email sending
            await this.simulateEmailSending(ticket);

        } catch (error) {
            console.error('Error submitting support ticket:', error);
            this.showSupportMessage('Ошибка отправки заявки. Попробуйте позже.', 'error');
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    generateTicketNumber() {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `GH${timestamp.slice(-6)}${random}`;
    }

    async simulateEmailSending(ticket) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Support ticket sent:', ticket);
        
        // In a real app, this would send an email to support team
        // and send confirmation email to user
    }

    clearSupportForm() {
        const email = document.getElementById('support-email');
        const subject = document.getElementById('support-subject');
        const message = document.getElementById('support-message');

        if (email) email.value = '';
        if (subject) subject.value = '';
        if (message) message.value = '';
    }

    showSupportMessage(message, type = 'info') {
        // This would typically show a toast notification
        // For now, we'll use console.log
        console.log(`Support ${type}:`, message);
        
        // You can integrate with toastManager here
        if (window.toastManager) {
            switch (type) {
                case 'success':
                    window.toastManager.success(message);
                    break;
                case 'error':
                    window.toastManager.error(message);
                    break;
                default:
                    window.toastManager.info(message);
            }
        }
    }

    loadSupportTickets() {
        const ticketsData = localStorage.getItem('gamehub_support_tickets');
        if (ticketsData) {
            this.supportTickets = JSON.parse(ticketsData);
        }
    }

    saveSupportTickets() {
        localStorage.setItem('gamehub_support_tickets', JSON.stringify(this.supportTickets));
    }

    getSupportTickets() {
        return this.supportTickets;
    }

    getTicketById(id) {
        return this.supportTickets.find(ticket => ticket.id === id);
    }

    updateTicketStatus(id, status) {
        const ticket = this.getTicketById(id);
        if (ticket) {
            ticket.status = status;
            ticket.updatedAt = new Date().toISOString();
            this.saveSupportTickets();
        }
    }

    deleteTicket(id) {
        this.supportTickets = this.supportTickets.filter(ticket => ticket.id !== id);
        this.saveSupportTickets();
    }
} 