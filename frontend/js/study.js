// ----- Study Session Logic -----
let studyQueue = [];
let currentCard = null;
let showingAnswer = false;
let hasRevealed = false; // tracks if answer was ever shown (to enable rating)

// Local helper to prevent dependency issues with app.js loading order
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}

async function startStudy() {
  studyQueue = await api.getDueCards(currentDeck.id);
  toggleView("study-view");

  if (!studyQueue.length) {
    document.getElementById("study-container").innerHTML = `
      <h2>🎉 All done!</h2>
      <p class="progress-text" style="margin-top:10px;">No cards due for review.</p>
      <button class="btn primary" onclick="showCards()">Back to Cards</button>
    `;
    return;
  }
  nextCard();
}

function nextCard() {
  if (!studyQueue.length) {
    document.getElementById("study-container").innerHTML = `
      <h2>✅ Session Complete!</h2>
      <p class="progress-text">Great work! 🌿</p>
      <button class="btn primary" onclick="showCards()">Back to Cards</button>
    `;
    return;
  }
  currentCard = studyQueue.shift();
  showingAnswer = false;
  hasRevealed = false;
  renderCard();
}

function renderCard() {
  const container = document.getElementById("study-container");
  
  container.innerHTML = `
    <p class="progress-text">${studyQueue.length + 1} card(s) remaining</p>

    <div class="flip-card ${showingAnswer ? "flipped" : ""}" id="flipCard" onclick="flipCard()">
      <div class="flip-inner">
        <div class="flip-front">
          <span class="flip-label">Question</span>
          ${escapeHtml(currentCard.front)}
        </div>
        <div class="flip-back">
          <span class="flip-label">Answer</span>
          ${escapeHtml(currentCard.back)}
        </div>
      </div>
    </div>

    ${
      hasRevealed
        ? `
      <div class="rating-buttons">
        <button class="btn danger" onclick="rate(0)">Again <kbd>1</kbd></button>
        <button class="btn ghost" onclick="rate(3)">Hard <kbd>2</kbd></button>
        <button class="btn primary" onclick="rate(4)">Good <kbd>3</kbd></button>
        <button class="btn success" onclick="rate(5)">Easy <kbd>4</kbd></button>
      </div>
      <p class="progress-text shortcut-hint" style="opacity:0.6; margin-top: 14px;">
        Press <kbd>Space</kbd> / <kbd>F</kbd> to flip · <kbd>1–4</kbd> to rate
      </p>
        `
        : `
      <p class="progress-text shortcut-hint" style="opacity:0.6">
        Tap card or press <kbd>Space</kbd> / <kbd>F</kbd> to reveal answer
      </p>
        `
    }
  `;
}

// Toggle flip freely (front <-> back)
function flipCard() {
  showingAnswer = !showingAnswer;
  if (showingAnswer) hasRevealed = true; // once revealed, rating stays available
  renderCard();
}

async function rate(quality) {
  if (!hasRevealed) return;
  await api.reviewCard(currentCard.id, quality);
  nextCard();
}

// ----- Keyboard Shortcuts -----
document.addEventListener("keydown", (e) => {
  const studyView = document.getElementById("study-view");
  if (studyView.classList.contains("hidden")) return;
  if (!currentCard) return;

  const tag = document.activeElement.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;

  switch (e.key) {
    case " ":
    case "f":
    case "F":
      e.preventDefault();
      flipCard();
      break;
    case "1":
      if (hasRevealed) rate(0);
      break;
    case "2":
      if (hasRevealed) rate(3);
      break;
    case "3":
      if (hasRevealed) rate(4);
      break;
    case "4":
      if (hasRevealed) rate(5);
      break;
    case "Escape":
      showCards();
      break;
  }
});