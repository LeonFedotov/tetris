var game = {
	// Game state
	currentPiece: null,
	currentX: 0,
	currentY: 0,
	nextPiece: null,
	heldPiece: null,
	canHold: true,

	// Game status
	isRunning: false,
	isPaused: false,
	isGameOver: false,

	// Statistics
	score: 0,
	level: 1,
	linesCleared: 0,

	// Timing
	tickInterval: null,
	baseSpeed: 1000, // ms per tick at level 1
	currentSpeed: 1000,

	// Grid state - track locked pieces
	grid: [],

	// Initialize game
	init: function() {
		// Initialize empty grid - now stores color info
		this.grid = [];
		for (var y = 0; y < display.height; y++) {
			this.grid[y] = [];
			for (var x = 0; x < display.width; x++) {
				this.grid[y][x] = null; // null = empty, or color string
			}
		}

		this.score = 0;
		this.level = 1;
		this.linesCleared = 0;
		this.isGameOver = false;
		this.isPaused = false;
		this.canHold = true;
		this.heldPiece = null;

		return this;
	},

	// Get current speed based on level
	getSpeed: function() {
		return Math.max(100, this.baseSpeed - (this.level - 1) * 50);
	},

	// Reset game
	reset: function() {
		this.stop();
		display.clear();
		this.init();
		return this;
	},

	// Start game
	start: function() {
		if (!this.isRunning) {
			this.isRunning = true;
			this.isPaused = false;
			this.spawnPiece();
			this.startGameLoop();
		}
		return this;
	},

	// Start game loop
	startGameLoop: function() {
		var that = this;
		this.currentSpeed = this.getSpeed();

		if (this.tickInterval) {
			clearInterval(this.tickInterval);
		}

		this.tickInterval = setInterval(function() {
			that.tick();
		}, this.currentSpeed);

		return this;
	},

	// Game tick - called periodically to move piece down
	tick: function() {
		if (this.isPaused || this.isGameOver) {
			return;
		}

		// Try to move piece down
		if (!this.moveDown()) {
			// Piece can't move down - lock it
			this.lockPiece();
		}

		this.render();
		if (typeof ui !== 'undefined') ui.update();
		return this;
	},

	// Game over
	gameOver: function() {
		this.isGameOver = true;
		this.stop();
		console.log('Game Over! Score: ' + this.score);
		if (typeof ui !== 'undefined') ui.update();
		return this;
	},

	// Stop game
	stop: function() {
		this.isRunning = false;
		if (this.tickInterval) {
			clearInterval(this.tickInterval);
			this.tickInterval = null;
		}
		return this;
	},

	// Pause/unpause
	togglePause: function() {
		if (this.isRunning && !this.isGameOver) {
			this.isPaused = !this.isPaused;
		}
		return this;
	},

	// Collision detection - check if piece at given position would collide
	checkCollision: function(piece, x, y) {
		if (!piece || !piece.body) return true;

		var body = piece.body;
		for (var sy = 0; sy < body.length; sy++) {
			if (!body[sy]) continue;
			for (var sx = 0; sx < body[sy].length; sx++) {
				if (body[sy][sx]) {
					var gridX = x + sx;
					var gridY = y + sy;

					// Check boundaries
					if (gridX < 0 || gridX >= display.width) {
						return true; // Hit left or right wall
					}
					if (gridY < 0) {
						return true; // Hit floor
					}
					if (gridY >= display.height) {
						continue; // Above grid is ok for spawning
					}

					// Check collision with locked pieces
					if (this.grid[gridY] && this.grid[gridY][gridX]) {
						return true;
					}
				}
			}
		}
		return false; // No collision
	},

	// Check if position is valid
	isValidPosition: function(piece, x, y) {
		return !this.checkCollision(piece, x, y);
	},

	// Move piece left
	moveLeft: function() {
		if (!this.currentPiece || this.isPaused || this.isGameOver) return false;

		if (this.isValidPosition(this.currentPiece, this.currentX - 1, this.currentY)) {
			this.currentX--;
			return true;
		}
		return false;
	},

	// Move piece right
	moveRight: function() {
		if (!this.currentPiece || this.isPaused || this.isGameOver) return false;

		if (this.isValidPosition(this.currentPiece, this.currentX + 1, this.currentY)) {
			this.currentX++;
			return true;
		}
		return false;
	},

	// Move piece down (soft drop)
	moveDown: function() {
		if (!this.currentPiece || this.isPaused || this.isGameOver) return false;

		if (this.isValidPosition(this.currentPiece, this.currentX, this.currentY - 1)) {
			this.currentY--;
			return true;
		}
		return false; // Can't move down - piece should lock
	},

	// Hard drop - drop piece to bottom instantly
	hardDrop: function() {
		if (!this.currentPiece || this.isPaused || this.isGameOver) return 0;

		var dropDistance = 0;
		while (this.isValidPosition(this.currentPiece, this.currentX, this.currentY - 1)) {
			this.currentY--;
			dropDistance++;
		}
		return dropDistance;
	},

	// Rotate piece with wall kicks
	rotate: function() {
		if (!this.currentPiece || this.isPaused || this.isGameOver) return false;

		// Store original state in case rotation fails
		var originalBody = [];
		for (var i = 0; i < this.currentPiece.body.length; i++) {
			originalBody[i] = this.currentPiece.body[i].slice();
		}

		// Attempt rotation
		this.currentPiece.nextRotation();

		// Try current position first
		if (this.isValidPosition(this.currentPiece, this.currentX, this.currentY)) {
			return true;
		}

		// Wall kick attempts - try moving left, right, up
		var kicks = [
			{x: -1, y: 0},  // Left
			{x: 1, y: 0},   // Right
			{x: -2, y: 0},  // Left 2
			{x: 2, y: 0},   // Right 2
			{x: 0, y: 1},   // Up
			{x: -1, y: 1},  // Left + Up
			{x: 1, y: 1}    // Right + Up
		];

		for (var i = 0; i < kicks.length; i++) {
			if (this.isValidPosition(this.currentPiece, this.currentX + kicks[i].x, this.currentY + kicks[i].y)) {
				this.currentX += kicks[i].x;
				this.currentY += kicks[i].y;
				return true;
			}
		}

		// Rotation failed - restore original body
		this.currentPiece.body = originalBody;
		return false;
	},

	// Get random piece
	getRandomPiece: function() {
		var shapeId = Math.floor(Math.random() * 7) + 1; // 1-7
		return getShape.byId(shapeId);
	},

	// Spawn new piece at top
	spawnPiece: function() {
		// Use next piece if available, otherwise generate random
		this.currentPiece = this.nextPiece || this.getRandomPiece();
		this.nextPiece = this.getRandomPiece();

		// Start position - center top
		this.currentX = Math.floor((display.width - this.currentPiece.body[0].length) / 2);
		this.currentY = display.height - 1;

		// Reset hold ability
		this.canHold = true;

		// Check if spawn position is valid (game over if not)
		if (!this.isValidPosition(this.currentPiece, this.currentX, this.currentY)) {
			this.gameOver();
			return false;
		}

		return true;
	},

	// Hold piece functionality
	holdPiece: function() {
		if (!this.canHold || !this.currentPiece) return false;

		if (this.heldPiece) {
			// Swap current piece with held piece
			var temp = this.currentPiece;
			this.currentPiece = this.heldPiece;
			this.heldPiece = temp;
		} else {
			// First time holding - put current piece in hold and spawn new one
			this.heldPiece = this.currentPiece;
			this.currentPiece = this.nextPiece;
			this.nextPiece = this.getRandomPiece();
		}

		// Reset position for swapped/new piece
		this.currentX = Math.floor((display.width - this.currentPiece.body[0].length) / 2);
		this.currentY = display.height - 1;

		// Can only hold once per piece
		this.canHold = false;

		return true;
	},

	// Lock current piece into grid
	lockPiece: function() {
		if (!this.currentPiece) return this;

		// Add piece to grid with color
		var body = this.currentPiece.body;
		var color = this.currentPiece.color || '#00f';
		for (var sy = 0; sy < body.length; sy++) {
			if (!body[sy]) continue;
			for (var sx = 0; sx < body[sy].length; sx++) {
				if (body[sy][sx]) {
					var gridX = this.currentX + sx;
					var gridY = this.currentY + sy;
					if (gridY >= 0 && gridY < this.grid.length && gridX >= 0 && gridX < this.grid[0].length) {
						this.grid[gridY][gridX] = color;
					}
				}
			}
		}

		// Clear completed lines
		this.clearLines();

		// Spawn new piece
		this.spawnPiece();

		return this;
	},

	// Clear completed lines
	clearLines: function() {
		var linesCleared = 0;

		// Check each row from bottom to top
		for (var y = 0; y < this.grid.length; y++) {
			var isComplete = true;

			// Check if row is complete
			for (var x = 0; x < this.grid[y].length; x++) {
				if (!this.grid[y][x]) {
					isComplete = false;
					break;
				}
			}

			// If row is complete, remove it
			if (isComplete) {
				linesCleared++;

				// Remove the completed row
				this.grid.splice(y, 1);

				// Add new empty row at top
				var newRow = [];
				for (var x = 0; x < display.width; x++) {
					newRow[x] = null;
				}
				this.grid.push(newRow);

				// Check this row again (since rows moved down)
				y--;
			}
		}

		// Update statistics and score
		if (linesCleared > 0) {
			this.linesCleared += linesCleared;
			this.addScore(linesCleared);
			this.updateLevel();
		}

		return linesCleared;
	},

	// Add score based on lines cleared
	addScore: function(linesCleared) {
		// Standard Tetris scoring
		var points = 0;
		switch(linesCleared) {
			case 1:
				points = 100;
				break;
			case 2:
				points = 300;
				break;
			case 3:
				points = 500;
				break;
			case 4:
				points = 800; // Tetris!
				break;
			default:
				points = 0;
		}

		this.score += points * this.level;
		return this;
	},

	// Update level based on lines cleared
	updateLevel: function() {
		// Level up every 10 lines
		var newLevel = Math.floor(this.linesCleared / 10) + 1;

		if (newLevel > this.level) {
			this.level = newLevel;
			// Restart game loop with new speed
			this.startGameLoop();
		}

		return this;
	},

	// Get ghost piece position (where piece will land)
	getGhostY: function() {
		if (!this.currentPiece) return this.currentY;

		var ghostY = this.currentY;
		while (this.isValidPosition(this.currentPiece, this.currentX, ghostY - 1)) {
			ghostY--;
		}
		return ghostY;
	},

	// Render the game
	render: function() {
		// Clear display
		display.clear();

		// Draw locked pieces from grid with their colors
		for (var y = 0; y < this.grid.length; y++) {
			for (var x = 0; x < this.grid[y].length; x++) {
				if (this.grid[y][x]) {
					display.get(x, y).css('background-color', this.grid[y][x]);
				}
			}
		}

		// Draw ghost piece (preview of where piece will land)
		if (this.currentPiece) {
			var ghostY = this.getGhostY();
			if (ghostY !== this.currentY) {
				display.drawGhost(this.currentPiece, this.currentX, ghostY);
			}
		}

		// Draw current piece
		if (this.currentPiece) {
			display.draw(this.currentPiece, this.currentX, this.currentY);
		}

		return this;
	}
};

