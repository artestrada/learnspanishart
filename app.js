const days = window.LEARN_SPANISH_DAYS;

let currentDayIndex = 0;
let currentMode = "flashcards";

let currentCardIndex = 0;
let currentSentenceIndex = 0;
let flipped = false;

function getCurrentDay() {
  return days[currentDayIndex];
}

function getStorageKey(type) {
  const day = getCurrentDay();
  return `learnspanishart-${day.id}-${type}`;
}

function loadSaved(type) {
  return JSON.parse(localStorage.getItem(getStorageKey(type))) || {};
}

function saveProgress(type, data) {
  localStorage.setItem(getStorageKey(type), JSON.stringify(data));
}

let savedCards = loadSaved("flashcards");
let savedSentences = loadSaved("sentences");

const dateLabel = document.getElementById("dateLabel");
const progressText = document.getElementById("progressText");
const scoreText = document.getElementById("scoreText");
const progressFill = document.getElementById("progressFill");
const goalText = document.getElementById("goalText");

const flashcardMode = document.getElementById("flashcardMode");
const sentenceMode = document.getElementById("sentenceMode");
const libraryMode = document.getElementById("libraryMode");

const flashcardModeBtn = document.getElementById("flashcardModeBtn");
const sentenceModeBtn = document.getElementById("sentenceModeBtn");
const libraryModeBtn = document.getElementById("libraryModeBtn");

const flashcard = document.getElementById("flashcard");
const spanishWord = document.getElementById("spanishWord");
const englishWord = document.getElementById("englishWord");
const wordType = document.getElementById("wordType");
const answerInput = document.getElementById("answerInput");
const judgement = document.getElementById("judgement");

