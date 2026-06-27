/**
 * File: js/shuffle.js
 * Purpose: Shuffle cards randomly and launch study session
 * Namespace: AppEngine
 * Methods: startShuffledStudySession
 * Works With: api.js (getCards), FlashcardEngine, AppEngine.state
 * Notes: Fisher-Yates shuffle. Sets isBlitzActiveMode=false. Loads into studyQueue.
 */
 
AppEngine.startShuffledStudySession = async function() {
  if (!this.state.activeDeckId) {
    return this.showAppDialog("Context Error", "Select a deck first.");
  }

  const sourceCards = await api.getCards(this.state.activeDeckId);
  if (!sourceCards || !sourceCards.length) {
    return this.showAppDialog("Empty Stack", "This repository contains no valid cards.");
  }

  // Fisher-Yates shuffle
  const shuffled = [...sourceCards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  this.state.isBlitzActiveMode = false;
  this.state.studyQueue = shuffled.map(c => ({
    ...c,
    weight: c.weight !== undefined ? parseInt(c.weight) : 10
  }));
  this.state.currentSessionIndex = 0;
  this.state.isCardFlipped = false;
  this.switchView("study");

  FlashcardEngine.loadNextStudyItem();
};