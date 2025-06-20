/**
 * Game Search - Handles game search functionality
 */

export class GameSearch {
    constructor() {
        this.searchTimeout = null;
    }

    init() {
        console.log('GameSearch initialized');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('game-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearchInput(e));
        }

        // Clear search
        const clearSearchBtn = document.getElementById('clear-search');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => this.clearSearch());
        }
    }

    handleSearchInput(e) {
        const query = e.target.value.trim();
        
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Set new timeout for debounced search
        this.searchTimeout = setTimeout(() => {
            if (query.length >= 2) {
                this.performSearch();
            } else if (query.length === 0) {
                this.clearSearch();
            }
        }, 300);
    }

    performSearch() {
        const searchInput = document.getElementById('game-search');
        const query = searchInput ? searchInput.value.trim() : '';

        // Get games from content loader
        const contentLoader = window.gameHubApp?.getManager('content');
        if (!contentLoader) {
            console.error('ContentLoader not available');
            return;
        }

        const games = contentLoader.searchGames(query);
        this.displaySearchResults(games, query);
    }

    displaySearchResults(games, query) {
        const resultsContainer = document.getElementById('search-results');
        const resultsList = document.getElementById('search-results-container');
        
        if (!resultsContainer || !resultsList) return;

        if (games.length === 0) {
            resultsList.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <i class="fas fa-search text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-600 text-lg">Игры не найдены</p>
                    <p class="text-gray-500 text-sm">В данный момент нет доступных игр</p>
                </div>
            `;
        } else {
            resultsList.innerHTML = games.map(game => `
                <div class="game-result bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition duration-300">
                    <div class="relative">
                        <img src="${game.image}" alt="${game.title}" class="w-full h-32 object-cover">
                        <div class="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                            ${game.genre}
                        </div>
                        <div class="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                            ⭐ ${game.rating}
                        </div>
                    </div>
                    <div class="p-3">
                        <h4 class="text-gray-900 font-bold text-sm mb-1">${game.title}</h4>
                        <p class="text-gray-600 text-xs mb-2">${game.description}</p>
                        <div class="flex justify-between items-center">
                            <span class="text-green-600 font-bold text-sm">${game.price}</span>
                            <button class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition">
                                Подробнее
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Show results section
        resultsContainer.classList.remove('hidden');
    }

    clearSearch() {
        const searchInput = document.getElementById('game-search');
        const resultsContainer = document.getElementById('search-results');
        
        if (searchInput) {
            searchInput.value = '';
        }
        
        if (resultsContainer) {
            resultsContainer.classList.add('hidden');
        }
    }
} 