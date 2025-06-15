/**
 * Content Loader - Handles loading games and news content
 */

export class ContentLoader {
    constructor() {
        this.games = [];
        this.news = [];
    }

    async init() {
        console.log('ContentLoader initialized');
        await this.loadGames();
        await this.loadNews();
    }

    async loadGames() {
        try {
            // Empty games data
            this.games = [];
            this.renderGames();
        } catch (error) {
            console.error('Error loading games:', error);
        }
    }

    async loadNews() {
        try {
            // Empty news data
            this.news = [];
            this.renderNews();
        } catch (error) {
            console.error('Error loading news:', error);
        }
    }

    renderGames() {
        const gamesContainer = document.getElementById('games-container');
        if (!gamesContainer) return;

        gamesContainer.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-gamepad text-6xl text-gray-600 mb-4"></i>
                <h3 class="text-xl font-bold text-gray-400 mb-2">Игры не найдены</h3>
                <p class="text-gray-500">В данный момент нет доступных игр</p>
            </div>
        `;
    }

    renderNews() {
        const newsContainer = document.getElementById('news-container');
        if (!newsContainer) return;

        newsContainer.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-newspaper text-6xl text-gray-600 mb-4"></i>
                <h3 class="text-xl font-bold text-gray-400 mb-2">Новости не найдены</h3>
                <p class="text-gray-500">В данный момент нет доступных новостей</p>
            </div>
        `;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getGames() {
        return this.games;
    }

    getNews() {
        return this.news;
    }

    searchGames(query, filter = 'all') {
        return [];
    }
} 