document.addEventListener('DOMContentLoaded', () => {
    let BOARD_SIZE = 8;
    const gameBoard = document.getElementById('game-board');
    const currentPlayerElement = document.getElementById('current-player');
    const player1MovesElement = document.getElementById('player1-moves');
    const player2MovesElement = document.getElementById('player2-moves');
    const player1ScoreElement = document.getElementById('player1-score');
    const player2ScoreElement = document.getElementById('player2-score');
    const player1ScoreContainer = document.querySelector('.player1-score');
    const player2ScoreContainer = document.querySelector('.player2-score');
    const timerElement = document.getElementById('timer');
    const minesCountElement = document.getElementById('mines-count');
    const boardSizeSelect = document.getElementById('board-size');
    const gameModeSelect = document.getElementById('game-mode-select');
    const newGameButton = document.getElementById('new-game');
    const gameMessageElement = document.getElementById('game-message');
    const robloxScoreContainer = document.querySelector('.roblox-score-container');
    const themeToggleButton = document.getElementById('theme-toggle');
    const flagModeButton = document.getElementById('flag-mode');

    let board = [];
    let revealed = [];
    let flagged = [];
    let mines = [];
    let currentPlayer = 1;
    let player1Moves = 0;
    let player2Moves = 0;
    let player1Score = 0;
    let player2Score = 0;
    let gameActive = true;
    let timerInterval;
    let seconds = 0;
    let player1StartTime = 0;
    let player2StartTime = 0;
    let player1TotalTime = 0;
    let player2TotalTime = 0;
    let gameMode = 'multi'; // 'single' или 'multi'
    let flagMode = false; // Режим установки флагов

    // Инициализация темы
    function initTheme() {
        const savedTheme = localStorage.getItem('saper-theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggleButton.textContent = '☀️';
        } else {
            themeToggleButton.textContent = '🌙';
        }
    }

    // Инициализация игры
    function initGame() {
        // Получаем выбранный режим игры и размер поля
        gameMode = gameModeSelect.value;
        BOARD_SIZE = parseInt(boardSizeSelect.value);
        
        // Обновляем максимальное количество мин в зависимости от размера поля
        const maxMines = Math.floor(BOARD_SIZE * BOARD_SIZE * 0.2); // Максимум 20% от общего количества клеток
        minesCountElement.max = maxMines;
        if (parseInt(minesCountElement.value) > maxMines) {
            minesCountElement.value = maxMines;
        }
        
        // Сброс состояния игры
        board = [];
        revealed = [];
        mines = [];
        currentPlayer = 1;
        player1Moves = 0;
        player2Moves = 0;
        player1Score = 0;
        player2Score = 0;
        gameActive = true;
        seconds = 0;
        player1StartTime = 0;
        player2StartTime = 0;
        player1TotalTime = 0;
        player2TotalTime = 0;
        
        // Скрыть сообщение о результате
        gameMessageElement.classList.add('hidden');
        gameMessageElement.classList.remove('win', 'lose');
        
        // Обновить UI в зависимости от режима игры
        updateUI();
        updateGameModeUI();
        updateActivePlayerHighlight();
        updateBoardSize();
        
        // Остановить таймер
        clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 1000);
        
        // Создать пустое поле
        for (let i = 0; i < BOARD_SIZE; i++) {
            board[i] = [];
            revealed[i] = [];
            flagged[i] = [];
            for (let j = 0; j < BOARD_SIZE; j++) {
                board[i][j] = 0;
                revealed[i][j] = false;
                flagged[i][j] = false;
            }
        }
        
        // Разместить мины
        placeMines(parseInt(minesCountElement.value));
        
        // Рассчитать количество мин вокруг каждой клетки
        calculateNumbers();
        
        // Отрисовать поле
        renderBoard();
        
        // Инициализация темы после создания поля
        if (themeToggleButton) {
            initTheme();
            
            // Обработчик переключения темы
            themeToggleButton.addEventListener('click', () => {
                document.body.classList.toggle('dark-theme');
                const isDark = document.body.classList.contains('dark-theme');
                
                if (isDark) {
                    themeToggleButton.textContent = '☀️';
                    localStorage.setItem('saper-theme', 'dark');
                } else {
                    themeToggleButton.textContent = '🌙';
                    localStorage.setItem('saper-theme', 'light');
                }
            });
        }
    }

    // Размещение мин на поле
    function placeMines(count) {
        let minesPlaced = 0;
        
        while (minesPlaced < count) {
            const row = Math.floor(Math.random() * BOARD_SIZE);
            const col = Math.floor(Math.random() * BOARD_SIZE);
            
            if (board[row][col] !== -1) {
                board[row][col] = -1;
                mines.push({row, col});
                minesPlaced++;
            }
        }
    }

    // Расчёт количества мин вокруг каждой клетки
    function calculateNumbers() {
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (board[i][j] !== -1) {
                    let count = 0;
                    
                    // Проверить все соседние клетки
                    for (let di = -1; di <= 1; di++) {
                        for (let dj = -1; dj <= 1; dj++) {
                            if (di === 0 && dj === 0) continue;
                            
                            const ni = i + di;
                            const nj = j + dj;
                            
                            if (ni >= 0 && ni < BOARD_SIZE && nj >= 0 && nj < BOARD_SIZE) {
                                if (board[ni][nj] === -1) {
                                    count++;
                                }
                            }
                        }
                    }
                    
                    board[i][j] = count;
                }
            }
        }
    }

    // Отрисовка игрового поля
    function renderBoard() {
        gameBoard.innerHTML = '';
        
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                if (revealed[i][j]) {
                    cell.classList.add('revealed');
                    
                    if (board[i][j] === -1) {
                        cell.classList.add('mine');
                        // Убираем текст, так как теперь используем изображение
                    } else if (board[i][j] > 0) {
                        cell.textContent = board[i][j];
                        cell.setAttribute('data-count', board[i][j]);
                    }
                } else if (flagged[i][j]) {
                    cell.classList.add('flagged');
                }
                
                cell.addEventListener('click', handleCellClick);
                cell.addEventListener('contextmenu', handleRightClick);
                
                // Добавляем поддержку долгого нажатия для мобильных устройств
                cell.addEventListener('touchstart', handleTouchStart, { passive: false });
                cell.addEventListener('touchend', handleTouchEnd, { passive: false });
                cell.addEventListener('touchcancel', handleTouchEnd, { passive: false });
                
                gameBoard.appendChild(cell);
            }
        }
    }

    // Обработка клика по клетке
    function handleCellClick(event) {
        if (!gameActive) return;
        
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        
        if (revealed[row][col]) return;
        
        // Если в режиме флага, устанавливаем/убираем флаг
        if (flagMode) {
            flagged[row][col] = !flagged[row][col];
            renderBoard();
            return;
        }
        
        // Если клетка помечена флагом, не открываем её
        if (flagged[row][col]) return;
        
        // Записываем время начала хода текущего игрока
        if (currentPlayer === 1) {
            if (player1StartTime === 0) {
                player1StartTime = seconds;
            }
        } else {
            if (player2StartTime === 0) {
                player2StartTime = seconds;
            }
        }
        
        revealCell(row, col);
        
        // Проверить, попал ли игрок на мину
        if (board[row][col] === -1) {
            // Обновляем общее время игры перед завершением
            updatePlayerTimes();
            calculateScores();
            endGame(false);
            return;
        }
        
        // Обновить счётчик ходов текущего игрока
        if (currentPlayer === 1) {
            player1Moves++;
        } else {
            player2Moves++;
        }
        
        // Обновляем время текущего игрока перед сменой хода
        if (currentPlayer === 1) {
            player1TotalTime += seconds - player1StartTime;
            player1StartTime = 0;
        } else {
            player2TotalTime += seconds - player2StartTime;
            player2StartTime = 0;
        }
        
        // Сменить игрока (только в режиме двух игроков)
        if (gameMode === 'multi') {
            currentPlayer = currentPlayer === 1 ? 2 : 1;
        }
        
        // Обновить UI
        updateUI();
        updateActivePlayerHighlight();
        
        // Проверить, выиграл ли игрок
        if (checkWin()) {
            // Обновляем общее время игры перед завершением
            updatePlayerTimes();
            calculateScores();
            endGame(true);
        }
    }

    // Обработка правого клика (установка флажка)
    function handleRightClick(event) {
        event.preventDefault();
        
        if (!gameActive) return;
        
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        
        if (revealed[row][col]) return;
        
        // Переключить состояние флажка
        flagged[row][col] = !flagged[row][col];
        
        // Перерисовать поле
        renderBoard();
    }

    // Обработка долгого нажатия и двойного клика для мобильных устройств
    let touchTimer;
    let touchStartTime;
    let lastTap = 0;
    
    function handleTouchStart(event) {
        if (!gameActive) return;
        
        const cell = event.target.closest('.cell');
        if (!cell) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (revealed[row][col]) return;
        
        touchStartTime = Date.now();
        
        // Проверяем на двойное нажатие
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
            // Двойное нажатие - устанавливаем флажок
            event.preventDefault();
            flagged[row][col] = !flagged[row][col];
            renderBoard();
            
            // Вибрация для обратной связи (если поддерживается)
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            // Сбрасываем таймер долгого нажатия
            if (touchTimer) {
                clearTimeout(touchTimer);
                touchTimer = null;
            }
        }
        
        lastTap = currentTime;
        
        // Устанавливаем таймер для долгого нажатия
        touchTimer = setTimeout(() => {
            // Долгое нажатие - устанавливаем флажок
            flagged[row][col] = !flagged[row][col];
            renderBoard();
            
            // Вибрация для обратной связи (если поддерживается)
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }, 500); // 500мс для долгого нажатия
    }
    
    function handleTouchEnd(event) {
        // Очищаем таймер если нажатие было коротким
        if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
        }
    }

    // Открытие клетки
    function revealCell(row, col) {
        if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE || revealed[row][col]) {
            return;
        }
        
        revealed[row][col] = true;
        
        // Если клетка пустая (0 мин вокруг), открыть все соседние клетки
        if (board[row][col] === 0) {
            for (let di = -1; di <= 1; di++) {
                for (let dj = -1; dj <= 1; dj++) {
                    if (di === 0 && dj === 0) continue;
                    revealCell(row + di, col + dj);
                }
            }
        }
        
        renderBoard();
    }

    // Проверка выигрыша
    function checkWin() {
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (board[i][j] !== -1 && !revealed[i][j]) {
                    return false;
                }
            }
        }
        return true;
    }

    // Завершение игры
    function endGame(isWin) {
        gameActive = false;
        clearInterval(timerInterval);
        
        // Показать все мины
        for (const mine of mines) {
            revealed[mine.row][mine.col] = true;
        }
        
        // Показать флажки на всех минах, которые были правильно отмечены
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (board[i][j] === -1 && flagged[i][j]) {
                    flagged[i][j] = true;
                }
            }
        }
        
        renderBoard();
        
        // Показать сообщение о результате с очками
        gameMessageElement.classList.remove('hidden');
        
        if (isWin) {
            if (gameMode === 'single') {
                gameMessageElement.innerHTML = `
                    <div>🏆 Поздравляем, вы победили! 🏆</div>
                    <div class="score-summary">
                        <div>🪙 Ваши очки: ${player1Score}</div>
                        <div>⏱️ Время: ${Math.floor(player1TotalTime / 60)}:${(player1TotalTime % 60).toString().padStart(2, '0')}</div>
                        <div>🎯 Ходов: ${player1Moves}</div>
                    </div>
                `;
            } else {
                const winner = currentPlayer === 1 ? 2 : 1; // Победитель - тот, кто не делал последний ход
                const winnerScore = winner === 1 ? player1Score : player2Score;
                const loserScore = winner === 1 ? player2Score : player1Score;
                gameMessageElement.innerHTML = `
                    <div>🏆 Игрок ${winner} победил! 🏆</div>
                    <div class="score-summary">
                        <div>🪙 Игрок ${winner}: ${winnerScore} очков</div>
                        <div>🪙 Игрок ${winner === 1 ? 2 : 1}: ${loserScore} очков</div>
                    </div>
                `;
            }
            gameMessageElement.classList.add('win');
        } else {
            if (gameMode === 'single') {
                gameMessageElement.innerHTML = `
                    <div>💥 Вы подорвались на мине! 💥</div>
                    <div class="score-summary">
                        <div>🪙 Ваши очки: ${player1Score}</div>
                        <div>⏱️ Время: ${Math.floor(player1TotalTime / 60)}:${(player1TotalTime % 60).toString().padStart(2, '0')}</div>
                        <div>🎯 Ходов: ${player1Moves}</div>
                    </div>
                `;
            } else {
                const loser = currentPlayer === 1 ? 1 : 2; // Проигравший - тот, кто сделал последний ход
                const winner = loser === 1 ? 2 : 1;
                const winnerScore = winner === 1 ? player1Score : player2Score;
                const loserScore = loser === 1 ? player1Score : player2Score;
                gameMessageElement.innerHTML = `
                    <div>💥 Игрок ${loser} подорвался на мине! 💥</div>
                    <div class="score-summary">
                        <div>🪙 Игрок ${winner}: ${winnerScore} очков</div>
                        <div>🪙 Игрок ${loser}: ${loserScore} очков</div>
                    </div>
                `;
            }
            gameMessageElement.classList.add('lose');
        }
    }

    // Обновление времени игроков
    function updatePlayerTimes() {
        if (currentPlayer === 1 && player1StartTime > 0) {
            player1TotalTime += seconds - player1StartTime;
            player1StartTime = 0;
        } else if (currentPlayer === 2 && player2StartTime > 0) {
            player2TotalTime += seconds - player2StartTime;
            player2StartTime = 0;
        }
    }

    // Расчет очков в стиле Roblox на основе времени игры
    function calculateScores() {
        // Базовые очки за участие
        let baseScore = 100;
        
        // Адаптивные бонусы в зависимости от размера поля
        const totalCells = BOARD_SIZE * BOARD_SIZE;
        const mineCount = parseInt(minesCountElement.value);
        const safeCells = totalCells - mineCount;
        
        // Бонусные очки за быстрое прохождение (меньше времени = больше очков)
        // Адаптируем максимальное время в зависимости от размера поля
        const maxTime = Math.max(120, Math.floor(safeCells * 3)); // Минимум 2 минуты, плюс 3 секунды на безопасную клетку
        
        // Бонус за эффективность (меньше ходов = больше очков)
        // Адаптируем максимальное количество ходов в зависимости от размера поля
        const maxMoves = Math.max(10, Math.floor(safeCells * 0.8)); // Минимум 10 ходов, плюс 80% от количества безопасных клеток
        
        // Бонус за сложность (больше мин = больше очки)
        const difficultyBonus = Math.floor(mineCount * 5);
        
        // Проверяем, проиграл ли игрок на мине
        const player1LostOnMine = gameActive === false && currentPlayer === 1 && board.some(mine => mine.row >= 0 && mine.col >= 0 && board[mine.row][mine.col] === -1 && revealed[mine.row][mine.col]);
        const player2LostOnMine = gameActive === false && currentPlayer === 2 && board.some(mine => mine.row >= 0 && mine.col >= 0 && board[mine.row][mine.col] === -1 && revealed[mine.row][mine.col]);
        
        // Расчет очков для игрока 1
        if (player1LostOnMine) {
            // Если игрок проиграл на мине, даем только базовые очки и бонус за сложность
            player1Score = baseScore + difficultyBonus;
        } else {
            // Если игрок не проиграл, даем полные очки с бонусами
            const player1TimeBonus = Math.max(0, Math.floor((maxTime - player1TotalTime) / 2));
            const player1MoveBonus = Math.max(0, Math.floor((maxMoves - player1Moves) * 3));
            player1Score = baseScore + player1TimeBonus + player1MoveBonus + difficultyBonus;
        }
        
        // Расчет очков для игрока 2
        if (player2LostOnMine) {
            // Если игрок проиграл на мине, даем только базовые очки и бонус за сложность
            player2Score = baseScore + difficultyBonus;
        } else {
            // Если игрок не проиграл, даем полные очки с бонусами
            const player2TimeBonus = Math.max(0, Math.floor((maxTime - player2TotalTime) / 2));
            const player2MoveBonus = Math.max(0, Math.floor((maxMoves - player2Moves) * 3));
            player2Score = baseScore + player2TimeBonus + player2MoveBonus + difficultyBonus;
        }
        
        // Обновляем отображение очков
        player1ScoreElement.textContent = player1Score;
        player2ScoreElement.textContent = player2Score;
    }

    // Обновление UI
    function updateUI() {
        currentPlayerElement.textContent = currentPlayer;
        player1MovesElement.textContent = player1Moves;
        player2MovesElement.textContent = player2Moves;
        player1ScoreElement.textContent = player1Score;
        player2ScoreElement.textContent = player2Score;
    }

    // Обновление UI в зависимости от режима игры
    function updateGameModeUI() {
        if (gameMode === 'single') {
            // Скрываем элементы для второго игрока в одиночном режиме
            player2ScoreContainer.style.display = 'none';
            document.querySelector('.vs-indicator').style.display = 'none';
            currentPlayerElement.parentElement.style.display = 'none';
            player2MovesElement.parentElement.style.display = 'none';
        } else {
            // Показываем все элементы для двух игроков
            player2ScoreContainer.style.display = 'flex';
            document.querySelector('.vs-indicator').style.display = 'flex';
            currentPlayerElement.parentElement.style.display = 'block';
            player2MovesElement.parentElement.style.display = 'block';
        }
    }

    // Обновление размера поля
    function updateBoardSize() {
        // Удаляем все классы размера
        gameBoard.classList.remove('size-6', 'size-8', 'size-10', 'size-12');
        // Добавляем нужный класс
        gameBoard.classList.add(`size-${BOARD_SIZE}`);
    }

    // Обновление подсветки активного игрока
    function updateActivePlayerHighlight() {
        if (gameMode === 'single') {
            // В одиночном режиме подсвечиваем только первого игрока
            player1ScoreContainer.classList.add('active');
            player2ScoreContainer.classList.remove('active');
        } else {
            // В режиме двух игроков подсвечиваем текущего игрока
            if (currentPlayer === 1) {
                player1ScoreContainer.classList.add('active');
                player2ScoreContainer.classList.remove('active');
            } else {
                player2ScoreContainer.classList.add('active');
                player1ScoreContainer.classList.remove('active');
            }
        }
    }

    // Обновление таймера
    function updateTimer() {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Обработчик нажатия на кнопку "Новая игра"
    newGameButton.addEventListener('click', initGame);
    
    // Обработчик нажатия на кнопку режима флага
    flagModeButton.addEventListener('click', () => {
        flagMode = !flagMode;
        flagModeButton.classList.toggle('active');
        
        // Вибрация для обратной связи (если поддерживается)
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    });
    
    // Запуск игры при загрузке страницы
    initGame();
});
