class MemoryGame {
    constructor() {
        // Game elements
        this.gameBoard = document.querySelector('.game-board');
        this.movesDisplay = document.getElementById('moves');
        this.timerDisplay = document.getElementById('timer');
        this.levelDisplay = document.getElementById('current-level');
        this.bestTimeDisplay = document.getElementById('best-time-display');
        this.currentScoreDisplay = document.getElementById('current-score');
        this.currentUserDisplay = document.getElementById('current-user');
        
        // Login elements
        this.loginScreen = document.getElementById('login-screen');
        this.gameContainer = document.getElementById('game-container');
        this.userIdInput = document.getElementById('user-id');
        this.startGameButton = document.getElementById('start-game');
        this.loginError = document.getElementById('login-error');
        
        // Modal elements
        this.leaderboardModal = document.getElementById('leaderboard-modal');
        this.gameOverModal = document.getElementById('game-over-modal');
        this.leaderboardBody = document.getElementById('leaderboard-body');
        this.leaderboardList = document.getElementById('leaderboard-list');
        
        // Buttons
        this.restartButton = document.getElementById('restart');
        this.logoutButton = document.getElementById('logout');
        this.showLeaderboardButton = document.getElementById('show-leaderboard');
        this.closeLeaderboardButton = document.getElementById('close-leaderboard');
        this.tryAgainButton = document.getElementById('try-again');
        this.viewLeaderboardButton = document.getElementById('view-leaderboard');
        
        // Game state
        this.cards = [];
        this.flippedCards = [];
        this.moves = 0;
        this.score = 0;
        this.isLocked = false;
        this.gameStarted = false;
        this.timerInterval = null;
        this.timeLeft = 15;
        this.currentLevel = 1;
        this.bonusTimeEarned = false;
        this.alsuiBonusEarned = false;
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
        this.initializeLeaderboard();
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
                this.currentUserDisplay.textContent = `User: ${userId}`;
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

        this.logoutButton.addEventListener('click', () => {
            this.currentUser = null;
            this.userIdInput.value = '';
            this.loginScreen.style.display = 'block';
            this.gameContainer.style.display = 'none';
            clearInterval(this.timerInterval);
        });
    }

