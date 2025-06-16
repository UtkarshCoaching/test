const questions = [
    {
        image: 'https://i.ibb.co/LdQ0616/pyramids.webp', // আপনার ছবির URL এখানে দিন
        options: ['পিরামিড', 'এম্পায়ার স্টেট বিল্ডিং', 'বুর্জ খলিফা', 'আইফেল টাওয়ার'],
        correctAnswer: 'পিরামিড'
    },
    {
        image: 'https://i.ibb.co/VMy16qF/eiffel-tower.webp',
        options: ['আইফেল টাওয়ার', 'বিগ বেন', 'কুতুব মিনার', 'স্ট্যাচু অফ লিবার্টি'],
        correctAnswer: 'আইফেল টাওয়ার'
    },
    {
        image: 'https://i.ibb.co/mG7XjQ4/great-wall.webp',
        options: ['তাজমহল', 'চীনের প্রাচীর', 'পিরামিড', 'কলোসিয়াম'],
        correctAnswer: 'চীনের প্রাচীর'
    },
    {
        image: 'https://i.ibb.co/C07hV32/taj-mahal.webp',
        options: ['লন্ডন ব্রিজ', 'আইফেল টাওয়ার', 'তাজমহল', 'সিডনি অপেরা হাউস'],
        correctAnswer: 'তাজমহল'
    },
    {
        image: 'https://i.ibb.co/K2Pq019/statue-of-liberty.webp',
        options: ['ক্রাইস্ট দ্য রিডিমার', 'স্ট্যাচু অফ লিবার্টি', 'ডেভিড', 'ভেনাস দে মিলো'],
        correctAnswer: 'স্ট্যাচু অফ লিবার্টি'
    }
];

let currentQuestionIndex = 0;
let score = 0;
let correctCount = 0;
let wrongCount = 0;
let skippedCount = 0;
let selectedOption = null;
let answeredQuestions = new Array(questions.length).fill(false); // To track if a question has been answered
let questionTimerInterval; // Timer for each question
const questionTimeLimit = 30; // Time limit for each question in seconds
let questionTimeLeft; // Remaining time for current question

const startScreen = document.getElementById('startScreen');
const quizScreen = document.getElementById('quizScreen');
const resultScreen = document.getElementById('resultScreen');

const totalQuestionsInfo = document.getElementById('totalQuestionsInfo');
const fullMarksInfo = document.getElementById('fullMarksInfo');
const timeLimitInfo = document.getElementById('timeLimitInfo'); // This info will not be visible on quiz screen directly

const scoreDisplayElem = document.getElementById('scoreDisplay'); // For SCORE: 0
const questionIndexDisplayElem = document.getElementById('questionIndexDisplay'); // For 1 / 37

const questionImageElem = document.getElementById('questionImage'); // Changed back to questionImageElem
const optionsContainer = document.getElementById('optionsContainer');
const feedbackMessage = document.getElementById('feedbackMessage'); // This will be kept but its text will be empty
const nextButton = document.getElementById('nextButton');
const skipButton = document.getElementById('skipButton');

// Dynamically create submit button (if it's not already in HTML)
let submitButton = document.getElementById('submitButton');
if (!submitButton) {
    const controlsDiv = document.querySelector('.controls');
    submitButton = document.createElement('button');
    submitButton.classList.add('button', 'navigation-button', 'submit-button');
    submitButton.textContent = 'Submit';
    submitButton.id = 'submitButton';
    controlsDiv.appendChild(submitButton);
}


const questionTimerTextElem = document.getElementById('questionTimer'); // Question timer text
const progressRingBar = document.querySelector('.progress-ring-bar'); // SVG circle for progress
const circumference = 2 * Math.PI * 32; // 2 * PI * radius (radius is 32 for the SVG circle)

// Initialize progress ring bar
progressRingBar.style.strokeDasharray = circumference;
progressRingBar.style.strokeDashoffset = circumference;


// Set initial info on start screen
totalQuestionsInfo.textContent = questions.length;
fullMarksInfo.textContent = questions.length; // 1 mark per question
// Assuming a total time for the quiz, e.g., 5 minutes for 37 questions
// If total time is not relevant for this image-based quiz, you can remove it from start screen
timeLimitInfo.textContent = Math.ceil(questions.length * questionTimeLimit / 60); // Example: total time based on question time limits

