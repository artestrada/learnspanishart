const days = window.LEARN_SPANISH_DAYS;

let currentDayIndex = days.length - 1;
let currentMode = "flashcards";

let currentCardIndex = 0;
let currentSentenceIndex = 0;
let flipped = false;

let reviewMode = false;
let goFor100Mode = false;
let reviewQueue = [];
let quotaMessageShown = false;

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

const dailyCompleteBox = document.getElementById("dailyCompleteBox");
const goFor100Btn = document.getElementById("goFor100Btn");
const stayAt85Btn = document.getElementById("stayAt85Btn");
const hintBox = document.getElementById("hintBox");
const hintSentence = document.getElementById("hintSentence");

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

function getFlashcardPercent() {
  const day = getCurrentDay();
  const mastered = day.vocab.filter(card => savedCards[card.spanish] === "know").length;
  return Math.round((mastered / day.vocab.length) * 100);
}

function getMissedCards() {
  const day = getCurrentDay();

  return day.vocab.filter(card => {
    const grade = savedCards[card.spanish];
    return grade === "almost" || grade === "dontKnow" || !grade;
  });
}

function buildReviewQueue() {
  reviewQueue = getMissedCards();
  reviewMode = reviewQueue.length > 0;
  currentCardIndex = 0;
}

function getCurrentFlashcard() {
  const day = getCurrentDay();

  if (reviewMode) {
    return reviewQueue[currentCardIndex];
  }

  return day.vocab[currentCardIndex];
}

function getCurrentFlashcardTotal() {
  const day = getCurrentDay();

  if (reviewMode) {
    return reviewQueue.length;
  }

  return day.vocab.length;
}

function findHintSentence(card) {
  const day = getCurrentDay();
  const target = normalize(card.spanish).split(" ")[0];

  const foundSentence = day.sentences.find(sentence => {
    const sentenceTextValue = normalize(sentence.spanish);
    return sentenceTextValue.includes(target);
  });

  if (foundSentence) {
    return foundSentence.spanish;
  }

  return `Try remembering this word in context: "${card.spanish}"`;
}

function updateHint() {
  const card = getCurrentFlashcard();

  if (!card || !reviewMode) {
    hintBox.classList.add("hidden");
    hintSentence.textContent = "";
    return;
  }

  hintBox.classList.remove("hidden");
  hintSentence.textContent = findHintSentence(card);
}

function maybeShowQuotaMessage() {
  const percent = getFlashcardPercent();

  if (currentMode !== "flashcards") return;
  if (quotaMessageShown) return;
  if (goFor100Mode) return;

  if (percent >= 85) {
    dailyCompleteBox.classList.remove("hidden");
    quotaMessageShown = true;
  }
}

function hideQuotaMessage() {
  dailyCompleteBox.classList.add("hidden");
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
  const card = getCurrentFlashcard();
  const total = getCurrentFlashcardTotal();

  if (!card) {
    spanishWord.textContent = "All done";
    englishWord.textContent = "You finished the review queue.";
    wordType.textContent = "Great work.";

    answerInput.value = "";
    judgement.textContent = "";

    hintBox.classList.add("hidden");
    updateProgress();
    maybeShowQuotaMessage();
    return;
  }

  spanishWord.textContent = card.spanish;
  englishWord.textContent = card.english;

  const modeLabel = reviewMode ? "Review round" : "First pass";
  wordType.textContent = `${card.type} · ${modeLabel} · ${currentCardIndex + 1} / ${total}`;

  answerInput.value = "";
  judgement.textContent = "";

  flipped = false;
  flashcard.classList.remove("flipped");

  updateHint();
  updateProgress();
}

function flipCard() {
  flipped = !flipped;
  flashcard.classList.toggle("flipped", flipped);
}

function gradeCurrentCard(grade) {
  const day = getCurrentDay();
  const card = getCurrentFlashcard();

  if (!card) return;

  savedCards[card.spanish] = grade;
  saveProgress("flashcards", savedCards);

  const percent = getFlashcardPercent();

  if (percent >= 85 && !goFor100Mode) {
    updateProgress();
    maybeShowQuotaMessage();
    return;
  }

  if (reviewMode) {
    reviewQueue = getMissedCards();

    if (reviewQueue.length === 0) {
      currentCardIndex = 0;
      updateProgress();
      renderCard();
      return;
    }

    if (currentCardIndex >= reviewQueue.length) {
      currentCardIndex = 0;
    }

    renderCard();
    return;
  }

  if (currentCardIndex < day.vocab.length - 1) {
    currentCardIndex++;
    renderCard();
    return;
  }

  buildReviewQueue();

  if (reviewQueue.length === 0) {
    renderCard();
    return;
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

      reviewMode = false;
      goFor100Mode = false;
      reviewQueue = [];
      quotaMessageShown = false;
      hideQuotaMessage();

      savedCards = loadSaved("flashcards");
      savedSentences = loadSaved("sentences");

      setMode("flashcards");
    });

    libraryList.appendChild(button);
  });

  updateProgress();
}

checkBtn.addEventListener("click", () => {
  const card = getCurrentFlashcard();

  if (!card) return;

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
  }

  renderCard();
});

nextBtn.addEventListener("click", () => {
  const total = getCurrentFlashcardTotal();

  if (currentCardIndex < total - 1) {
    currentCardIndex++;
  } else if (!reviewMode) {
    buildReviewQueue();
  } else {
    currentCardIndex = 0;
  }

  renderCard();
});

flipBtn.addEventListener("click", flipCard);
flashcard.addEventListener("click", flipCard);

resetBtn.addEventListener("click", () => {
  localStorage.removeItem(getStorageKey("flashcards"));

  savedCards = {};
  currentCardIndex = 0;
  reviewMode = false;
  goFor100Mode = false;
  reviewQueue = [];
  quotaMessageShown = false;

  hideQuotaMessage();
  renderCard();
});

goFor100Btn.addEventListener("click", () => {
  goFor100Mode = true;
  hideQuotaMessage();

  buildReviewQueue();

  if (reviewQueue.length === 0) {
    reviewMode = false;
  }

  renderCard();
});

stayAt85Btn.addEventListener("click", () => {
  hideQuotaMessage();

  spanishWord.textContent = "Daily goal complete";
  englishWord.textContent = "You hit 85%. Good job.";
  wordType.textContent = "Come back tomorrow or go to another mode.";

  answerInput.value = "";
  judgement.textContent = "";
  hintBox.classList.add("hidden");
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