var display = {
	parent: null, 
	grid: null,
	height: 20,
	width: 10,
	defaultFillColor: '#00f',
	init: function(parent) {
		this.parent = parent;
		var cells = ('<tr>'+('<td></td>'.repeat(this.width))+'</tr>').repeat(this.height);
		this.grid = $('<table>').append(cells);
		this.grid.appendTo(this.parent);
		return this;
	},
	 
	set : function (bool, x, y) {
		var color = bool?this.defaultFillColor:'';
		this.get(x,y).css('background-color', color);
		return this;
	},
	
	getValue : function (x, y) {
		return this.get(x,y).css('background-color')?true:false;
	},
	
	get : function (x,y) {
		var htmlx = x+1;
		var htmly = this.height - y;
		return $('table').find('tr:nth-child('+htmly+') > td:nth-child('+htmlx+')');
	},
	 
	draw: function(shape, x, y) {
		var todraw = shape.body;
		var that = this;
		var color = shape.color || this.defaultFillColor;
		for(var sy in todraw) {
			var line = todraw[sy];
			for(var sx in line) {
				if (line[sx]) {
					var cell = that.get(parseInt(x,10)+parseInt(sx,10), parseInt(y,10)+parseInt(sy,10));
					cell.css('background-color', color);
				}
			}
		}
		return this;
	},

	drawGhost: function(shape, x, y) {
		var todraw = shape.body;
		var that = this;
		var color = shape.color || this.defaultFillColor;
		// Convert hex to rgba for transparency
		var r = parseInt(color.substr(1,2), 16);
		var g = parseInt(color.substr(3,2), 16);
		var b = parseInt(color.substr(5,2), 16);
		var ghostColor = 'rgba('+r+','+g+','+b+',0.3)';

		for(var sy in todraw) {
			var line = todraw[sy];
			for(var sx in line) {
				if (line[sx]) {
					var cell = that.get(parseInt(x,10)+parseInt(sx,10), parseInt(y,10)+parseInt(sy,10));
					cell.css('background-color', ghostColor);
					cell.css('border-color', color);
				}
			}
		}
		return this;
	},

	clear: function() {
		this.grid.find('td').css('background-color', '');
		return this;
	}
};