// Event Listeners
startButton.addEventListener('click', startQuiz);
nextButton.addEventListener('click', handleNextQuestion);
skipButton.addEventListener('click', handleSkipQuestion);
submitButton.addEventListener('click', handleSubmitQuiz);


function startQuiz() {
    startScreen.classList.remove('active');
    quizScreen.classList.add('active');
    loadQuestion();
    scoreDisplayElem.textContent = score; // Initialize score display
}


function updateQuestionTimerDisplay() {
    questionTimerTextElem.textContent = questionTimeLeft;

    const offset = circumference - (questionTimeLeft / questionTimeLimit) * circumference;
    progressRingBar.style.strokeDashoffset = offset;

    // Change color based on time left
    if (questionTimeLeft <= 10) {
        progressRingBar.style.stroke = '#FF6347'; // Tomato red
    } else if (questionTimeLeft <= 20) {
        progressRingBar.style.stroke = '#FFD700'; // Gold yellow
    } else {
        progressRingBar.style.stroke = '#28a745'; // Green
    }
}

function startQuestionTimer() {
    clearInterval(questionTimerInterval); // Clear any existing question timer
    questionTimeLeft = questionTimeLimit;
    updateQuestionTimerDisplay(); // Initial display
    questionTimerInterval = setInterval(() => {
        questionTimeLeft--;
        updateQuestionTimerDisplay();
        if (questionTimeLeft <= 0) {
            clearInterval(questionTimerInterval);
            handleTimeUp();
        }
    }, 1000);
}

// Function to shuffle an array (Fisher-Yates shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
}

function loadQuestion() {
    if (currentQuestionIndex >= questions.length) {
        handleSubmitQuiz();
        return;
    }
    clearInterval(questionTimerInterval); // Clear timer for previous question
    startQuestionTimer(); // Start timer for current question

    const currentQuestion = questions[currentQuestionIndex];
    questionIndexDisplayElem.textContent = `${currentQuestionIndex + 1} / ${questions.length}`;

    questionImageElem.src = currentQuestion.image;
    optionsContainer.innerHTML = ''; // Clear previous options
    feedbackMessage.textContent = ''; // Clear feedback message
    feedbackMessage.style.color = 'transparent'; // Make feedback message text invisible
    selectedOption = null; // Reset selected option

    nextButton.style.display = 'none'; // Hide next button initially
    skipButton.style.display = 'inline-block'; // Show skip button
    submitButton.style.display = 'none'; // Hide submit button initially (will be shown on last question or if quiz ends)

    if (currentQuestionIndex === questions.length - 1) { // If it's the last question
        submitButton.style.display = 'inline-block'; // Show submit button
        nextButton.style.display = 'none'; // Hide next button
        skipButton.style.display = 'none'; // Hide skip button on last question
    }

    // Shuffle options before displaying them
    const shuffledOptions = [...currentQuestion.options]; // Create a copy to shuffle
    shuffleArray(shuffledOptions);

    shuffledOptions.forEach(option => { // Use shuffledOptions here
        const button = document.createElement('button');
        button.classList.add('option');
        button.textContent = option;
        button.addEventListener('click', () => selectOption(button, option));
        optionsContainer.appendChild(button);
    });

    enableOptions(); // Enable options for new question
}


function selectOption(selectedButton, selectedAnswer) {
    if (answeredQuestions[currentQuestionIndex]) return; // Do nothing if already answered

    clearInterval(questionTimerInterval); // Stop the timer when an option is selected

    disableOptions(); // Disable all options after one is selected

    const currentQuestion = questions[currentQuestionIndex];
    const correctAnswer = currentQuestion.correctAnswer;

    selectedButton.classList.add('selected'); // Mark the selected option

    if (selectedAnswer === correctAnswer) {
        // Correct answer
        selectedButton.classList.add('correct');
        score += 1;
        correctCount++;
        feedbackMessage.textContent = 'সঠিক উত্তর!';
        feedbackMessage.style.color = '#28a745'; // Green color for correct
    } else {
        // Wrong answer
        selectedButton.classList.add('wrong');
        score -= 0.33; // Deduct marks for wrong answer
        wrongCount++;
        feedbackMessage.textContent = `ভুল উত্তর। সঠিক উত্তর: ${correctAnswer}`;
        feedbackMessage.style.color = '#dc3545'; // Red color for wrong
        
        // Highlight the correct answer
        Array.from(optionsContainer.children).forEach(optionBtn => {
            if (optionBtn.textContent === correctAnswer) {
                optionBtn.classList.add('correct');
            }
        });
    }

    scoreDisplayElem.textContent = score.toFixed(2); // Update score display
    answeredQuestions[currentQuestionIndex] = true; // Mark question as answered

    nextButton.style.display = 'inline-block'; // Show next button after selection
    skipButton.style.display = 'none'; // Hide skip button
    submitButton.style.display = (currentQuestionIndex === questions.length - 1) ? 'inline-block' : 'none';
}