const checkBtn = document.getElementById("checkBtn");
const knowBtn = document.getElementById("knowBtn");
const almostBtn = document.getElementById("almostBtn");
const dontKnowBtn = document.getElementById("dontKnowBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const flipBtn = document.getElementById("flipBtn");
const resetBtn = document.getElementById("resetBtn");

const sentenceText = document.getElementById("sentenceText");
const wordBank = document.getElementById("wordBank");
const wordHint = document.getElementById("wordHint");
const sentenceAnswer = document.getElementById("sentenceAnswer");
const showSentenceAnswerBtn = document.getElementById("showSentenceAnswerBtn");
const sentenceCorrectAnswer = document.getElementById("sentenceCorrectAnswer");

const sentenceNotCloseBtn = document.getElementById("sentenceNotCloseBtn");
const sentenceAlmostBtn = document.getElementById("sentenceAlmostBtn");
const sentenceCorrectBtn = document.getElementById("sentenceCorrectBtn");
const sentencePrevBtn = document.getElementById("sentencePrevBtn");
const sentenceNextBtn = document.getElementById("sentenceNextBtn");

const libraryList = document.getElementById("libraryList");

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

function setMode(mode) {
  currentMode = mode;

  flashcardMode.classList.toggle("hidden", mode !== "flashcards");
  sentenceMode.classList.toggle("hidden", mode !== "sentences");
  libraryMode.classList.toggle("hidden", mode !== "library");

  updateProgress();

  if (mode === "flashcards") renderCard();
  if (mode === "sentences") renderSentence();
  if (mode === "library") renderLibrary();
}

function updateProgress() {
  const day = getCurrentDay();

  dateLabel.textContent = `${day.title} · ${day.label}`;

  let total = 0;
  let completed = 0;
  let label = "";

  if (currentMode === "flashcards") {
    total = day.vocab.length;
    completed = day.vocab.filter(card => savedCards[card.spanish] === "know").length;
    label = "mastered";
  }

  if (currentMode === "sentences") {
    total = day.sentences.length;
    completed = day.sentences.filter(sentence => savedSentences[sentence.spanish] === "correct").length;
    label = "understood";
  }

  if (currentMode === "library") {
    total = days.length;
    completed = days.length;
    label = "days available";
  }

  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  progressText.textContent = `${completed} / ${total} ${label}`;
  scoreText.textContent = `${percent}%`;
  progressFill.style.width = `${percent}%`;

  if (percent >= 85 && currentMode !== "library") {
    goalText.textContent = "Goal hit: 85% understood";
  } else if (currentMode === "library") {
    goalText.textContent = "Choose a vocab day to study.";
  } else {
    goalText.textContent = "Goal: 85% understood";
  }
}

function renderCard() {
  const day = getCurrentDay();
  const card = day.vocab[currentCardIndex];

  spanishWord.textContent = card.spanish;
  englishWord.textContent = card.english;
  wordType.textContent = `${card.type} · ${currentCardIndex + 1} / ${day.vocab.length}`;

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
  const day = getCurrentDay();
  const card = day.vocab[currentCardIndex];

  savedCards[card.spanish] = grade;
  saveProgress("flashcards", savedCards);

  if (currentCardIndex < day.vocab.length - 1) {
    currentCardIndex++;
  }

  renderCard();
}

function renderSentence() {
  const day = getCurrentDay();
  const sentence = day.sentences[currentSentenceIndex];

  sentenceText.textContent = sentence.spanish;
  sentenceAnswer.value = "";
  sentenceCorrectAnswer.textContent = "";
  wordHint.textContent = "Click a word to see its English meaning.";

  wordBank.innerHTML = "";

  sentence.words.forEach(word => {
    const button = document.createElement("button");
    button.className = "word-chip";
    button.textContent = word.es;

    button.addEventListener("click", () => {
      wordHint.textContent = `${word.es} = ${word.en}`;
    });

    wordBank.appendChild(button);
  });

  updateProgress();
}

function gradeCurrentSentence(grade) {
  const day = getCurrentDay();
  const sentence = day.sentences[currentSentenceIndex];

  savedSentences[sentence.spanish] = grade;
  saveProgress("sentences", savedSentences);

  if (currentSentenceIndex < day.sentences.length - 1) {
    currentSentenceIndex++;
  }

  renderSentence();
}

function renderLibrary() {
  libraryList.innerHTML = "";

  days.forEach((day, index) => {
    const button = document.createElement("button");
    button.className = "library-day";

    button.innerHTML = `
      <strong>${day.label} — ${day.title}</strong>
      <span>${day.vocab.length} vocab words · ${day.sentences.length} sentences</span>
    `;

    button.addEventListener("click", () => {
      currentDayIndex = index;
      currentCardIndex = 0;
      currentSentenceIndex = 0;

      savedCards = loadSaved("flashcards");
      savedSentences = loadSaved("sentences");

      setMode("flashcards");
    });

    libraryList.appendChild(button);
  });

  updateProgress();
}

checkBtn.addEventListener("click", () => {
  const day = getCurrentDay();
  const card = day.vocab[currentCardIndex];
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
  if (currentCardIndex > 0) {
    currentCardIndex--;
    renderCard();
  }
});

nextBtn.addEventListener("click", () => {
  const day = getCurrentDay();

  if (currentCardIndex < day.vocab.length - 1) {
    currentCardIndex++;
    renderCard();
  }
});

flipBtn.addEventListener("click", flipCard);
flashcard.addEventListener("click", flipCard);

resetBtn.addEventListener("click", () => {
  localStorage.removeItem(getStorageKey("flashcards"));
  savedCards = {};
  currentCardIndex = 0;
  renderCard();
});

showSentenceAnswerBtn.addEventListener("click", () => {
  const day = getCurrentDay();
  const sentence = day.sentences[currentSentenceIndex];

  const result = roughJudge(sentenceAnswer.value, sentence.english);

  if (result === "correct") {
    sentenceCorrectAnswer.textContent = `Correct. ${sentence.english}`;
  } else if (result === "close") {
    sentenceCorrectAnswer.textContent = `Close. Correct answer: ${sentence.english}`;
  } else if (result === "empty") {
    sentenceCorrectAnswer.textContent = "Write your translation first.";
  } else {
    sentenceCorrectAnswer.textContent = `Not close yet. Correct answer: ${sentence.english}`;
  }
});

sentenceCorrectBtn.addEventListener("click", () => gradeCurrentSentence("correct"));
sentenceAlmostBtn.addEventListener("click", () => gradeCurrentSentence("almost"));
sentenceNotCloseBtn.addEventListener("click", () => gradeCurrentSentence("notClose"));

sentencePrevBtn.addEventListener("click", () => {
  if (currentSentenceIndex > 0) {
    currentSentenceIndex--;
    renderSentence();
  }
});

sentenceNextBtn.addEventListener("click", () => {
  const day = getCurrentDay();

  if (currentSentenceIndex < day.sentences.length - 1) {
    currentSentenceIndex++;
    renderSentence();
  }
});

flashcardModeBtn.addEventListener("click", () => setMode("flashcards"));
sentenceModeBtn.addEventListener("click", () => setMode("sentences"));
libraryModeBtn.addEventListener("click", () => setMode("library"));

setMode("flashcards");