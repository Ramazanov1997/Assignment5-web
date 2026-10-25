const MAX_MISTAKES = 6;
const HINT_COST = 1;
const LOG_SIZE = 5;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const WORDS = [
  { word: "JAVASCRIPT", hint: "The language that makes web pages interactive" },
  { word: "VARIABLE", hint: "A named box that stores a value" },
  { word: "FUNCTION", hint: "A block of code you can call many times" },
  { word: "ARRAY", hint: "An ordered list of values" },
  { word: "BROWSER", hint: "The program that opens websites" },
  { word: "KEYBOARD", hint: "You press its keys to type" },
  { word: "SELECTOR", hint: "CSS part that chooses which elements to style" },
  { word: "ELEMENT", hint: "One tag of an HTML page with its content" },
  { word: "LISTENER", hint: "Waits for a click or a key press" },
  { word: "STYLESHEET", hint: "A file with CSS rules" },
  { word: "CONSTANT", hint: "A value that cannot be reassigned (const)" },
  { word: "LOOP", hint: "Repeats the same code again and again" },
];

const wordEl = document.getElementById("word");
const hintTextEl = document.getElementById("hint-text");
const livesEl = document.getElementById("lives");
const usedEl = document.getElementById("used");
const messageEl = document.getElementById("message");
const logEl = document.getElementById("log");
const keysEl = document.getElementById("keys");
const formEl = document.getElementById("letter-form");
const inputEl = document.getElementById("letter-input");
const hintBtn = document.getElementById("btn-hint");
const newBtn = document.getElementById("btn-new");

const state = {
  entry: WORDS[0],
  guessed: [],
  mistakes: 0,
  hintUsed: false,
  status: "playing",
  log: [],
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setMessage(text, type) {
  messageEl.textContent = text;
  messageEl.classList.toggle("msg--error", type === "error");
  messageEl.classList.toggle("msg--success", type === "success");
}

function addLog(text) {
  state.log.unshift(text);
  if (state.log.length > LOG_SIZE) {
    state.log.pop();
  }
}

function isSolved() {
  for (const letter of state.entry.word) {
    if (!state.guessed.includes(letter)) {
      return false;
    }
  }
  return true;
}

function buildKeyboard() {
  for (const letter of LETTERS) {
    const key = document.createElement("button");
    key.type = "button";
    key.className = "wg-key";
    key.dataset.letter = letter;
    key.textContent = letter;
    keysEl.append(key);
  }
}

function render() {
  wordEl.replaceChildren();
  for (const letter of state.entry.word) {
    const cell = document.createElement("span");
    cell.className = "wg-letter";
    const open = state.guessed.includes(letter) || state.status === "lost";
    cell.textContent = open ? letter : "";
    cell.classList.toggle("is-missed", state.status === "lost" && !state.guessed.includes(letter));
    wordEl.append(cell);
  }

  const lives = MAX_MISTAKES - state.mistakes;
  livesEl.textContent = lives + " / " + MAX_MISTAKES;
  usedEl.textContent = state.guessed.length > 0 ? state.guessed.join(" ") : "none";
  hintTextEl.textContent = state.hintUsed ? "Hint: " + state.entry.hint : "";
  hintTextEl.hidden = !state.hintUsed;

  const playing = state.status === "playing";
  for (const key of keysEl.children) {
    const letter = key.dataset.letter;
    const used = state.guessed.includes(letter);
    key.disabled = used || !playing;
    key.classList.toggle("is-hit", used && state.entry.word.includes(letter));
    key.classList.toggle("is-miss", used && !state.entry.word.includes(letter));
  }
  hintBtn.disabled = !playing;
  inputEl.disabled = !playing;

  logEl.replaceChildren();
  if (state.log.length === 0) {
    const empty = document.createElement("li");
    empty.className = "hl-history__empty";
    empty.textContent = "No moves yet.";
    logEl.append(empty);
  }
  for (const text of state.log) {
    const item = document.createElement("li");
    item.textContent = text;
    logEl.append(item);
  }
}

function guessLetter(raw) {
  const value = raw.trim().toUpperCase();
  if (state.status !== "playing") {
    setMessage("The round is over. Press New word to play again.", "error");
    return;
  }
  if (value === "") {
    setMessage("Type a letter first.", "error");
    return;
  }
  if (value.length !== 1 || !LETTERS.includes(value)) {
    setMessage("Enter exactly one letter from A to Z.", "error");
    return;
  }
  if (state.guessed.includes(value)) {
    setMessage("You already tried " + value + ". Choose another letter.", "error");
    return;
  }

  state.guessed.push(value);
  let text;
  let type;
  if (state.entry.word.includes(value)) {
    text = "Yes! The word has the letter " + value + ".";
    type = "success";
    addLog("✔ " + value + " is in the word");
  } else {
    state.mistakes += 1;
    text = "No " + value + " in the word. Lives left: " + (MAX_MISTAKES - state.mistakes) + ".";
    type = "error";
    addLog("✘ " + value + " is not in the word");
  }

  if (state.mistakes >= MAX_MISTAKES) {
    state.status = "lost";
    text = "You lost. The word was " + state.entry.word + ".";
    type = "error";
  } else if (isSolved() && state.mistakes < MAX_MISTAKES) {
    state.status = "won";
    text = "You won! The word is " + state.entry.word + ".";
    type = "success";
  }
  setMessage(text, type);
  render();
}

function useHint() {
  if (state.status !== "playing") {
    setMessage("The round is over. Press New word to play again.", "error");
    return;
  }
  if (state.hintUsed) {
    setMessage("The hint was already used in this round.", "error");
    return;
  }
  if (state.mistakes + HINT_COST >= MAX_MISTAKES) {
    setMessage("Not enough lives: the hint costs " + HINT_COST + " life.", "error");
    return;
  }
  state.hintUsed = true;
  state.mistakes += HINT_COST;
  addLog("? hint used (−" + HINT_COST + " life)");
  setMessage("Hint shown. It cost " + HINT_COST + " life.", "success");
  render();
}

function startRound() {
  let entry = WORDS[randomInt(0, WORDS.length - 1)];
  while (entry === state.entry && WORDS.length > 1) {
    entry = WORDS[randomInt(0, WORDS.length - 1)];
  }
  state.entry = entry;
  state.guessed = [];
  state.mistakes = 0;
  state.hintUsed = false;
  state.status = "playing";
  state.log = [];
  inputEl.value = "";
  setMessage("New word with " + entry.word.length + " letters. Good luck!", "");
  render();
}

formEl.addEventListener("submit", function (event) {
  event.preventDefault();
  guessLetter(inputEl.value);
  inputEl.value = "";
  inputEl.focus();
});

keysEl.addEventListener("click", function (event) {
  const key = event.target.closest("button[data-letter]");
  if (!key || key.disabled) return;
  guessLetter(key.dataset.letter);
});

hintBtn.addEventListener("click", useHint);
newBtn.addEventListener("click", startRound);

buildKeyboard();
startRound();
