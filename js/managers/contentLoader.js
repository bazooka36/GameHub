/**
 * Content Loader - Handles loading games and news content
 */

import { DataManager } from './dataManager.js';
import { Utils } from '../utils.js';

export class ContentLoader {
    constructor() {
        this.dataManager = window.gameHubDataManager || new DataManager();
        this.setupEventListeners();
    }

    async init() {
        console.log('ContentLoader initialized');
        
        await this.loadGames();
        await this.loadNews();
    }

    setupEventListeners() {
        // Слушаем изменения данных от админ панели
        window.addEventListener('dataChanged', () => {
            console.log('🔄 Данные изменены, обновляем контент...');
            this.refreshContent();
        });
    }

    async loadGames() {
        try {
            this.games = this.dataManager.getGames();
            this.renderGames();
        } catch (error) {
            console.error('Error loading games:', error);
            this.games = [];
            this.renderGames();
        }
    }

    async loadNews() {
        try {
            this.news = this.dataManager.getNews();
            this.renderNews();
        } catch (error) {
            console.error('Error loading news:', error);
            this.news = [];
            this.renderNews();
        }
    }

    renderGames() {
        const gamesContainer = document.getElementById('games-container');
        if (!gamesContainer) return;

        if (this.games.length === 0) {
            gamesContainer.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-gamepad text-6xl text-gray-600 mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-400 mb-2">Игры не найдены</h3>
                    <p class="text-gray-500">В данный момент нет доступных игр</p>
                </div>
            `;
            return;
        }

        gamesContainer.innerHTML = this.games.map(game => `
            <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl" role="listitem">
                <div class="relative mb-4">
                    <img src="${game.imageData || game.image || 'assets/default-game.jpg'}" alt="${game.title}" class="w-full h-48 object-cover rounded-lg">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg"></div>
                </div>
                <h3 class="text-xl font-bold text-white mb-3">${game.title}</h3>
                <p class="text-gray-300 mb-4 line-clamp-3">${game.description}</p>
                <div class="flex items-center justify-between mb-4">
                    <span class="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">${game.genre || 'Игра'}</span>
                    <span class="text-yellow-400 text-sm">★ ${game.rating || '4.5'}</span>
                </div>
                <div class="flex items-center justify-between text-sm text-gray-400 mb-4">
                    <span>Игроков: ${game.players || '1000+'}</span>
                    <span>Категория: ${game.category || 'Action'}</span>
                </div>
                <button class="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    <i class="fas fa-play mr-2" aria-hidden="true"></i>
                    Играть
                </button>
            </div>
        `).join('');
    }

    renderNews() {
        const newsContainer = document.getElementById('news-container');
        if (!newsContainer) return;

        if (this.news.length === 0) {
            newsContainer.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-newspaper text-6xl text-gray-600 mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-400 mb-2">Новости не найдены</h3>
                    <p class="text-gray-500">В данный момент нет доступных новостей</p>
                </div>
            `;
            return;
        }

        newsContainer.innerHTML = this.news.map(news => `
            <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl" role="listitem">
                <div class="relative mb-4">
                    <img src="${news.imageData || news.image || 'assets/default-news.jpg'}" alt="${news.title}" class="w-full h-48 object-cover rounded-lg">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg"></div>
                </div>
                <div class="flex items-center justify-between mb-4">
                    <span class="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">Новость</span>
                    <span class="text-gray-400 text-sm">${Utils.formatDate(news.date || news.createdAt)}</span>
                </div>
                <h3 class="text-xl font-bold text-white mb-3">${news.title}</h3>
                <p class="text-gray-300 mb-4 line-clamp-4">${news.content}</p>
                <div class="flex items-center justify-between">
                    <span class="text-gray-400 text-sm">Автор: ${news.author || 'Администратор'}</span>
                    <button class="text-blue-400 hover:text-blue-300 transition-colors duration-300">
                        <i class="fas fa-arrow-right" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    getGames() {
        return this.games;
    }

    getNews() {
        return this.news;
    }

    searchGames(query, filter = 'all') {
        return this.dataManager.searchGames(query, filter);
    }

    // Метод для обновления контента (вызывается после изменений в админ панели)
    refreshContent() {
        console.log('🔄 ContentLoader: обновление контента...');
        console.log('📊 Текущие данные:');
        console.log('  - Игр:', this.dataManager.getGames().length);
        console.log('  - Новостей:', this.dataManager.getNews().length);
        
        this.loadGames();
        this.loadNews();
        
        console.log('✅ ContentLoader: контент обновлен');
    }

    // Метод для получения DataManager
    getDataManager() {
        return this.dataManager;
    }
} 