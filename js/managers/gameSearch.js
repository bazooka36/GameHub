/**
 * Game Search - Handles game search functionality
 */

export class GameSearch {
    constructor() {
        this.searchTimeout = null;
        this.headerSearchInput = document.getElementById('header-game-search');
        this.headerResultsContainer = document.getElementById('header-search-results');
        this.headerDebounceTimer = null;
    }

    init() {
        console.log('GameSearch initialized');
        this.setupEventListeners();
        this.setupHeaderEventListeners();
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

    setupHeaderEventListeners() {
        if (!this.headerSearchInput || !this.headerResultsContainer) {
            return;
        }

        this.headerSearchInput.addEventListener('input', () => {
            clearTimeout(this.headerDebounceTimer);
            this.headerDebounceTimer = setTimeout(() => {
                const query = this.headerSearchInput.value.trim();
                if (query.length > 1) {
                    this.performHeaderSearch(query);
                } else {
                    this.clearHeaderSearchResults();
                }
            }, 300);
        });

        this.headerSearchInput.addEventListener('focus', () => {
            if (this.headerSearchInput.value.trim().length > 1 && this.headerResultsContainer.innerHTML.trim() !== '') {
                this.headerResultsContainer.classList.remove('hidden');
            }
        });

        document.addEventListener('click', (event) => {
            if (!this.headerSearchInput.contains(event.target) && !this.headerResultsContainer.contains(event.target)) {
                this.headerResultsContainer.classList.add('hidden');
            }
        });
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

    async performHeaderSearch(query) {
        try {
            const results = await window.gameHubDataManager.searchGames(query);
            this.displayHeaderSearchResults(results);
        } catch (error) {
            console.error('Header search failed:', error);
            this.headerResultsContainer.innerHTML = '<p class="text-red-500 p-4">Ошибка поиска.</p>';
            this.headerResultsContainer.classList.remove('hidden');
        }
    }

    displayHeaderSearchResults(games) {
        this.clearHeaderSearchResults(true);

        if (!games || games.length === 0) {
            this.headerResultsContainer.innerHTML = '<p class="text-gray-400 p-4">Ничего не найдено.</p>';
        } else {
            const content = games.map(game => this.createSearchResultItem(game)).join('');
            this.headerResultsContainer.innerHTML = content;
        }
        this.headerResultsContainer.classList.remove('hidden');
    }

    createSearchResultItem(game) {
        return `
            <a href="#" class="search-result-item" data-game-id="${game.id}">
                <img src="${game.image || 'https://via.placeholder.com/48'}" alt="${game.title}">
                <div class="search-result-info">
                    <h4>${game.title}</h4>
                    <p>${game.genre || 'Игра'}</p>
                </div>
            </a>
        `;
    }

    clearHeaderSearchResults(keepVisible = false) {
        if (this.headerResultsContainer) {
            this.headerResultsContainer.innerHTML = '';
            if (!keepVisible) {
                this.headerResultsContainer.classList.add('hidden');
            }
        }
    }
} 