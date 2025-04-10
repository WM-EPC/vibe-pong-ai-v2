import Phaser from 'phaser';

// Define the Game Scene
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.playerPaddle = null; // Initialize paddle variable
    }

    preload() {
        // Load assets here (images, audio)
        console.log("Preloading assets in GameScene...");
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
        const paddleX = 50; // Distance from the left edge
        const paddleY = gameHeight / 2; // Center vertically

        // Using a Graphics object to draw the rectangle first, then adding physics
        // Alternatively, you could load an image sprite
        this.playerPaddle = this.add.rectangle(paddleX, paddleY, paddleWidth, paddleHeight, 0xffffff); // White color
        this.physics.add.existing(this.playerPaddle); // Add physics body

        // Configure paddle physics
        this.playerPaddle.body.setImmovable(true); // Paddle doesn't get pushed by the ball
        this.playerPaddle.body.setCollideWorldBounds(true); // Keep paddle within game boundaries
    }

    update() {
        // Game loop logic here (input, movement, collision)
    }
}

// Phaser Game Configuration
const config = {
    type: Phaser.AUTO, // Automatically choose WebGL or Canvas
    width: 800,
    height: 600,
    parent: 'game-container', // Optional: Specify a div ID if you have one
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // No gravity needed for Pong
            debug: false // Set to true for physics debugging visuals
        }
    },
    scene: [GameScene] // Add the scene to the configuration
};

// Initialize the Game
const game = new Phaser.Game(config); 