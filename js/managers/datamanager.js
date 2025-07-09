/**
 * Data Manager - Единая система управления данными
 * Используется как в админ панели, так и на основном сайте.
 * В этой версии удалена зависимость от localStorage для подготовки к хостингу.
 * Данные хранятся только в памяти и сбрасываются при перезагрузке.
 */
export class DataManager {
    constructor() {
        this.users = [];
        this.games = [];
        this.news = [];
        this.supportTickets = [];
        console.log('DataManager: In-memory data store initialized.');
    }

    loadData() {
        // Данные хранятся только в памяти, загрузка из хранилища не требуется.
    }

    saveData() {
        // Данные хранятся только в памяти, сохранение в хранилище не требуется.
        // Уведомляем другие части приложения об изменении данных
        this.notifyDataChange();
    }

    // Уведомление об изменении данных
    notifyDataChange() {
        // Отправляем событие для обновления контента на главной странице
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('dataChanged', {
                detail: { timestamp: Date.now() }
            }));
        }
    }

    // Методы для работы с пользователями
    getUsers() {
        return this.users;
    }

    getUserById(id) {
        return this.users.find(user => user.id === id);
    }

    addUser(user) {
        user.id = Date.now().toString();
        user.createdAt = new Date().toISOString();
        user.status = 'active';
        this.users.push(user);
        this.saveData();
        return user;
    }

    updateUser(id, updates) {
        const userIndex = this.users.findIndex(user => user.id === id);
        if (userIndex !== -1) {
            this.users[userIndex] = { ...this.users[userIndex], ...updates };
            this.saveData();
            return true;
        }
        return false;
    }

    deleteUser(id) {
        const userIndex = this.users.findIndex(user => user.id === id);
        if (userIndex !== -1) {
            this.users.splice(userIndex, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    // Методы для работы с играми
    getGames() {
        return this.games;
    }

    getGameById(id) {
        return this.games.find(game => game.id === id);
    }

    addGame(game) {
        game.id = Date.now().toString();
        game.createdAt = new Date().toISOString();
        this.games.push(game);
        this.saveData();
        return game;
    }

    updateGame(id, updates) {
        const gameIndex = this.games.findIndex(game => game.id === id);
        if (gameIndex !== -1) {
            this.games[gameIndex] = { ...this.games[gameIndex], ...updates };
            this.saveData();
            return true;
        }
        return false;
    }

    deleteGame(id) {
        console.log('🗑️ Удаление игры с ID:', id);
        console.log('📋 Текущие игры:', this.games.map(g => ({ id: g.id, title: g.title })));

        const gameIndex = this.games.findIndex(game => game.id === id);
        console.log('🔍 Найденный индекс:', gameIndex);

        if (gameIndex !== -1) {
            this.games.splice(gameIndex, 1);
            this.saveData();
            console.log('✅ Игра удалена, осталось игр:', this.games.length);
            return true;
        }
        console.log('❌ Игра не найдена');
        return false;
    }

    // Функция для преобразования текста между русской и английской раскладкой
    switchKeyboardLayout(str) {
        const en = 'qwertyuiop[]asdfghjkl;zxcvbnm,.';
        const ru = 'йцукенгшщзхъфывапролджэячсмитьбю';
        let result = '';
        for (let char of str) {
            const lowerChar = char.toLowerCase();
            let idx = en.indexOf(lowerChar);
            if (idx !== -1) {
                result += ru[idx];
            } else {
                idx = ru.indexOf(lowerChar);
                if (idx !== -1) {
                    result += en[idx];
                } else {
                    result += char;
                }
            }
        }
        return result;
    }

    searchGames(query, filter = 'all') {
        if (!query) return this.games;
        const lowerQuery = query.toLowerCase();
        const altQuery = this.switchKeyboardLayout(lowerQuery);
        return this.games.filter(game => {
            const title = (game.title || '').toLowerCase();
            const desc = (game.description || '').toLowerCase();
            const titleAlt = this.switchKeyboardLayout(title);
            const descAlt = this.switchKeyboardLayout(desc);
            return (
                title.includes(lowerQuery) ||
                desc.includes(lowerQuery) ||
                title.includes(altQuery) ||
                desc.includes(altQuery) ||
                titleAlt.includes(lowerQuery) ||
                descAlt.includes(lowerQuery)
            );
        });
    }

    // Методы для работы с новостями
    getNews() {
        return this.news;
    }

    getNewsById(id) {
        return this.news.find(news => news.id === id);
    }

    addNews(newsItem) {
        newsItem.id = Date.now().toString();
        newsItem.createdAt = new Date().toISOString();
        newsItem.author = newsItem.author || 'admin';
        this.news.push(newsItem);
        this.saveData();
        return newsItem;
    }

    updateNews(id, updates) {
        const newsIndex = this.news.findIndex(item => item.id === id);
        if (newsIndex !== -1) {
            this.news[newsIndex] = { ...this.news[newsIndex], ...updates };
            this.saveData();
            return true;
        }
        return false;
    }

    deleteNews(id) {
        console.log('🗑️ Удаление новости с ID:', id);
        console.log('📋 Текущие новости:', this.news.map(n => ({ id: n.id, title: n.title })));

        const newsIndex = this.news.findIndex(news => news.id === id);
        console.log('🔍 Найденный индекс:', newsIndex);

        if (newsIndex !== -1) {
            this.news.splice(newsIndex, 1);
            this.saveData();
            console.log('✅ Новость удалена, осталось новостей:', this.news.length);
            return true;
        }
        console.log('❌ Новость не найдена');
        return false;
    }

    // Методы для работы с поддержкой
    getSupportTickets() {
        return this.supportTickets;
    }

    getSupportTicketById(id) {
        return this.supportTickets.find(ticket => ticket.id === id);
    }

    addSupportTicket(ticket) {
        ticket.id = Date.now().toString();
        ticket.createdAt = new Date().toISOString();
        ticket.status = 'open';
        ticket.responses = [];
        this.supportTickets.push(ticket);
        this.saveData();
        return ticket;
    }

    addSupportResponse(ticketId, response) {
        const ticket = this.supportTickets.find(t => t.id === ticketId);
        if (ticket) {
            if (!ticket.responses) ticket.responses = [];
            ticket.responses.push({
                id: Date.now().toString(),
                message: response,
                isAdmin: true,
                createdAt: new Date().toISOString()
            });
            ticket.status = 'resolved';
            this.saveData();
            return true;
        }
        return false;
    }

    updateTicketStatus(ticketId, status) {
        const ticket = this.supportTickets.find(t => t.id === ticketId);
        if (ticket) {
            ticket.status = status;
            this.saveData();
            return true;
        }
        return false;
    }

    // Методы для статистики
    getStats() {
        return {
            totalUsers: this.users.length,
            activeUsers: this.users.filter(u => u.status !== 'blocked').length,
            blockedUsers: this.users.filter(u => u.status === 'blocked').length,
            totalGames: this.games.length,
            totalNews: this.news.length,
            openTickets: this.supportTickets.filter(t => t.status === 'open').length,
            resolvedTickets: this.supportTickets.filter(t => t.status === 'resolved').length
        };
    }

    // Метод для очистки данных удален, т.к. данные и так сбрасываются при перезагрузке
}