// Keyboard input handler
var input = {
	init: function() {
		var that = this;
		$(document).on('keydown', function(e) {
			that.handleKeydown(e);
		});
		return this;
	},

	handleKeydown: function(e) {
		if (!game.isRunning || game.isPaused || game.isGameOver) {
			// Allow starting/pausing even when not running
			if (e.keyCode === 32) { // Space - start/pause
				if (!game.isRunning) {
					game.init().start();
					game.render();
				} else {
					game.togglePause();
				}
				e.preventDefault();
				return;
			}
			if (e.keyCode === 82) { // R - restart
				game.reset().init().start();
				game.render();
				e.preventDefault();
				return;
			}
			return;
		}

		var moved = false;
		switch(e.keyCode) {
			case 37: // Left arrow
				moved = game.moveLeft();
				break;
			case 39: // Right arrow
				moved = game.moveRight();
				break;
			case 40: // Down arrow (soft drop)
				moved = game.moveDown();
				break;
			case 38: // Up arrow (rotate)
			case 88: // X key (rotate)
				moved = game.rotate();
				break;
			case 32: // Space (hard drop)
				game.hardDrop();
				// Lock piece immediately after hard drop
				game.lockPiece();
				moved = true;
				break;
			case 67: // C key (hold piece)
				game.holdPiece();
				moved = true;
				break;
			case 80: // P key (pause)
				game.togglePause();
				e.preventDefault();
				return;
		}

		if (moved) {
			game.render();
			ui.update();
			e.preventDefault();
		}
	}
};

