const game = document.getElementById('game');
const player = document.getElementById('player');
const obstacleCanvas = document.getElementById('obstacleCanvas');
const context = obstacleCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('finalScore');
const bestScoreSpan = document.getElementById('bestScoreSpan');
const gameOverPanel = document.getElementById('gameOver');
const restartButton = document.getElementById('restartButton');
const checkpoint = document.getElementById('checkpoint');
const checkpointText = document.getElementById('checkpointText');

const music = document.getElementById('background-music');
const jumpSound = new Audio('assets/jumped.wav');
const sfxHitSound = new Audio('assets/sfx_hit.wav');
const checkpointSound = new Audio('assets/checkpoint.wav');

const groundOffset = 72;
const playerSize = 46;
const gravity = 0.7;
const jumpPower = 15;
const obstacleSpeed = 6;
const obstacleInterval = 1400;
const obstacleUnit = 36;
const obstacleLineWidth = 10;
const bestScoreStorageKey = 'jumping-game-best-score';

const obstacleShapes = [
	[[[0,0], [1, 0], [0.5, 0.5], [1, 0.5], [1, 1], [1.5, 1]]],
	[[[0,0],[1, 0], [1, 1], [1.5, 1]], [[1, 0.5], [1.5, 0.5]]],
	[[[0,0], [1, 0], [1, 1]]],
	[[[0,0], [1, 0], [1, 1], [0.5, 0.5], [1.5, 0.5]]],
	[[[0,0], [1, 0], [1, 1]], [[1, 0], [1.5, 0], [1.5, 1]]]
];

let playerBottom = groundOffset;
let playerVelocity = 0;
let isJumping = false;
let isGameOver = false;
let score = 0;
let bestScore = loadBestScore();
let obstacles = [];
let lastObstacleTime = 0;
let animationId = null;
let checkpointTimeoutId = null;

function createObstacle() {
	const shape = obstacleShapes[Math.floor(Math.random() * obstacleShapes.length)];
	const bounds = getShapeBounds(shape);

	obstacles.push({
		shape,
		bounds,
		left: game.clientWidth,
		scored: false
	});
}

function getShapeBounds(shape) {
	const points = shape.flat();

	return {
		minX: Math.min(...points.map((point) => point[0])),
		maxX: Math.max(...points.map((point) => point[0])),
		minY: Math.min(...points.map((point) => point[1])),
		maxY: Math.max(...points.map((point) => point[1]))
	};
}

