const cards = window.VOCAB_2026_06_23;

const STORAGE_KEY = "learnspanishart-2026-06-23";

let currentIndex = 0;
let flipped = false;

const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

const flashcard = document.getElementById("flashcard");
const spanishWord = document.getElementById("spanishWord");
const englishWord = document.getElementById("englishWord");
const wordType = document.getElementById("wordType");
const answerInput = document.getElementById("answerInput");
const judgement = document.getElementById("judgement");

const progressText = document.getElementById("progressText");
const scoreText = document.getElementById("scoreText");
const progressFill = document.getElementById("progressFill");

const checkBtn = document.getElementById("checkBtn");
const knowBtn = document.getElementById("knowBtn");
const almostBtn = document.getElementById("almostBtn");
const dontKnowBtn = document.getElementById("dontKnowBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const flipBtn = document.getElementById("flipBtn");
const resetBtn = document.getElementById("resetBtn");

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .trim();
}

function roughJudge(userAnswer, correctAnswer) {
  const user = normalize(userAnswer);
  const correct = normalize(correctAnswer);

  if (!user) return "empty";

  if (user === correct) return "correct";

  if (correct.includes(user) || user.includes(correct)) {
    return "close";
  }

  const userWords = user.split(/\s+/);
  const correctWords = correct.split(/\s+/);

  const matches = userWords.filter(word => correctWords.includes(word));
  const matchRatio = matches.length / correctWords.length;

  if (matchRatio >= 0.5) return "close";

  return "wrong";
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
}

function getMasteredCount() {
  return cards.filter(card => saved[card.spanish] === "know").length;
}

function updateProgress() {
  const mastered = getMasteredCount();
  const percent = Math.round((mastered / cards.length) * 100);

  progressText.textContent = `${mastered} / ${cards.length} mastered`;
  scoreText.textContent = `${percent}%`;
  progressFill.style.width = `${percent}%`;

  if (percent >= 85) {
    document.getElementById("goalText").textContent = "Goal hit: 85% understood";
  } else {
    document.getElementById("goalText").textContent = "Goal: 85% understood";
  }
}

function renderCard() {
  const card = cards[currentIndex];

  spanishWord.textContent = card.spanish;
  englishWord.textContent = card.english;
  wordType.textContent = `${card.type} · ${currentIndex + 1} / ${cards.length}`;

  answerInput.value = "";
  judgement.textContent = "";

  flipped = false;
  flashcard.classList.remove("flipped");

  updateProgress();
}

function flipCard() {
  flipped = !flipped;
  flashcard.classList.toggle("flipped", flipped);
}

function gradeCurrentCard(grade) {
  const card = cards[currentIndex];
  saved[card.spanish] = grade;
  saveProgress();

  if (currentIndex < cards.length - 1) {
    currentIndex++;
  }

  renderCard();
}

checkBtn.addEventListener("click", () => {
  const card = cards[currentIndex];
  const result = roughJudge(answerInput.value, card.english);

  if (result === "correct") {
    judgement.textContent = "Correct. You know this one.";
  } else if (result === "close") {
    judgement.textContent = `Close. Correct answer: ${card.english}`;
  } else if (result === "empty") {
    judgement.textContent = "Type your answer first.";
  } else {
    judgement.textContent = `Not quite. Correct answer: ${card.english}`;
  }

  flipped = true;
  flashcard.classList.add("flipped");
});

knowBtn.addEventListener("click", () => gradeCurrentCard("know"));
almostBtn.addEventListener("click", () => gradeCurrentCard("almost"));
dontKnowBtn.addEventListener("click", () => gradeCurrentCard("dontKnow"));

prevBtn.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex--;
    renderCard();
  }
});

nextBtn.addEventListener("click", () => {
  if (currentIndex < cards.length - 1) {
    currentIndex++;
    renderCard();
  }
});

flipBtn.addEventListener("click", flipCard);
flashcard.addEventListener("click", flipCard);

resetBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  Object.keys(saved).forEach(key => delete saved[key]);
  currentIndex = 0;
  renderCard();
});

renderCard();