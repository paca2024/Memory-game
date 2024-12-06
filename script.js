class MemoryGame {
    constructor() {
        // Game elements
        this.gameBoard = document.querySelector('.game-board');
        this.movesDisplay = document.getElementById('moves');
        this.timerDisplay = document.getElementById('timer');
        this.levelDisplay = document.getElementById('current-level');
        
        // Login elements
        this.loginScreen = document.getElementById('login-screen');
        this.gameContainer = document.getElementById('game-container');
        this.userIdInput = document.getElementById('user-id');
        this.startGameButton = document.getElementById('start-game');
        this.loginError = document.getElementById('login-error');
        
        // Buttons
        this.restartButton = document.getElementById('restart');
        this.logoutButton = document.getElementById('logout');
        
        // Game state
        this.cards = [];
        this.flippedCards = [];
        this.moves = 0;
        this.isLocked = false;
        this.gameStarted = false;
        this.timerInterval = null;
        this.timeLeft = 15;
        this.currentLevel = 1;
        this.currentUser = null;
        this.matchedPairs = 0;
        this.isProcessing = false;

        // Level configurations
        this.levels = {
            1: { pairs: 6, time: 35 },    // 12 cards - 3x4 grid
            2: { pairs: 8, time: 55 },    // 16 cards - 4x4 grid
            3: { pairs: 10, time: 75 },   // 20 cards - 4x5 grid
            4: { pairs: 12, time: 90 },   // 24 cards - 4x6 grid
            5: { pairs: 15, time: 120 },  // 30 cards - 5x6 grid
            6: { pairs: 18, time: 150 }   // 36 cards - 6x6 grid
        };

        // Crypto symbols for all levels
        this.symbols = [
            '<img src="https://na-703498136.imgix.net/alsui.ico" class="card-icon" alt="ALSUI">',
            '<img src="https://na-703498136.imgix.net/btc.png" class="card-icon" alt="BTC">',
            '<img src="https://na-703498136.imgix.net/eth.png" class="card-icon" alt="ETH">',
            '<img src="https://na-703498136.imgix.net/poly.png" class="card-icon" alt="POLY">',
            '<img src="https://na-703498136.imgix.net/sui.png" class="card-icon" alt="SUI">',
            '<img src="https://na-703498136.imgix.net/solana.png" class="card-icon" alt="SOLANA">',
            '<img src="https://na-703498136.imgix.net/rabby.png" class="card-icon" alt="RABBY">',
            '<img src="https://na-703498136.imgix.net/tether.png" class="card-icon" alt="TETHER">',
            '<img src="https://na-703498136.imgix.net/bnb.png" class="card-icon" alt="BNB">',
            '<img src="https://na-703498136.imgix.net/paca.png" class="card-icon" alt="PACA">',
            '<img src="https://na-703498136.imgix.net/swapx.png" class="card-icon" alt="SWAPX">',
            '<img src="https://na-703498136.imgix.net/diamond%20hand.png" class="card-icon" alt="DIAMOND-HANDS">',
            '<img src="https://na-703498136.imgix.net/doge.png" class="card-icon" alt="DOGE">',
            '<img src="https://na-703498136.imgix.net/dai.png" class="card-icon" alt="DAI">',
            '<img src="https://na-703498136.imgix.net/register.png" class="card-icon" alt="REGISTER">',
            '<img src="https://na-703498136.imgix.net/xrp.png" class="card-icon" alt="XRP">',
            '<img src="https://na-703498136.imgix.net/sonic.png" class="card-icon" alt="SONIC">',
            '<img src="https://na-703498136.imgix.net/aero.png" class="card-icon" alt="AERO">'
        ];

        // Initialize handlers
        this.initializeLogin();
    }

    initializeLogin() {
        if (!this.startGameButton || !this.userIdInput) {
            console.error('Login elements not found');
            return;
        }

        this.startGameButton.addEventListener('click', () => {
            const userId = this.userIdInput.value.trim();
            if (this.validateUserId(userId)) {
                this.currentUser = userId;
                this.loginScreen.style.display = 'none';
                this.gameContainer.style.display = 'block';
                this.init();
            }
        });

        this.userIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.startGameButton.click();
            }
        });

        if (this.logoutButton) {
            this.logoutButton.addEventListener('click', () => {
                this.currentUser = null;
                this.userIdInput.value = '';
                this.loginScreen.style.display = 'block';
                this.gameContainer.style.display = 'none';
                clearInterval(this.timerInterval);
            });
        }
    }

    validateUserId(userId) {
        if (!userId) {
            this.showLoginError('Please enter a User ID');
            return false;
        }
        if (userId.length < 3) {
            this.showLoginError('User ID must be at least 3 characters');
            return false;
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
            this.showLoginError('User ID can only contain letters, numbers, underscores, and hyphens');
            return false;
        }
        return true;
    }

    showLoginError(message) {
        this.loginError.textContent = message;
        this.loginError.classList.add('show');
        setTimeout(() => {
            this.loginError.classList.remove('show');
        }, 3000);
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    init() {
        // Clear the game board
        this.gameBoard.innerHTML = '';
        this.cards = [];
        this.flippedCards = [];
        this.moves = 0;
        this.isLocked = false;
        this.gameStarted = false;
        clearInterval(this.timerInterval);

        // Update displays
        this.movesDisplay.textContent = this.moves;
        this.levelDisplay.textContent = this.currentLevel;

        // Get level configuration and set timer
        const levelConfig = this.levels[this.currentLevel];
        this.timeLeft = levelConfig.time;
        this.timerDisplay.textContent = this.timeLeft;

        // Create pairs of cards
        const levelSymbols = this.symbols.slice(0, levelConfig.pairs);
        const cardSymbols = [...levelSymbols, ...levelSymbols];
        const shuffledCards = this.shuffleArray(cardSymbols);

        // Create and add cards to the board
        shuffledCards.forEach(symbol => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-front"></div>
                    <div class="card-back">
                        ${symbol}
                    </div>
                </div>
            `;
            card.addEventListener('click', () => this.handleCardClick(card));
            this.gameBoard.appendChild(card);
            this.cards.push(card);
        });

        // Set grid layout
        const columns = Math.ceil(Math.sqrt(levelConfig.pairs * 2));
        this.gameBoard.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    }

    handleCardClick(card) {
        if (this.isLocked || card.classList.contains('matched') || this.flippedCards.includes(card)) {
            return;
        }

        if (!this.gameStarted) {
            this.startTimer();
            this.gameStarted = true;
        }

        card.classList.add('flipped');
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.moves++;
            this.movesDisplay.textContent = this.moves;
            this.isLocked = true;

            const [firstCard, secondCard] = this.flippedCards;
            const firstSymbol = firstCard.querySelector('.card-back').innerHTML.trim();
            const secondSymbol = secondCard.querySelector('.card-back').innerHTML.trim();

            if (firstSymbol === secondSymbol) {
                // Match found
                setTimeout(() => {
                    firstCard.classList.add('matched');
                    secondCard.classList.add('matched');
                    this.flippedCards = [];
                    this.isLocked = false;

                    // Check for level completion
                    const matchedPairs = document.querySelectorAll('.card.matched').length / 2;
                    if (matchedPairs === this.levels[this.currentLevel].pairs) {
                        this.gameOver(true);
                    }
                }, 500);
            } else {
                // No match - flip cards back
                setTimeout(() => {
                    firstCard.classList.remove('flipped');
                    secondCard.classList.remove('flipped');
                    this.flippedCards = [];
                    this.isLocked = false;
                }, 1000);
            }
        }
    }

    startTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.timerDisplay.textContent = this.timeLeft;
            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                this.gameOver(false);
            }
        }, 1000);
    }

    gameOver(won) {
        clearInterval(this.timerInterval);
        
        if (won) {
            // Check if there's a next level
            const nextLevel = this.currentLevel + 1;
            if (this.levels[nextLevel]) {
                setTimeout(() => {
                    if (confirm(`Great job! Ready for Level ${nextLevel}?`)) {
                        this.currentLevel = nextLevel;
                        this.init();
                    }
                }, 500);
            } else {
                // Game completed
                setTimeout(() => {
                    alert("Congratulations! You've completed all levels! 🎉");
                    this.currentLevel = 1;
                    this.init();
                }, 500);
            }
        } else {
            // Time ran out - show game over modal
            const gameOverModal = document.getElementById('game-over-modal');
            const finalLevel = document.getElementById('final-level');
            const finalMoves = document.getElementById('final-moves');
            const finalScore = document.getElementById('final-score');

            // Calculate score based on level and moves
            const levelScore = (this.levels[this.currentLevel].pairs * 50) - (this.moves * 2);
            const score = Math.max(0, levelScore); // Ensure score doesn't go below 0

            // Update modal content
            finalLevel.textContent = this.currentLevel;
            finalMoves.textContent = this.moves;
            finalScore.textContent = score;

            // Show modal
            gameOverModal.classList.add('show');

            // Handle try again button
            const tryAgainButton = document.getElementById('try-again');
            tryAgainButton.onclick = () => {
                gameOverModal.classList.remove('show');
                this.currentLevel = 1;
                this.init();
            };
        }
    }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MemoryGame();
});