function resizeCanvas() {
	const width = game.clientWidth;
	const height = game.clientHeight;
	const pixelRatio = window.devicePixelRatio || 1;

	obstacleCanvas.width = width * pixelRatio;
	obstacleCanvas.height = height * pixelRatio;
	obstacleCanvas.style.width = `${width}px`;
	obstacleCanvas.style.height = `${height}px`;
	context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function drawObstacles() {
	const groundY = game.clientHeight - groundOffset;

	context.clearRect(0, 0, game.clientWidth, game.clientHeight);
	context.lineWidth = obstacleLineWidth;
	context.lineCap = 'round';
	context.lineJoin = 'round';
	context.strokeStyle = '#238653';

	obstacles.forEach((obstacle) => {
		obstacle.shape.forEach((line) => {
			context.beginPath();

			line.forEach(([x, y], index) => {
				const drawX = obstacle.left + x * obstacleUnit;
				const drawY = groundY - (obstacle.bounds.maxY - y) * obstacleUnit;

				if (index === 0) {
					context.moveTo(drawX, drawY);
				} else {
					context.lineTo(drawX, drawY);
				}
			});

			context.stroke();
		});
	});
}

function updatePlayer() {
	playerBottom += playerVelocity;
	playerVelocity -= gravity;

	if (playerBottom <= groundOffset) {
		playerBottom = groundOffset;
		playerVelocity = 0;
		isJumping = false;
	}

	player.style.bottom = `${playerBottom}px`;
}

function updateObstacles() {
	obstacles.forEach((obstacle) => {
		obstacle.left -= obstacleSpeed;
		const obstacleHitBox = getObstacleHitBox(obstacle);

		if (!obstacle.scored && obstacleHitBox.right < player.offsetLeft) {
			obstacle.scored = true;
      score += 10;
      updateBestScore();
      if (score % 100 === 0) {
        showCheckpoint();
        checkpointSound.play()
      }
      scoreElement.textContent = score;
		}
	});

	obstacles = obstacles.filter((obstacle) => getObstacleHitBox(obstacle).right > 0);
}

function getObstacleHitBox(obstacle) {
	const groundY = game.clientHeight - groundOffset;
	const padding = obstacleLineWidth / 2;

	return {
		left: obstacle.left + obstacle.bounds.minX * obstacleUnit - padding,
		right: obstacle.left + obstacle.bounds.maxX * obstacleUnit + padding,
		top: groundY - obstacle.bounds.maxY * obstacleUnit - padding,
		bottom: groundY - obstacle.bounds.minY * obstacleUnit + padding
	};
}

function getPlayerHitBox() {
	const bottom = game.clientHeight - playerBottom;

	return {
		left: player.offsetLeft,
		right: player.offsetLeft + playerSize,
		top: bottom - playerSize,
		bottom
	};
}

function boxesOverlap(first, second) {
	return first.left < second.right &&
		first.right > second.left &&
		first.top < second.bottom &&
		first.bottom > second.top;
}

function checkCollisions() {
	const playerHitBox = getPlayerHitBox();

	return obstacles.some((obstacle) => boxesOverlap(playerHitBox, getObstacleHitBox(obstacle)));
}

function endGame() {
	isGameOver = true;
	updateBestScore();
	finalScoreElement.textContent = score;
	gameOverPanel.classList.remove('hidden');
	cancelAnimationFrame(animationId);
}

function loadBestScore() {
	try {
		return Number(window.localStorage.getItem(bestScoreStorageKey)) || 0;
	} catch {
		return 0;
	}
}

function updateBestScore() {
	if (score <= bestScore) {
		return;
	}

	bestScore = score;
	bestScoreSpan.textContent = bestScore;

	try {
		window.localStorage.setItem(bestScoreStorageKey, String(bestScore));
	} catch {
	}
}

function showCheckpoint() {
  checkpointText.textContent = `Checkpoint ${score}!`;
  checkpoint.classList.remove('show');
  void checkpoint.offsetWidth;
  checkpoint.classList.add('show');

  clearTimeout(checkpointTimeoutId);
  checkpointTimeoutId = setTimeout(() => {
    checkpoint.classList.remove('show');
  }, 1800);
}

function resetGame() {
	obstacles = [];
	playerBottom = groundOffset;
	playerVelocity = 0;
	isJumping = false;
	isGameOver = false;
	score = 0;
  lastObstacleTime = 0;
  jumpSound.loop = false;
  sfxHitSound.loop = false;
  checkpointSound.loop = false;
  clearTimeout(checkpointTimeoutId);
  checkpoint.classList.remove('show');
	scoreElement.textContent = score;
	player.style.bottom = `${playerBottom}px`;
	gameOverPanel.classList.add('hidden');
	resizeCanvas();
	drawObstacles();
    game.focus();
    music.play();

	animationId = requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
	if (isGameOver) {
		return;
	}

	if (!lastObstacleTime || timestamp - lastObstacleTime > obstacleInterval) {
		createObstacle();
		lastObstacleTime = timestamp;
	}

	updatePlayer();
	updateObstacles();
	drawObstacles();

  if (checkCollisions()) {
    sfxHitSound.play();
    endGame();
    const score = loadBestScore();
		bestScoreSpan.textContent = score
    return;
	}

	animationId = requestAnimationFrame(gameLoop);
}

function jump() {
	if (isJumping || isGameOver) {
		return;
	}

	isJumping = true;
    playerVelocity = jumpPower;
    jumpSound.play()
}

document.addEventListener('keydown', (event) => {
	if (event.code === 'Space' || event.code === 'ArrowUp') {
		event.preventDefault();
		jump();
	}
});

restartButton.addEventListener('click', resetGame);
window.addEventListener('resize', resizeCanvas);

resetGame();
