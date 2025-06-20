/**
 * Data Manager - Единая система управления данными
 * Используется как в админ панели, так и на основном сайте
 */

export class DataManager {
    constructor() {
        this.users = [];
        this.games = [];
        this.news = [];
        this.supportTickets = [];
        this.loadData();
    }

    loadData() {
        this.users = this.safeGetItem('users', []);
        this.games = this.safeGetItem('games', []);
        this.news = this.safeGetItem('news', []);
        this.supportTickets = this.safeGetItem('supportTickets', []);
    }

    saveData() {
        this.safeSetItem('users', this.users);
        this.safeSetItem('games', this.games);
        this.safeSetItem('news', this.news);
        this.safeSetItem('supportTickets', this.supportTickets);

        // Уведомляем другие части приложения об изменении данных
        this.notifyDataChange();
    }

    // Утилиты для безопасной работы с localStorage
    safeGetItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error getting item from localStorage:', error);
            return defaultValue;
        }
    }

    safeSetItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error setting item to localStorage:', error);
        }
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

    // Методы для инициализации тестовых данных
    initializeTestData() {
        console.log('🔄 Инициализация тестовых данных...');
        
        // Всегда устанавливаем новые данные (перезаписываем старые)
        this.games = [
            {
                id: '1',
                title: 'Cyberpunk 2077',
                description: 'Футуристическая RPG игра в мире киберпанка',
                genre: 'RPG',
                category: 'action',
                rating: 4.5,
                releaseDate: '2020-12-10',
                developer: 'CD Projekt Red',
                publisher: 'CD Projekt',
                platform: 'PC, PS4, PS5, Xbox',
                price: 59.99,
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMWUyOTNiIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNmZmZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DeWJlcnB1bmsgMjA3NzwvdGV4dD4KPC9zdmc+',
                tags: ['cyberpunk', 'rpg', 'open-world', 'futuristic']
            },
            {
                id: '2',
                title: 'The Witcher 3',
                description: 'Эпическая RPG игра в фэнтезийном мире',
                genre: 'RPG',
                category: 'adventure',
                rating: 4.8,
                releaseDate: '2015-05-19',
                developer: 'CD Projekt Red',
                publisher: 'CD Projekt',
                platform: 'PC, PS4, PS5, Xbox, Switch',
                price: 39.99,
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMWUyOTNiIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNmZmZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5UaGUgV2l0Y2hlciAzPC90ZXh0Pgo8L3N2Zz4=',
                tags: ['fantasy', 'rpg', 'open-world', 'medieval']
            }
        ];
    
        this.news = [
            {
                id: '1',
                title: 'Новый патч для Cyberpunk 2077',
                content: 'Вышел крупный обновление для Cyberpunk 2077 с множеством исправлений и новых функций.',
                author: 'GameHub Team',
                publishDate: '2024-01-15',
                category: 'updates',
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMWUyOTNiIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNmZmZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5OZXdzPC90ZXh0Pgo8L3N2Zz4=',
                tags: ['cyberpunk', 'update', 'patch']
            },
            {
                id: '2',
                title: 'The Witcher 4 в разработке',
                content: 'CD Projekt Red официально анонсировала разработку The Witcher 4. Игра будет использовать новый движок Unreal Engine 5.',
                author: 'GameHub Team',
                publishDate: '2024-01-10',
                category: 'announcements',
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMWUyOTNiIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNmZmZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5OZXdzPC90ZXh0Pgo8L3N2Zz4=',
                tags: ['witcher', 'announcement', 'unreal-engine']
            }
        ];
    
        // Сохраняем данные в localStorage
        this.saveData();
        
        console.log('✅ Тестовые данные инициализированы');
        console.log(`📊 Загружено: ${this.games.length} игр, ${this.news.length} новостей`);
    }
}