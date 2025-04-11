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

        // Audio State
        this.music = null; // Will be created on demand
        this.audioInitialized = false;
        this.soundButton = null;
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

        // Game dimensions
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;

        // Create Player Paddle (left side)
        const paddleWidth = 15;
        const paddleHeight = 100;
        const paddleX = 100; // MOVED INWARD: Increased distance from the left edge
        const paddleY = gameHeight / 2; // Center vertically

        this.playerPaddle = this.add.rectangle(paddleX, paddleY, paddleWidth, paddleHeight, 0xffffff); // White color
        this.physics.add.existing(this.playerPaddle); // Add physics body

        // Configure paddle physics
        this.playerPaddle.body.setImmovable(true); // Paddle doesn't get pushed by the ball
        this.playerPaddle.body.setCollideWorldBounds(true); // Keep paddle within game boundaries

        // --- Input Handling ---
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

        const zoneWidth = paddleX + (paddleWidth / 2);
        const zoneX = 0;
        this.inputZone = this.add.zone(zoneX, 0, zoneWidth, gameHeight).setOrigin(0, 0).setInteractive();
        this.input.setDraggable(this.inputZone);

        this.input.on('dragstart', (pointer, gameObject) => {
            if (gameObject === this.inputZone) {
                this.isDraggingPaddle = true;
                this.activePointer = pointer;
            }
        });

        this.input.on('dragend', (pointer, gameObject) => {
             if (pointer === this.activePointer) {
                this.isDraggingPaddle = false;
                this.activePointer = null;
                this.playerPaddle.body.setVelocityY(0);
            }
        });

        this.input.on('pointerup', (pointer) => {
            if (pointer === this.activePointer) {
                this.isDraggingPaddle = false;
                this.activePointer = null;
                this.playerPaddle.body.setVelocityY(0);
            }
        });

        // --- Create Ball ---
        const ballSize = 15;
        this.ball = this.add.circle(gameWidth / 2, gameHeight / 2, ballSize / 2, 0xffffff);
        this.physics.add.existing(this.ball);

        // Configure ball physics
        this.ball.body.setCollideWorldBounds(true); // Re-enabled - should respect physics.world.setBounds
        this.ball.body.setBounce(1, 1);

        // --- Adjust World Bounds for Physics & Visuals ---
        this.physics.world.setBounds(this.boundsInset, this.boundsInset, gameWidth - this.boundsInset * 2, gameHeight - this.boundsInset * 2);

        // Draw visual boundary lines
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x333333, 1);
        graphics.lineBetween(this.boundsInset, this.boundsInset, gameWidth - this.boundsInset, this.boundsInset);
        graphics.lineBetween(this.boundsInset, gameHeight - this.boundsInset, gameWidth - this.boundsInset, gameHeight - this.boundsInset);
        graphics.lineBetween(this.boundsInset, this.boundsInset, this.boundsInset, gameHeight - this.boundsInset);
        graphics.lineBetween(gameWidth - this.boundsInset, this.boundsInset, gameWidth - this.boundsInset, gameHeight - this.boundsInset);

        // Give the ball an initial velocity - RE-ADDED for this revert
        const initialSpeedX = 200;
        const initialSpeedY = Phaser.Math.Between(-100, 100);
        this.ball.body.setVelocity(initialSpeedX, initialSpeedY);

        // --- Create AI Paddle (right side) ---
        const aiPaddleX = gameWidth - 100;
        this.aiPaddle = this.add.rectangle(aiPaddleX, paddleY, paddleWidth, paddleHeight, 0xffffff);
        this.physics.add.existing(this.aiPaddle);
        this.aiPaddle.body.setImmovable(true);

        // --- Collisions ---
        this.physics.add.collider(this.ball, this.playerPaddle, this.handlePaddleBallCollision, null, this);
        this.physics.add.collider(this.ball, this.aiPaddle, this.handlePaddleBallCollision, null, this);

        // --- Listen for World Bounds Collision ---
        this.ball.body.onWorldBounds = true;
        this.physics.world.on('worldbounds', this.handleWorldBoundsCollision, this);

        // --- Version Text ---
        const versionText = 'v0.1.2'; // Keep version for now
        this.add.text(10, gameHeight - 10, versionText, {
            fontSize: '12px',
            fill: '#555'
        }).setOrigin(0, 1);

        // --- Score Text ---
        const scoreTextStyle = { fontSize: '48px', fill: '#fff' };
        this.playerScoreText = this.add.text(gameWidth * 0.25, 50, '0', scoreTextStyle).setOrigin(0.5);
        this.aiScoreText = this.add.text(gameWidth * 0.75, 50, '0', scoreTextStyle).setOrigin(0.5);

        // --- Sound Toggle Button ---
        const soundButtonTextStyle = { fontSize: '18px', fill: '#fff', backgroundColor: '#555', padding: { left: 5, right: 5, top: 2, bottom: 2 } };
        this.soundButton = this.add.text(gameWidth - this.boundsInset, this.boundsInset, '[SOUND ON]', soundButtonTextStyle)
            .setOrigin(1, 0) // Anchor top-right relative to bounds inset
            .setInteractive();

        this.soundButton.on('pointerdown', this.toggleSound, this);

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
            return;
        }

        // --- Player Paddle Movement ---
        this.playerPaddle.body.setVelocityY(0);

        if (this.activePointer && this.activePointer.isDown) {
            const minY = this.playerPaddle.displayHeight / 2;
            const maxY = this.sys.game.config.height - this.playerPaddle.displayHeight / 2;
            const targetY = Phaser.Math.Clamp(this.activePointer.y, minY, maxY);
            this.physics.moveTo(this.playerPaddle, this.playerPaddle.x, targetY, null, 75);
            this.isDraggingPaddle = true;
        }
        else {
             if (this.isDraggingPaddle) {
                 this.isDraggingPaddle = false;
                 this.activePointer = null;
             }
            if (this.cursors.up.isDown || this.keyW.isDown) {
                this.playerPaddle.body.setVelocityY(-this.paddleSpeed);
            }
            else if (this.cursors.down.isDown || this.keyS.isDown) {
                this.playerPaddle.body.setVelocityY(this.paddleSpeed);
            }
        }

        // --- AI Paddle Movement ---
        const yDiff = this.ball.y - this.aiPaddle.y;

        if (Math.abs(yDiff) > this.aiPaddle.displayHeight * 0.1) {
            if (yDiff < 0) {
                this.aiPaddle.body.setVelocityY(-this.aiPaddleSpeed);
            }
            else {
                this.aiPaddle.body.setVelocityY(this.aiPaddleSpeed);
            }
        }
         else {
             this.aiPaddle.body.setVelocityY(0);
         }
    }

    handlePaddleBallCollision(ball, paddle) {
        let diff = 0;
        const currentSpeedX = Math.abs(ball.body.velocity.x);
        const maxDeflectionSpeedY = currentSpeedX * 1.5;
        let newSpeedY = 0;

        if (ball.y < paddle.y) {
            diff = paddle.y - ball.y;
            newSpeedY = Phaser.Math.Clamp(-10 * diff, -maxDeflectionSpeedY, -50);
        }
        else if (ball.y > paddle.y) {
            diff = ball.y - paddle.y;
            newSpeedY = Phaser.Math.Clamp(10 * diff, 50, maxDeflectionSpeedY);
        }
        else {
            newSpeedY = Phaser.Math.Between(-50, 50);
        }

        if (paddle === this.playerPaddle) {
            ball.body.setVelocity(currentSpeedX, newSpeedY);
        }
        else if (paddle === this.aiPaddle) {
            ball.body.setVelocity(-currentSpeedX, newSpeedY);
        }
    }

    handleWorldBoundsCollision(body, up, down, left, right) {
        if (body === this.ball.body && !this.gameOver) {
            let scorer = null;

            if (left) {
                this.aiScore++;
                this.aiScoreText.setText(this.aiScore);
                scorer = 'ai';
            }
            else if (right) {
                this.playerScore++;
                this.playerScoreText.setText(this.playerScore);
                scorer = 'player';
            }

            if (this.playerScore >= this.winningScore || this.aiScore >= this.winningScore) {
                this.endGame(scorer);
            }
            else if (scorer) {
                 this.resetBall(scorer === 'ai');
            }
        }
    }

    resetBall(serveToPlayer) {
         if (this.gameOver) return;

        this.ball.body.stop();
        this.ball.setVisible(false);

        this.time.delayedCall(1000, () => {
            const initialSpeedY = Phaser.Math.Between(-100, 100);
            const initialSpeedX = serveToPlayer ? -200 : 200;
            this.ball.setPosition(this.sys.game.config.width / 2, this.sys.game.config.height / 2);
            this.ball.setVisible(true);
            this.ball.body.setVelocity(initialSpeedX, initialSpeedY);
        });
    }

    endGame(winner) {
        this.gameOver = true;
        this.ball.body.stop();
        this.ball.setVisible(false);
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
    }

    toggleSound() {
        console.log("toggleSound() called!"); // DEBUG: Check if function is triggered
        if (!this.audioInitialized) {
            // --- First time: Initialize and try to play ---
            this.audioInitialized = true;

            // Check if music object already exists (shouldn't, but safe check)
            if (!this.music) {
                this.music = this.sound.add('music', { loop: true });
            }

            // Check context state and attempt play
            if (this.sound.context.state === 'suspended') {
                console.log('Attempting to resume audio context via button...');
                this.sound.context.resume().then(() => {
                    console.log('Audio Context Resumed successfully via button.');
                    if (this.music) {
                        this.music.play();
                        this.soundButton.setText('[SOUND OFF]');
                        this.music.setMute(false); // Explicitly unmute
                    }
                }).catch(e => {
                    console.error('Audio context resume failed:', e);
                    // Keep button text as [SOUND ON] or show error?
                    this.soundButton.setText('[AUDIO ERR]');
                });
            } else if (this.sound.context.state === 'running') {
                 console.log('Audio context already running, playing music.');
                // Context already running, play music if loaded and not playing
                if (this.music) {
                    this.music.play();
                    this.soundButton.setText('[SOUND OFF]');
                    this.music.setMute(false); // Explicitly unmute
                }
            }
        } else {
            // --- Subsequent times: Toggle mute ---
            if (this.music) { // Check if music exists (it should)
                this.music.setMute(!this.music.mute);
                this.soundButton.setText(this.music.mute ? '[SOUND ON]' : '[SOUND OFF]');
            }
        }
    }
}

// Phaser Game Configuration
const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600
    },
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false // DISABLED physics debugging
        }
    },
    scene: [GameScene]
};

// Initialize the Game
const game = new Phaser.Game(config); 