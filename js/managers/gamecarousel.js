/**
 * Game Carousel Manager - Управляет каруселью игр с анимациями
 */

export class GameCarousel {
    constructor() {
        this.currentIndex = 0;
        this.games = [];
        this.isAnimating = false;
        this.autoSlideInterval = null;
        this.autoSlideDelay = 6000; // 6 секунд
        this.isAutoSlideEnabled = true;
    }

    init() {
        console.log('🎠 GameCarousel инициализирован');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Останавливаем авто-переключение при наведении мыши
        const mainCard = document.getElementById('games-slider-main-card');
        if (mainCard) {
            mainCard.addEventListener('mouseenter', () => this.pauseAutoSlide());
            mainCard.addEventListener('mouseleave', () => this.resumeAutoSlide());
        }

        // Обработка клавиш
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.previousSlide();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.nextSlide();
            }
        });

        // Обработка кликов мышью на карусели
        document.addEventListener('click', (e) => {
            const mainCard = document.getElementById('games-slider-main-card');
            if (mainCard && mainCard.contains(e.target)) {
                // Проверяем, кликнули ли на индикатор авто-переключения
                if (e.target.closest('.auto-slide-indicator')) {
                    this.toggleAutoSlide();
                    return;
                }

                // Если кликнули на кнопки или индикаторы, не обрабатываем
                if (e.target.closest('.carousel-btn') || e.target.closest('.carousel-indicator')) {
                    return;
                }

                // Определяем, в какой части карточки был клик
                const rect = mainCard.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const cardWidth = rect.width;
                
                // Если клик в левой трети - предыдущий слайд
                if (clickX < cardWidth / 3) {
                    this.previousSlide();
                }
                // Если клик в правой трети - следующий слайд
                else if (clickX > (cardWidth * 2) / 3) {
                    this.nextSlide();
                }
                // Средняя треть - ничего не делаем (можно добавить действие по умолчанию)
            }
        });
    }

    setGames(games) {
        this.games = games;
        this.currentIndex = 0;
        this.renderCarousel();
        this.startAutoSlide();
    }

    renderCarousel() {
        if (!this.games || this.games.length === 0) return;

        const mainCard = document.getElementById('games-slider-main-card');
        if (!mainCard) return;

        const gameImagesHTML = this.games.map((game, index) => {
            const isActive = index === 0;
            return `<img src="${game.image}" alt="${game.title}" class="carousel-image absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0'}" data-index="${index}" />`;
        }).join('');

        const initialGame = this.games[0];

        mainCard.innerHTML = `
            <div class="bg-[#181b20] rounded-2xl shadow-2xl overflow-hidden flex flex-col group h-[420px] relative carousel-container">
                <div class="relative flex-1 overflow-hidden">
                    ${gameImagesHTML}
                    <button id="games-slider-prev" class="carousel-btn absolute top-1/2 left-4 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white shadow-lg transition opacity-0 group-hover:opacity-100" aria-label="Предыдущая игра">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button id="games-slider-next" class="carousel-btn absolute top-1/2 right-4 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white shadow-lg transition opacity-0 group-hover:opacity-100" aria-label="Следующая игра">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                <div class="p-6 bg-[#181b20]">
                    <h3 id="carousel-game-title" class="text-3xl font-bold text-white transition-opacity duration-300">${initialGame.title}</h3>
                </div>
                <div id="carousel-indicators-container" class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
                    ${this.games.map((_, index) => `<button class="carousel-indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></button>`).join('')}
                </div>
                <div class="absolute top-4 right-4 z-30">
                    <div class="auto-slide-indicator flex items-center space-x-2 bg-black/50 rounded-full px-3 py-1 cursor-pointer hover:bg-black/70 transition-colors" title="Переключить авто-переключение">
                        <div class="w-2 h-2 rounded-full ${this.isAutoSlideEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}"></div>
                        <span class="text-xs text-white">Авто</span>
                    </div>
                </div>
            </div>
        `;

        this.renderSideSliderCards();
        this.renderGamesGrid();
        this.setupCarouselButtons();
    }

    renderSideSliderCards() {
        const sideCards = document.getElementById('games-slider-side-cards');
        if (!sideCards || this.games.length < 3) return;

        sideCards.innerHTML = this.games.slice(0, 3).map(game => `
            <div class="relative h-[120px] bg-[#181b20] rounded-2xl shadow-lg overflow-hidden flex items-end group cursor-pointer transition-all duration-300">
                <img src="${game.image}" alt="${game.title}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-300"/>
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div class="relative z-10 p-4">
                    <h4 class="text-lg font-bold text-white drop-shadow-md">${game.title}</h4>
                </div>
            </div>
        `).join('');
    }

    renderGamesGrid() {
        const grid = document.getElementById('games-grid-section');
        if (!grid) return;

        grid.innerHTML = this.games.map(game => `
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

    setupCarouselButtons() {
        const prevBtn = document.getElementById('games-slider-prev');
        const nextBtn = document.getElementById('games-slider-next');
        const indicators = document.querySelectorAll('.carousel-indicator');

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.previousSlide();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.nextSlide();
            });
        }

        indicators.forEach(indicator => {
            indicator.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(indicator.dataset.index);
                this.goToSlide(index);
            });
        });
    }

    async changeSlide(newIndex) {
        if (this.isAnimating || newIndex === this.currentIndex) return;
        this.isAnimating = true;

        const oldIndex = this.currentIndex;
        const images = document.querySelectorAll('.carousel-image');
        const titleElement = document.getElementById('carousel-game-title');

        images[oldIndex].classList.remove('opacity-100');
        images[oldIndex].classList.add('opacity-0');
        
        images[newIndex].classList.remove('opacity-0');
        images[newIndex].classList.add('opacity-100');
        
        titleElement.style.opacity = '0';

        await this.wait(250);
        titleElement.textContent = this.games[newIndex].title;
        titleElement.style.opacity = '1';

        this.currentIndex = newIndex;
        this.updateIndicators();
        
        await this.wait(250);
        this.isAnimating = false;
        this.resetAutoSlide();
    }

    async previousSlide() {
        const newIndex = (this.currentIndex - 1 + this.games.length) % this.games.length;
        this.changeSlide(newIndex);
    }

    async nextSlide() {
        const newIndex = (this.currentIndex + 1) % this.games.length;
        this.changeSlide(newIndex);
    }

    async goToSlide(index) {
        this.changeSlide(index);
    }

    updateIndicators() {
        const indicators = document.querySelectorAll('#carousel-indicators-container .carousel-indicator');
        indicators.forEach((indicator, idx) => {
            indicator.classList.toggle('active', idx === this.currentIndex);
        });
    }

    startAutoSlide() {
        if (!this.isAutoSlideEnabled) return;
        
        this.stopAutoSlide();
        this.autoSlideInterval = setInterval(() => {
            if (!this.isAnimating) {
                this.nextSlide();
                // Добавляем визуальную индикацию авто-переключения
                const mainCard = document.getElementById('games-slider-main-card');
                if (mainCard) {
                    mainCard.classList.add('auto-slide-active');
                    setTimeout(() => {
                        mainCard.classList.remove('auto-slide-active');
                    }, 300);
                }
            }
        }, this.autoSlideDelay);
    }

    stopAutoSlide() {
        if (this.autoSlideInterval) {
            clearInterval(this.autoSlideInterval);
            this.autoSlideInterval = null;
        }
    }

    pauseAutoSlide() {
        this.stopAutoSlide();
    }

    resumeAutoSlide() {
        if (this.isAutoSlideEnabled) {
            this.startAutoSlide();
        }
    }

    resetAutoSlide() {
        this.stopAutoSlide();
        this.startAutoSlide();
    }

    setAutoSlideEnabled(enabled) {
        this.isAutoSlideEnabled = enabled;
        if (enabled) {
            this.startAutoSlide();
        } else {
            this.stopAutoSlide();
        }
    }

    setAutoSlideDelay(delay) {
        this.autoSlideDelay = delay;
        if (this.isAutoSlideEnabled) {
            this.resetAutoSlide();
        }
    }

    toggleAutoSlide() {
        this.isAutoSlideEnabled = !this.isAutoSlideEnabled;
        if (this.isAutoSlideEnabled) {
            this.startAutoSlide();
        } else {
            this.stopAutoSlide();
        }
        // Обновляем индикатор
        this.updateAutoSlideIndicator();
    }

    updateAutoSlideIndicator() {
        const indicator = document.querySelector('.auto-slide-indicator .w-2');
        if (indicator) {
            if (this.isAutoSlideEnabled) {
                indicator.className = 'w-2 h-2 rounded-full bg-green-400 animate-pulse';
            } else {
                indicator.className = 'w-2 h-2 rounded-full bg-gray-400';
            }
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    destroy() {
        this.stopAutoSlide();
        this.games = [];
        this.currentIndex = 0;
        this.isAnimating = false;
    }
} 