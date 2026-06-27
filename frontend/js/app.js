/**
 * File: js/app.js
 * Purpose: Core application engine — state, init, routing, session management
 * Namespace: AppEngine
 * Methods: init, syncDecksFromStorage, syncCardsFromStorage, startStandardStudySession,
 *          startInstantBlitzSession, startShuffledStudySession, exitSessionBackToDeck,
 *          resetCustomStudySession, flipCard, submitReview, bindGlobalKeyboardShortcuts
 * Works With: api.js, FlashcardEngine, DOM (views: decks/cards/study)
 * Notes: Central state object holds decks, cards, studyQueue, activeDeckId, etc.
 */
 
 
const AppEngine = {
  state: {
    decks: [],
    activeDeckId: null,
    cards: [],
    studyQueue: [], 
    currentSessionIndex: 0,
    isCardFlipped: false,
    editingDeckId: null,
    editingCardId: null,
    currentLayoutMode: 'blocks',
    
    
    isBlitzActiveMode: false,
    warmupTimerRef: null,
    
    activeDialogResolve: null
  },
  
  init: async function() {
    this.bindGlobalKeyboardShortcuts();
    
    if (window.AppSearchEngine) {
      AppSearchEngine.init();
    }

    await this.syncDecksFromStorage();
  },

  exitSessionBackToDeck: function() {
    this.killWarmupTimer();
    if (this.state.activeDeckId) {
      this.switchView('cards');
      this.syncCardsFromStorage();
    } else {
      this.switchView('decks');
    }
  },

  syncDecksFromStorage: async function() {
    try {
      if (window.api) this.state.decks = await api.getDecks();
      this.renderDecksView();
    } catch (e) { console.error("Sync failure", e); }
  },

  syncCardsFromStorage: async function() {
    if (!this.state.activeDeckId) return;
    try {
      if (window.api) this.state.cards = await api.getCards(this.state.activeDeckId);
      this.renderCardsView();
    } catch (e) { console.error("Card sync error", e); }
  },


  triggerDirectDeckSession: async function(deckId, deckTitle, invokeBlitzMode = false) {
    this.state.activeDeckId = deckId;
    document.getElementById('active-deck-title').textContent = deckTitle;
    if (invokeBlitzMode) {
      await this.startInstantBlitzSession();
    } else {
      await this.startStandardStudySession();
    }
  },

  startInstantBlitzSession: async function() {
    const sourceCards = await api.getCards(this.state.activeDeckId);
    if (!sourceCards || !sourceCards.length) return this.showAppDialog("Empty Stack", "This repository contains no valid cards.");

    this.state.isBlitzActiveMode = true;
    this.state.studyQueue = FlashcardEngine.prepareSessionQueue(sourceCards);
    this.state.currentSessionIndex = 0;
    this.switchView('study');
    
    FlashcardEngine.executeFirstTouchWarmupLoop();
  },

  startStandardStudySession: async function() {
    const sourceCards = await api.getCards(this.state.activeDeckId);
    if (!sourceCards || !sourceCards.length) return this.showAppDialog("Empty Stack", "This repository contains no valid cards.");

    this.state.isBlitzActiveMode = false;
    this.state.studyQueue = FlashcardEngine.prepareSessionQueue(sourceCards);
    this.state.currentSessionIndex = 0;
    this.switchView('study');
    
    FlashcardEngine.loadNextStudyItem();
  },

  resetCustomStudySession: function() {
    const overlay = document.getElementById('session-complete-overlay');
    if (overlay) overlay.classList.add('hidden');
    if (this.state.isBlitzActiveMode) {
      this.startInstantBlitzSession();
    } else {
      this.startStandardStudySession();
    }
  },

  killWarmupTimer: function() {
    if (window.FlashcardEngine) FlashcardEngine.killWarmupTimer();
  },

  flipCard: function() { FlashcardEngine.flipCard(); },
  submitReview: function(score) { FlashcardEngine.submitReview(score); },

  bindGlobalKeyboardShortcuts: function() {
    document.addEventListener('keydown', (e) => {
      if (this.state.isDialogOpen) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          this.closeAppDialog(true);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          this.closeAppDialog(false);
          return;
        }
      }

      if (e.key === 'Escape') {
        const cardModal = document.getElementById('card-modal');
        if (cardModal && !cardModal.classList.contains('hidden')) {
          this.closeCardModal();
          return;
        }
        const deckModal = document.getElementById('deck-modal');
        if (deckModal && !deckModal.classList.contains('hidden')) {
          this.closeDeckModal();
          return;
        }
        if (!document.getElementById('view-study').classList.contains('hidden')) {
          this.exitSessionBackToDeck();
          return;
        }
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => AppEngine.init());