function handleTimeUp() {
    if (answeredQuestions[currentQuestionIndex]) return; // Do nothing if already answered

    skippedCount++; // Count as skipped if time runs out
    answeredQuestions[currentQuestionIndex] = true; // Mark as answered (skipped)
    
    showAnswer(); // Show the correct answer
    disableOptions(); // Disable options
    
    // After a short delay, move to the next question
    setTimeout(() => {
        currentQuestionIndex++;
        loadQuestion();
    }, 2000); // Wait for 2 seconds to show the answer
}

function showAnswer() {
    const currentQuestion = questions[currentQuestionIndex];
    const correctAnswer = currentQuestion.correctAnswer;

    Array.from(optionsContainer.children).forEach(optionBtn => {
        optionBtn.style.pointerEvents = 'none'; // Disable clicking
        if (optionBtn.textContent === correctAnswer) {
            optionBtn.classList.add('correct'); // Highlight correct answer
        }
    });
    feedbackMessage.textContent = `সঠিক উত্তর: ${correctAnswer}`; // Updated feedback for both skip and time up
    feedbackMessage.style.color = '#ffc107'; // Yellow color for time up/skipped message
    
    nextButton.style.display = 'inline-block'; // Show next button
    skipButton.style.display = 'none'; // Hide skip button
    submitButton.style.display = (currentQuestionIndex === questions.length - 1) ? 'inline-block' : 'none';
}


function disableOptions() {
    Array.from(optionsContainer.children).forEach(opt => {
        opt.style.pointerEvents = 'none'; // Disable clicking
    });
}

function enableOptions() {
    Array.from(optionsContainer.children).forEach(opt => {
        opt.style.pointerEvents = 'auto'; // Enable clicking
        opt.classList.remove('selected', 'correct', 'wrong'); // Remove any previous styling
    });
}


function handleNextQuestion() {
    // If current question was not answered (e.g., manually skipped or time up and not selected)
    // This check is actually redundant now since handleTimeUp and handleSkipQuestion mark it as answered.
    // However, keeping it doesn't harm.
    if (!answeredQuestions[currentQuestionIndex]) {
         // This block might not be hit if handleTimeUp or handleSkipQuestion already ran.
         // If it's hit, it means the user clicked Next without selecting/skipping/time-up first.
         // In such a scenario, it should still be counted as skipped.
        skippedCount++;
        answeredQuestions[currentQuestionIndex] = true;
    }
    currentQuestionIndex++;
    loadQuestion();
}

function handleSkipQuestion() {
    if (!answeredQuestions[currentQuestionIndex]) { // Only skip if not already answered
        clearInterval(questionTimerInterval); // Stop the timer
        skippedCount++; // Increment skipped count
        answeredQuestions[currentQuestionIndex] = true; // Mark as answered (skipped)
        
        showAnswer(); // Show the correct answer immediately
        disableOptions(); // Disable options
        
        // After a short delay, move to the next question
        setTimeout(() => {
            currentQuestionIndex++;
            loadQuestion();
        }, 2000); // Wait for 2 seconds to show the answer
    }
}


function handleSubmitQuiz() {
    clearInterval(questionTimerInterval); // Clear question timer
    quizScreen.classList.remove('active');
    resultScreen.classList.add('active');

    document.getElementById('finalTotalQuestions').textContent = questions.length;
    document.getElementById('correctAnswers').textContent = correctCount;
    document.getElementById('wrongAnswers').textContent = wrongCount;
    document.getElementById('skippedQuestions').textContent = skippedCount;
    document.getElementById('finalScore').textContent = score.toFixed(2);
    document.getElementById('finalFullMarks').textContent = questions.length;
}