// UI handler for score, level, next piece display, etc.
var ui = {
	init: function() {
		this.scoreElement = $('#score');
		this.levelElement = $('#level');
		this.linesElement = $('#lines');
		this.nextPieceElement = $('#next-piece');
		this.holdPieceElement = $('#hold-piece');
		this.gameOverElement = $('#game-over');

		// Create mini grids for next and hold pieces
		this.createMiniGrid(this.nextPieceElement);
		this.createMiniGrid(this.holdPieceElement);

		return this;
	},

	createMiniGrid: function(parent) {
		var cells = ('<tr>'+('<td></td>'.repeat(4))+'</tr>').repeat(4);
		var grid = $('<table class="mini-grid">').append(cells);
		parent.append(grid);
		return grid;
	},

	update: function() {
		// Update score, level, lines
		this.scoreElement.text(game.score);
		this.levelElement.text(game.level);
		this.linesElement.text(game.linesCleared);

		// Update next piece preview
		this.updatePiecePreview(this.nextPieceElement, game.nextPiece);

		// Update hold piece preview
		this.updatePiecePreview(this.holdPieceElement, game.heldPiece);

		// Show/hide game over
		if (game.isGameOver) {
			this.gameOverElement.show();
		} else {
			this.gameOverElement.hide();
		}

		return this;
	},

	updatePiecePreview: function(container, piece) {
		var grid = container.find('table');
		grid.find('td').css('background-color', '');

		if (piece && piece.body) {
			var color = piece.color || '#00f';
			for (var sy = 0; sy < piece.body.length; sy++) {
				if (!piece.body[sy]) continue;
				for (var sx = 0; sx < piece.body[sy].length; sx++) {
					if (piece.body[sy][sx]) {
						var cell = grid.find('tr:nth-child('+(sy+1)+') > td:nth-child('+(sx+1)+')');
						cell.css('background-color', color);
					}
				}
			}
		}

		return this;
	}
};

