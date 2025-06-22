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

    async loadInitialGames() {
        try {
            const response = await fetch('games.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const games = await response.json();
            this.dataManager.games = games; // Сохраняем игры в DataManager
            this.renderGames(); // Отображаем игры
        } catch (error) {
            console.error('Error loading initial games:', error);
        }
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

    /**
     * Рендер карточек игр в стиле Microsoft Store
     */
    renderStoreGames(games) {
        const storeContainer = document.getElementById('games-store-container');
        if (!storeContainer) return;
        if (!games || games.length === 0) {
            storeContainer.innerHTML = `<div class="col-span-full text-center py-12 text-gray-400">Нет доступных игр</div>`;
            return;
        }
        storeContainer.innerHTML = games.map(game => `
            <div class="bg-[#23272f] rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-[#23272f] hover:border-blue-500 flex flex-col cursor-pointer group">
                <div class="relative w-full h-40 bg-[#181b20] flex items-center justify-center">
                    <img src="${game.image}" alt="${game.title}" class="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300">
                    ${game.badge ? `<span class='absolute top-2 left-2 bg-green-600 text-xs text-white px-2 py-1 rounded font-semibold'>${game.badge}</span>` : ''}
                </div>
                <div class="p-4 flex-1 flex flex-col">
                    <h3 class="text-lg font-bold text-white mb-1 truncate">${game.title}</h3>
                    <div class="text-xs text-gray-400 mb-2">${game.genre || ''}</div>
                    <div class="mt-auto flex items-center justify-between">
                        <span class="text-sm font-semibold text-gray-200">${game.price ? game.price : (game.isFree ? 'Бесплатно' : '')}</span>
                        ${game.isOwned ? `<span class='bg-gray-700 text-xs text-white px-2 py-1 rounded'>Приобретено</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Рендер большой карточки-карусели (только одна) с кнопками переключения
     */
    renderMainSliderCard(game) {
        const mainCard = document.getElementById('games-slider-main-card');
        if (!mainCard || !game) return;
        mainCard.innerHTML = `
            <div class="bg-[#181b20] rounded-2xl shadow-2xl overflow-hidden flex flex-col group cursor-pointer transition-all duration-300 h-[420px]">
                <div class="relative flex-1 overflow-hidden">
                    <button id="games-slider-prev" class="absolute top-1/2 left-4 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white shadow-lg transition opacity-0 group-hover:opacity-100"><i class="fas fa-chevron-left"></i></button>
                    <button id="games-slider-next" class="absolute top-1/2 right-4 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white shadow-lg transition opacity-0 group-hover:opacity-100"><i class="fas fa-chevron-right"></i></button>
                    <img src="${game.image}" alt="${game.title}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-300"/>
                </div>
                <div class="p-6 bg-[#181b20]">
                    <h3 class="text-3xl font-bold text-white">${game.title}</h3>
                </div>
            </div>
        `;
    }

    /**
     * Рендер трёх фиксированных маленьких карточек справа
     */
    renderSideSliderCards(games) {
        const sideCards = document.getElementById('games-slider-side-cards');
        if (!sideCards || !games || games.length < 3) return;
        sideCards.innerHTML = games.slice(0, 3).map(game => `
            <div class="relative h-[120px] bg-[#181b20] rounded-2xl shadow-lg overflow-hidden flex items-end group cursor-pointer transition-all duration-300">
                <img src="${game.image}" alt="${game.title}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-300"/>
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div class="relative z-10 p-4">
                    <h4 class="text-lg font-bold text-white drop-shadow-md">${game.title}</h4>
                </div>
            </div>
        `).join('');
    }

    /**
     * Рендер 8 карточек сеткой под слайдером
     */
    renderGamesGrid(games) {
        const grid = document.getElementById('games-grid-section');
        if (!grid || !games) return;
        grid.innerHTML = games.map(game => `
            <div class="bg-[#23272f] rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-transparent hover:border-blue-500 flex flex-col cursor-pointer group">
                <div class="relative w-full bg-[#181b20]">
                    <img src="${game.image}" alt="${game.title}" class="w-full h-auto">
                </div>
                <div class="p-4 flex-1 flex flex-col">
                    <h3 class="text-lg font-semibold text-white truncate mb-2">${game.title}</h3>
                    ${game.price ? `<div class="text-base font-bold text-white mt-auto">${game.price}</div>` : ''}
                </div>
            </div>
        `).join('');
    }
} 