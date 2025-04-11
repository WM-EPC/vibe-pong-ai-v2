import Phaser from 'phaser';

// Define the Game Scene
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.playerPaddle = null; // Initialize paddle variable
        this.cursors = null; // Initialize cursor keys variable
        this.keyW = null; // Initialize W key variable
        this.keyS = null; // Initialize S key variable
        this.paddleSpeed = 400; // Pixels per second
        this.ball = null; // Initialize ball variable
        this.isDraggingPaddle = false; // Track drag state
        this.inputZone = null; // Add input zone variable
        this.activePointer = null; // Track the pointer controlling the paddle
        this.aiPaddle = null; // Initialize AI paddle variable
        this.aiPaddleSpeed = 150; // AI paddle speed (Reduced significantly for testing)

        // Score tracking
        this.playerScore = 0;
        this.aiScore = 0;
        this.playerScoreText = null;
        this.aiScoreText = null;
        this.boundsInset = 10; // Store inset value for use in update

        // Game State
        this.winningScore = 11;
        this.gameOver = false;
        this.gameOverText = null;

        // Game Start State
        this.gameStarted = false;
        this.startText = null;
    }

    preload() {
        // Load assets here (images, audio)
        console.log("Preloading assets in GameScene...");

        // Load background music
        this.load.audio('music', 'assets/audio/sample-track.mp3');
    }

    create() {
        // Set up game objects here (paddles, ball)
        console.log("Creating game objects in GameScene...");
        // Remove the placeholder text
        // this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'Vibe Pong!', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);

        // Game dimensions
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;

        // Create Player Paddle (left side)
        const paddleWidth = 15;
        const paddleHeight = 100;
        const paddleX = 100; // MOVED INWARD: Increased distance from the left edge
        const paddleY = gameHeight / 2; // Center vertically

        // Using a Graphics object to draw the rectangle first, then adding physics
        // Alternatively, you could load an image sprite
        this.playerPaddle = this.add.rectangle(paddleX, paddleY, paddleWidth, paddleHeight, 0xffffff); // White color
        this.physics.add.existing(this.playerPaddle); // Add physics body

        // Configure paddle physics
        this.playerPaddle.body.setImmovable(true); // Paddle doesn't get pushed by the ball
        this.playerPaddle.body.setCollideWorldBounds(true); // Keep paddle within game boundaries

        // --- Input Handling ---
        // Create cursor keys object
        this.cursors = this.input.keyboard.createCursorKeys();
        // Create W and S keys object
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

        // Create Input Zone (Area from left screen edge up to and including the paddle's right edge)
        const zoneWidth = paddleX + (paddleWidth / 2); // CORRECTED: Zone ends at the right edge of the paddle
        const zoneX = 0; // Start zone at the left screen edge
        this.inputZone = this.add.zone(zoneX, 0, zoneWidth, gameHeight).setOrigin(0, 0).setInteractive();
        this.input.setDraggable(this.inputZone);

        // Listen for drag START event on the input zone
        this.input.on('dragstart', (pointer, gameObject) => {
            if (gameObject === this.inputZone) { // Check if dragging the zone
                // Attempt to resume audio context on user interaction (for mobile) - MOVED TO pointerdown
                // if (this.sound.context.state === 'suspended') {
                //    this.sound.context.resume();
                // }
                this.isDraggingPaddle = true; // Set flag to override keyboard
                this.activePointer = pointer; // Track this pointer
            }
        });

        // Listen for drag END event anywhere
        this.input.on('dragend', (pointer, gameObject) => {
             // Check if the pointer ending the drag is the one we are tracking
             if (pointer === this.activePointer) {
                this.isDraggingPaddle = false;
                this.activePointer = null;
                this.playerPaddle.body.setVelocityY(0); // Stop paddle movement
            }
        });

        // Add a global pointer up listener to catch finger lifts that aren't dragend events
        this.input.on('pointerup', (pointer) => {
             // Check if the pointer being lifted is the one we are tracking
            if (pointer === this.activePointer) {
                this.isDraggingPaddle = false;
                this.activePointer = null;
                this.playerPaddle.body.setVelocityY(0); // Stop paddle movement
            }
        });

        // --- Create Ball ---
        const ballSize = 15;
        this.ball = this.add.circle(gameWidth / 2, gameHeight / 2, ballSize / 2, 0xffffff); // White circle
        this.physics.add.existing(this.ball);

        // Configure ball physics
        this.ball.body.setCollideWorldBounds(true); // Re-enabled - should respect physics.world.setBounds
        this.ball.body.setBounce(1, 1); // Still bounce off top/bottom and paddles

        // --- Adjust World Bounds for Physics & Visuals ---
        // const boundsInset = 10; // REVERTED to smaller value - safe areas handled by CSS - Stored on this now
        this.physics.world.setBounds(this.boundsInset, this.boundsInset, gameWidth - this.boundsInset * 2, gameHeight - this.boundsInset * 2);
        // Remove manual collision checks - setCollideWorldBounds handles this
        // this.ball.body.checkCollision.up = true;
        // this.ball.body.checkCollision.down = true;
        // this.ball.body.checkCollision.left = true; // Re-enabled for testing
        // this.ball.body.checkCollision.right = true; // Re-enabled for testing

        // Draw visual boundary lines
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x333333, 1); // 2px thick, dark grey, full alpha
        // Top line
        graphics.lineBetween(this.boundsInset, this.boundsInset, gameWidth - this.boundsInset, this.boundsInset);
        // Bottom line
        graphics.lineBetween(this.boundsInset, gameHeight - this.boundsInset, gameWidth - this.boundsInset, gameHeight - this.boundsInset);
        // Left line
        graphics.lineBetween(this.boundsInset, this.boundsInset, this.boundsInset, gameHeight - this.boundsInset);
        // Right line
        graphics.lineBetween(gameWidth - this.boundsInset, this.boundsInset, gameWidth - this.boundsInset, gameHeight - this.boundsInset);

        // Give the ball an initial velocity - MOVED to startGame method
        // const initialSpeedX = 200;
        // const initialSpeedY = Phaser.Math.Between(-100, 100);
        // this.ball.body.setVelocity(initialSpeedX, initialSpeedY);

        // --- Create AI Paddle (right side) ---
        const aiPaddleX = gameWidth - 100; // Position on the right
        this.aiPaddle = this.add.rectangle(aiPaddleX, paddleY, paddleWidth, paddleHeight, 0xffffff); // Use same dimensions/color for now
        this.physics.add.existing(this.aiPaddle);
        this.aiPaddle.body.setImmovable(true);
        // this.aiPaddle.body.setCollideWorldBounds(true); // Probably unnecessary and potentially causing issues?

        // --- Collisions ---
        // Ball vs Player Paddle
        this.physics.add.collider(this.ball, this.playerPaddle, this.handlePaddleBallCollision, null, this);
        // Ball vs AI Paddle
        this.physics.add.collider(this.ball, this.aiPaddle, this.handlePaddleBallCollision, null, this);

        // --- Listen for World Bounds Collision ---
        this.ball.body.onWorldBounds = true; // Enable the event for the ball specifically
        this.physics.world.on('worldbounds', this.handleWorldBoundsCollision, this);

        // --- Version Text ---
        const versionText = 'v0.1.2';
        this.add.text(10, gameHeight - 10, versionText, {
            fontSize: '12px',
            fill: '#555' // Dim color
        }).setOrigin(0, 1); // Anchor bottom-left

        // --- Score Text ---
        const scoreTextStyle = { fontSize: '48px', fill: '#fff' };
        this.playerScoreText = this.add.text(gameWidth * 0.25, 50, '0', scoreTextStyle).setOrigin(0.5);
        this.aiScoreText = this.add.text(gameWidth * 0.75, 50, '0', scoreTextStyle).setOrigin(0.5);

        // --- Setup Background Music & Audio Context Handling --- // Using Tap to Start
        this.music = this.sound.add('music', { loop: true });

        // --- Start Text & Interaction Listener ---
        this.startText = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'Tap to Start', {
            fontSize: '40px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.input.once('pointerdown', this.startGame, this);

        // Game Over Text (initially hidden)
        this.gameOverText = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, '', {
            fontSize: '64px',
            fill: '#ff0000',
            align: 'center'
        }).setOrigin(0.5).setVisible(false);
    }

    update(time, delta) {
        // --- Stop updates if game over ---
        if (this.gameOver) {
            return; // Skip paddle movement and other updates
        }

        // --- Player Paddle Movement ---

        // Stop any previous movement
        this.playerPaddle.body.setVelocityY(0);

        // --- Pointer Following Logic ---
        if (this.activePointer && this.activePointer.isDown) {
             // Calculate minY/maxY based on current paddle state
            const minY = this.playerPaddle.displayHeight / 2;
            const maxY = this.sys.game.config.height - this.playerPaddle.displayHeight / 2;
            // Get target Y from the active pointer
            const targetY = Phaser.Math.Clamp(this.activePointer.y, minY, maxY);

            // Move the player paddle physics body towards the target Y
            this.physics.moveTo(this.playerPaddle, this.playerPaddle.x, targetY, null, 75);
            // Ensure isDraggingPaddle is true while actively following
            this.isDraggingPaddle = true;
        }
        else {
             // Reset drag flag if pointer is up but somehow missed the up/end event
             if (this.isDraggingPaddle) {
                 this.isDraggingPaddle = false;
                 this.activePointer = null; // Ensure pointer is cleared
             }
            // --- Keyboard Input Fallback ---
            // Check keyboard input ONLY if not actively following a pointer
            if (this.cursors.up.isDown || this.keyW.isDown) {
                this.playerPaddle.body.setVelocityY(-this.paddleSpeed);
            }
            else if (this.cursors.down.isDown || this.keyS.isDown) {
                this.playerPaddle.body.setVelocityY(this.paddleSpeed);
            }
        }

        // --- AI Paddle Movement --- // Re-enabled
        // Basic AI: Try to follow the ball's y position with a slight lag/max speed
        const yDiff = this.ball.y - this.aiPaddle.y;

        if (Math.abs(yDiff) > this.aiPaddle.displayHeight * 0.1) { // Only move if ball is significantly different
            if (yDiff < 0) {
                // Ball is higher, move up
                this.aiPaddle.body.setVelocityY(-this.aiPaddleSpeed);
            }
            else {
                // Ball is lower, move down
                this.aiPaddle.body.setVelocityY(this.aiPaddleSpeed);
            }
        }
         else {
             // Ball is close, stop moving
             this.aiPaddle.body.setVelocityY(0);
         }

        // --- Other game loop logic ---
        // (collision, etc. will go here later)
    }

    startGame() {
        // Guard against multiple starts if pointerdown fires rapidly
        if (this.gameStarted) return;
        this.gameStarted = true;

        // Hide start text
        this.startText.setVisible(false);

        // --- Try to unlock/play audio ---
        console.log('Start interaction detected. Context state:', this.sound.context.state);
        if (this.sound.context.state === 'suspended') {
            console.log('Attempting to resume audio context...');
            this.sound.context.resume().then(() => {
                console.log('Audio Context Resumed successfully on interaction.');
                if (this.music) {
                    this.music.play();
                }
            }).catch(e => {
                console.error('Audio context resume failed:', e);
            });
        } else {
            // Context already running, play music if loaded
            if (this.music) {
                 this.music.play();
            }
        }

        // Serve the ball for the first time
        this.resetBall(Math.random() < 0.5); // Serve randomly initially
    }

    handlePaddleBallCollision(ball, paddle) {
        // console.log("Ball hit paddle"); // Changed log message slightly
        let diff = 0;
        const currentSpeedX = Math.abs(ball.body.velocity.x); // Store current X speed magnitude
        const maxDeflectionSpeedY = currentSpeedX * 1.5; // Limit vertical speed change relative to horizontal
        let newSpeedY = 0;

        // Calculate vertical deflection based on hit position
        if (ball.y < paddle.y) {
            diff = paddle.y - ball.y;
            newSpeedY = Phaser.Math.Clamp(-10 * diff, -maxDeflectionSpeedY, -50);
        }
        else if (ball.y > paddle.y) {
            diff = ball.y - paddle.y;
            newSpeedY = Phaser.Math.Clamp(10 * diff, 50, maxDeflectionSpeedY);
        }
        else {
            newSpeedY = Phaser.Math.Between(-50, 50); // Slight random angle on center hits
        }

        // Set velocity: Reverse X direction based on which paddle was hit
        if (paddle === this.playerPaddle) {
            ball.body.setVelocity(currentSpeedX, newSpeedY); // Bounce right
        }
        else if (paddle === this.aiPaddle) {
            ball.body.setVelocity(-currentSpeedX, newSpeedY); // Bounce left
        }

        // Optional: Increase ball speed slightly on each hit (uncomment to enable)
        // ball.body.velocity.scale(1.05);
    }

    handleWorldBoundsCollision(body, up, down, left, right) {
        // Check if it was the ball hitting the left or right boundary
        if (body === this.ball.body && !this.gameOver) { // Only process if game isn't over
            let scorer = null; // 'player' or 'ai'

            if (left) {
                // AI scored
                this.aiScore++;
                this.aiScoreText.setText(this.aiScore);
                scorer = 'ai';
            }
            else if (right) {
                // Player scored
                this.playerScore++;
                this.playerScoreText.setText(this.playerScore);
                scorer = 'player';
            }

            // Check for win condition
            if (this.playerScore >= this.winningScore || this.aiScore >= this.winningScore) {
                this.endGame(scorer);
            }
            // If no winner yet, reset the ball
            else if (scorer) {
                 this.resetBall(scorer === 'ai'); // Serve to player if AI scored, else serve to AI
            }
        }
    }

    resetBall(serveToPlayer) {
         // Check if game is already over (prevents race condition with delayed call)
         if (this.gameOver) return;

        // Stop the ball and make it invisible immediately
        this.ball.body.stop(); // More comprehensive stop than just velocity
        this.ball.setVisible(false);

        // Wait 1 second before respawning and serving
        this.time.delayedCall(1000, () => {
            // Random initial Y speed
            const initialSpeedY = Phaser.Math.Between(-100, 100);
            // Serve direction based on who scored
            const initialSpeedX = serveToPlayer ? -200 : 200;

            // Make ball visible again AT the center position
            this.ball.setPosition(this.sys.game.config.width / 2, this.sys.game.config.height / 2);
            this.ball.setVisible(true);

            // Serve immediately
            this.ball.body.setVelocity(initialSpeedX, initialSpeedY);
        });
    }

    endGame(winner) {
        this.gameOver = true;
        this.ball.body.stop();
        this.ball.setVisible(false);

        // Stop paddles as well
        this.playerPaddle.body.stop();
        this.aiPaddle.body.stop();

        let message = '';
        if (winner === 'player') {
            message = 'You Win!';
        }
        else {
            message = 'AI Wins!';
        }

        this.gameOverText.setText(message);
        this.gameOverText.setVisible(true);

        // Optional: Could add a delay then restart option here later
    }
}

// Phaser Game Configuration
const config = {
    type: Phaser.AUTO, // Automatically choose WebGL or Canvas
    scale: {
        mode: Phaser.Scale.FIT, // Fit the game within the screen, preserving aspect ratio
        autoCenter: Phaser.Scale.CENTER_BOTH, // Center the game canvas
        width: 800, // Design width (game world coordinates)
        height: 600 // Design height (game world coordinates)
    },
    parent: 'game-container', // Optional: Specify a div ID if you have one
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // No gravity needed for Pong
            debug: false // DISABLED physics debugging
        }
    },
    scene: [GameScene] // Add the scene to the configuration
};

// Initialize the Game
const game = new Phaser.Game(config); 