    initializeLeaderboard() {
        // Tab handling
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                button.classList.add('active');
                this.updateLeaderboard(button.dataset.level);
            });
        });

        // Modal buttons
        this.showLeaderboardButton.addEventListener('click', () => {
            this.leaderboardModal.classList.add('show');
            this.updateLeaderboard('all');
        });

        this.closeLeaderboardButton.addEventListener('click', () => {
            this.leaderboardModal.classList.remove('show');
        });

        this.tryAgainButton.addEventListener('click', () => {
            this.gameOverModal.classList.remove('show');
            this.restart();
        });

        this.viewLeaderboardButton.addEventListener('click', () => {
            this.gameOverModal.classList.remove('show');
            this.leaderboardModal.classList.add('show');
            this.updateLeaderboard('all');
        });

        // Initial leaderboard preview
        this.updateLeaderboardPreview();
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
        // Clear existing game state
        this.gameBoard.innerHTML = '';
        this.cards = [];
        this.flippedCards = [];
        this.moves = 0;
        this.score = 0;
        this.isLocked = false;
        this.gameStarted = false;
        this.bonusTimeEarned = false;
        this.alsuiBonusEarned = false;
        clearInterval(this.timerInterval);

        // Update displays
        this.movesDisplay.textContent = this.moves;
        this.levelDisplay.textContent = this.currentLevel;
        this.currentScoreDisplay.textContent = `Score: ${this.score}`;

        // Get level configuration and set timer
        const levelConfig = this.levels[this.currentLevel];
        this.timeLeft = levelConfig.time;
        this.timerDisplay.textContent = this.timeLeft;

        // Get cards for current level
        const levelSymbols = this.symbols.slice(0, levelConfig.pairs);
        const allCards = [...levelSymbols, ...levelSymbols];
        const shuffledCards = this.shuffleArray(allCards);

        // Create and add cards to the board
        shuffledCards.forEach(symbol => {
            const card = this.createCard(symbol);
            this.gameBoard.appendChild(card);
            this.cards.push(card);
        });

        // Set grid layout
        const columns = Math.ceil(Math.sqrt(levelConfig.pairs * 2));
        this.gameBoard.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

        // Update best time
        const bestTimes = JSON.parse(localStorage.getItem('bestTimes') || '{}');
        const userBestTimes = bestTimes[this.currentUser] || {};
        const levelBestTime = userBestTimes[this.currentLevel] || '--';
        this.bestTimeDisplay.textContent = `Best Time: ${levelBestTime}`;
    }

    createCard(symbol) {
        const template = document.getElementById('card-template');
        const card = template.content.cloneNode(true).querySelector('.card');
        const front = card.querySelector('.card-front');
        front.innerHTML = symbol;
        
        card.addEventListener('click', () => this.flipCard(card));
        return card;
    }

    flipCard(card) {
        if (this.isProcessing || card.classList.contains('flipped') || this.flippedCards.length >= 2) return;

        card.classList.add('flipped');
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.isProcessing = true;
            this.moves++;
            document.getElementById('moves').textContent = this.moves;

            const [card1, card2] = this.flippedCards;
            if (card1.querySelector('.card-front').innerHTML === card2.querySelector('.card-front').innerHTML) {
                // Match found
                setTimeout(() => {
                    card1.classList.add('matched');
                    card2.classList.add('matched');
                    this.matchedPairs++;
                    this.checkLevelComplete();
                    this.flippedCards = [];
                    this.isProcessing = false;
                }, 500);
            } else {
                // No match
                setTimeout(() => {
                    card1.classList.remove('flipped');
                    card2.classList.remove('flipped');
                    this.flippedCards = [];
                    this.isProcessing = false;
                }, 1000);
            }
        }
    }

    checkLevelComplete() {
        if (this.matchedPairs === this.currentLevel + 2) {
            const gameBoard = document.querySelector('.game-board');
            gameBoard.classList.add('level-complete');
            
            setTimeout(() => {
                gameBoard.classList.remove('level-complete');
                this.currentLevel++;
                document.getElementById('current-level').textContent = this.currentLevel;
                this.startLevel();
            }, 1000);
        }
    }

    startLevel() {
        this.matchedPairs = 0;
        this.init();
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.timerDisplay.textContent = this.timeLeft;
            
            // Add warning class when time is running low
            if (this.timeLeft <= 5) {
                this.timerDisplay.classList.add('warning');
            }
            
            if (this.timeLeft <= 0) {
                this.gameOver(false);
            }
        }, 1000);
    }

    gameOver(won) {
        clearInterval(this.timerInterval);
        this.isLocked = true;
        
        if (won) {
            // Calculate and update score
            const timeBonus = Math.floor(this.timeLeft * 10);
            const movesPenalty = Math.max(0, (this.moves - this.levels[this.currentLevel].pairs * 2) * 5);
            const levelScore = (this.levels[this.currentLevel].pairs * 100) + timeBonus - movesPenalty;
            this.score += levelScore;
            this.currentScoreDisplay.textContent = `Score: ${this.score}`;

            // Update best time if better
            const bestTimes = JSON.parse(localStorage.getItem('bestTimes') || '{}');
            const userBestTimes = bestTimes[this.currentUser] || {};
            if (!userBestTimes[this.currentLevel] || this.timeLeft > userBestTimes[this.currentLevel]) {
                userBestTimes[this.currentLevel] = this.timeLeft;
                bestTimes[this.currentUser] = userBestTimes;
                localStorage.setItem('bestTimes', JSON.stringify(bestTimes));
            }

            // Check if there's a next level
            const nextLevel = this.currentLevel + 1;
            if (this.levels[nextLevel]) {
                setTimeout(() => {
                    const message = `Level ${this.currentLevel} Complete!\nScore: ${levelScore}\nTime Bonus: ${timeBonus}\nMoves Penalty: ${movesPenalty}\n\nReady for Level ${nextLevel}?`;
                    if (confirm(message)) {
                        this.currentLevel = nextLevel;
                        this.init();
                    }
                }, 500);
            } else {
                // Game completed
                setTimeout(() => {
                    alert(`Congratulations! You've completed all levels!\nFinal Score: ${this.score}`);
                    // Reset to level 1
                    this.currentLevel = 1;
                    this.score = 0;
                    this.init();
                }, 500);
            }
        } else {
            // Game lost (time ran out)
            setTimeout(() => {
                alert('Time\'s up! Try again?');
                this.init();
            }, 500);
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }

    addEventListeners() {
        this.cards.forEach(card => {
            card.addEventListener('click', () => this.flipCard(card));
        });

        this.restartButton.addEventListener('click', () => {
            this.currentLevel = 1;
            this.init();
        });
    }

    calculateScore() {
        const baseScore = this.currentLevel * 100;
        const timeBonus = this.timeLeft * 10;
        const movesPenalty = Math.max(0, this.moves - (this.levels[this.currentLevel].pairs * 2)) * 5;
        return Math.max(0, baseScore + timeBonus - movesPenalty);
    }

    updateScore() {
        this.score = this.calculateScore();
        this.currentScoreDisplay.textContent = `Score: ${this.score}`;
    }

    saveScore() {
        const scores = JSON.parse(localStorage.getItem('scores') || '[]');
        scores.push({
            user: this.currentUser,
            level: this.currentLevel,
            score: this.score,
            time: Date.now()
        });
        scores.sort((a, b) => b.score - a.score);
        localStorage.setItem('scores', JSON.stringify(scores.slice(0, 100))); // Keep top 100 scores
        this.updateLeaderboardPreview();
    }

    updateLeaderboard(level = 'all') {
        const scores = JSON.parse(localStorage.getItem('scores') || '[]');
        let filteredScores = scores;
        if (level !== 'all') {
            filteredScores = scores.filter(s => s.level === parseInt(level));
        }

        this.leaderboardBody.innerHTML = filteredScores
            .slice(0, 10)
            .map((score, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${score.user}</td>
                    <td>${score.level}</td>
                    <td>${score.score}</td>
                </tr>
            `).join('');
    }

    updateLeaderboardPreview() {
        const scores = JSON.parse(localStorage.getItem('scores') || '[]');
        this.leaderboardList.innerHTML = scores
            .slice(0, 5)
            .map((score, index) => `
                <div class="preview-score">
                    ${index + 1}. ${score.user} - Level ${score.level} - ${score.score} pts
                </div>
            `).join('');
    }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MemoryGame();
});
