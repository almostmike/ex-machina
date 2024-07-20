// Game variables
let currentRound = 1;
let score = 0;
let sequence = [];
let playerInput = [];
const directions = ['up', 'down', 'left', 'right'];
const initialSequenceLength = 3; // Changed to start with 3 instead of 4

// Volume controls
const VOLUME_SETTINGS = {
    themeSong: 0.25,
    beepSounds: 1,
    roundStartSounds: 1,
    gameOverSound: 1,
    roundWinSounds: 1
};

// Audio elements
const themeSong = new Audio('sounds/theme.mp3');
themeSong.loop = true;
themeSong.volume = VOLUME_SETTINGS.themeSong;

const roundStartSounds = [
    new Audio('sounds/1.mp3'),
    new Audio('sounds/2.mp3'),
    new Audio('sounds/5.mp3')
];
const gameOverSound = new Audio('sounds/3.mp3');
const roundWinSounds = [
    new Audio('sounds/4.mp3'),
    new Audio('sounds/6.mp3')
];

// Apply volume settings to other sounds
roundStartSounds.forEach(sound => sound.volume = VOLUME_SETTINGS.roundStartSounds);
gameOverSound.volume = VOLUME_SETTINGS.gameOverSound;
roundWinSounds.forEach(sound => sound.volume = VOLUME_SETTINGS.roundWinSounds);

// Function to create a beep sound
function createBeepSound(frequency) {
    return () => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(VOLUME_SETTINGS.beepSounds, audioContext.currentTime);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
    };
}

// Directional beep sounds (frequencies adjusted for better audibility)
const beepSounds = {
    up: createBeepSound(329.63),    // E4
    down: createBeepSound(261.63),  // C4
    left: createBeepSound(196.00),  // G3
    right: createBeepSound(220.00)  // A3 (changed from 130.81)
};

// Game elements
const splashScreen = document.getElementById('splash-screen');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startButton = document.getElementById('start-button');
const submitButton = document.getElementById('submit-sequence');
const playAgainButton = document.getElementById('play-again-button');
const sequenceDisplay = document.getElementById('sequence-display');
const sequenceInput = document.getElementById('sequence-input');
const roundDisplay = document.getElementById('round-display');
const scoreDisplay = document.getElementById('score-display');

// Event listeners
startButton.addEventListener('click', startGame);
submitButton.addEventListener('click', checkSequence);
playAgainButton.addEventListener('click', startGame);

// Keyboard handler
function handleKeydown(event) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault(); // Prevent scrolling
        let arrow;
        switch(event.key) {
            case 'ArrowUp': arrow = '↑'; break;
            case 'ArrowDown': arrow = '↓'; break;
            case 'ArrowLeft': arrow = '←'; break;
            case 'ArrowRight': arrow = '→'; break;
        }
        if (arrow && sequenceInput.value.length < sequence.length) {
            sequenceInput.value += arrow;
            console.log('Arrow key pressed:', arrow);
        }
        if (sequenceInput.value.length === sequence.length) {
            console.log('Sequence complete, checking...');
            document.removeEventListener('keydown', handleKeydown);
            checkSequence();
        }
    }
}

// Function to start background music
function startBackgroundMusic() {
    themeSong.play().catch(e => console.error('Error playing theme song:', e));
}

function startGame() {
    currentRound = 1;
    score = 0;
    splashScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    updateScore();
    startBackgroundMusic();
    startRound();
}

// Function to start a new round
function startRound() {
    document.removeEventListener('keydown', handleKeydown);

    roundDisplay.textContent = `ROUND ${currentRound}`;
    
    // Adjust sequence length based on round number
    let sequenceLength;
    if (currentRound < 6) {
        sequenceLength = 2 + currentRound; // Starts at 3 for Round 1, increases by 1 each round
    } else {
        sequenceLength = (currentRound - 5) + 2; // Resets to 3 at Round 6, then increases
    }
    
    sequence = generateSequence(sequenceLength);
    
    // Disable input during the round start
    sequenceInput.disabled = true;
    
    // Play a random start round sound
    playRandomSound(roundStartSounds);
    
    // Wait for 2000ms before starting the sequence
    setTimeout(() => {
        displaySequence();
    }, 2000);
}

// Function to generate a random sequence
function generateSequence(length) {
    return Array.from({length}, () => directions[Math.floor(Math.random() * directions.length)]);
}

function displaySequence() {
    sequenceDisplay.innerHTML = '';
    sequenceInput.disabled = true;
    sequenceInput.value = '';
    let i = 0;
    const intervalId = setInterval(() => {
        if (i < sequence.length) {
            const img = document.createElement('img');
            img.src = `images/${sequence[i]}${currentRound > 5 ? '_rand_' + Math.floor(Math.random() * 3 + 1) : ''}.jpg`;
            sequenceDisplay.innerHTML = '';
            sequenceDisplay.appendChild(img);
            beepSounds[sequence[i]]();
            i++;
        } else {
            clearInterval(intervalId);
            sequenceDisplay.innerHTML = 'Your turn!';
            sequenceInput.disabled = false;
            sequenceInput.focus();
            console.log('Sequence finished, input enabled');
            document.addEventListener('keydown', handleKeydown);
        }
    }, 1000);
}

// Function to check the player's input
function checkSequence() {
    console.log('Player input:', sequenceInput.value);
    console.log('Expected sequence:', sequence);
    
    playerInput = sequenceInput.value.split('').map(char => {
        switch(char) {
            case '↑': return 'up';
            case '↓': return 'down';
            case '←': return 'left';
            case '→': return 'right';
            default: return '';
        }
    }).filter(dir => dir !== '');

    if (playerInput.length !== sequence.length) {
        endGame();
        return;
    }

    for (let i = 0; i < sequence.length; i++) {
        if (playerInput[i] !== sequence[i]) {
            endGame();
            return;
        }
    }

    score += 50 * sequence.length + 100;
    updateScore();
    currentRound++;
    
    // Play the round win sound
    playRandomSound(roundWinSounds);
    
    // Display a "Round Complete" message
    sequenceDisplay.innerHTML = 'Round Complete!';
    
    // Wait for 2000ms before starting the next round
    setTimeout(() => {
        startRound();
    }, 2000);
}

// Function to update the score display
function updateScore() {
    scoreDisplay.textContent = `Points: ${score}`;
}

// Function to end the game
function endGame() {
    gameOverSound.play();
    gameScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    document.getElementById('final-score').textContent = `Final Score: ${score}`;
    document.getElementById('highest-level').textContent = `Highest Level: ${currentRound}`;
}

// Function to preload images
function preloadImages() {
    directions.forEach(dir => {
        const img = new Image();
        img.src = `images/${dir}.jpg`;
    });
    for (let i = 1; i <= 3; i++) {
        directions.forEach(dir => {
            const img = new Image();
            img.src = `images/${dir}_rand_${i}.jpg`;
        });
    }
}

// Function to play a random sound from an array
function playRandomSound(soundArray) {
    const randomIndex = Math.floor(Math.random() * soundArray.length);
    soundArray[randomIndex].play();
}

// Preload images when the script loads
preloadImages();

// Debug information
console.log("JavaScript file loaded");