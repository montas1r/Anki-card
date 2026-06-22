/**
 * Phase 2 Final Production Dynamic Execution Engine Layout Core - Cleaned
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
    
    shuffleEngineMode: 'prioritized', 
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

  switchView: function(viewTarget) {
    this.killWarmupTimer();
    ['decks', 'cards', 'study'].forEach(p => {
      const el = document.getElementById(`view-${p}`);
      if (el) el.classList.add('hidden');
    });
    const targetEl = document.getElementById(`view-${viewTarget}`);
    if (targetEl) targetEl.classList.remove('hidden');
    
    const overlay = document.getElementById('session-complete-overlay');
    if (overlay) overlay.classList.add('hidden');
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

  changeLayoutMode: function(modeName, tabElement) {
    this.state.currentLayoutMode = modeName;
    document.querySelectorAll('.view-mode-selector .mode-tab').forEach(t => t.classList.remove('active'));
    if (tabElement) tabElement.classList.add('active');

    const grid = document.getElementById('decks-grid');
    if (grid) {
      grid.className = 'flat-grid';
      grid.classList.add(`dynamic-layout-${modeName}`);
    }
    this.renderDecksView();
  },

  showAppDialog: function(title, text, showCancelBtn = false) {
    return new Promise((resolve) => {
      this.state.activeDialogResolve = resolve;
      this.state.isDialogOpen = true; 
      
      document.getElementById('app-dialog-title').textContent = title;
      document.getElementById('app-dialog-body').textContent = text;
      
      const footer = document.getElementById('app-dialog-footer');
      const cancelBtn = footer.querySelector('.flat-action');
      if (cancelBtn) cancelBtn.style.display = showCancelBtn ? 'inline-block' : 'none';
      
      const modal = document.getElementById('app-dialog-modal');
      modal.classList.remove('hidden');

      setTimeout(() => {
        const confirmBtn = modal.querySelector('.flat-action.primary') || modal.querySelector('button:not([style*="none"])');
        if (confirmBtn) confirmBtn.focus();
      }, 50);
    });
  },
  
  closeAppDialog: function(isConfirmed) {
    document.getElementById('app-dialog-modal').classList.add('hidden');
    this.state.isDialogOpen = false;
    if (this.state.activeDialogResolve) {
      this.state.activeDialogResolve(isConfirmed);
      this.state.activeDialogResolve = null;
    }
  },

  toggleShuffleEngine: function() {
    const btn = document.getElementById('toggle-shuffle-btn');
    if (this.state.shuffleEngineMode === 'prioritized') {
      this.state.shuffleEngineMode = 'random';
      if (btn) {
        btn.classList.add('engine-active');
        btn.title = "Toggle Shuffling Mode (Current: True Random)";
      }
      if (!document.getElementById('view-study').classList.contains('hidden') && this.state.studyQueue.length > 0) {
        let remaining = this.state.studyQueue.slice(this.state.currentSessionIndex);
        for (let i = remaining.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
        }
        this.state.studyQueue = this.state.studyQueue.slice(0, this.state.currentSessionIndex).concat(remaining);
        FlashcardEngine.loadNextStudyItem();
      }
    } else {
      this.state.shuffleEngineMode = 'prioritized';
      if (btn) {
        btn.classList.remove('engine-active');
        btn.title = "Toggle Shuffling Mode (Current: Prioritized)";
      }
      if (!document.getElementById('view-study').classList.contains('hidden') && this.state.studyQueue.length > 0) {
        let remaining = this.state.studyQueue.slice(this.state.currentSessionIndex);
        remaining.sort((a, b) => (b.weight || 10) - (a.weight || 10));
        this.state.studyQueue = this.state.studyQueue.slice(0, this.state.currentSessionIndex).concat(remaining);
        FlashcardEngine.loadNextStudyItem();
      }
    }
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

  // Proxies for UI layout bindings called in templates
  flipCard: function() { FlashcardEngine.flipCard(); },
  submitReview: function(score) { FlashcardEngine.submitReview(score); },

  // ---- CRUD OPERATORS ----
commitDeck: async function() {
    const nameInp = document.getElementById('input-deck-name');
    const descInp = document.getElementById('input-deck-desc');
    if (!nameInp) return;

    const name = nameInp.value.trim();
    const description = descInp ? descInp.value.trim() : '';
    if (!name) return this.showAppDialog('Validation Error', 'Missing Identifier Title.');

    try {
      if (window.api) {
        if (this.state.editingDeckId) {
          // Workaround: Delete the old entry first to mimic an update sequence
          await window.api.deleteDeck(this.state.editingDeckId);
          await window.api.createDeck({ name, description });
          this.state.editingDeckId = null;
        } else {
          // Standard creation path
          await window.api.createDeck({ name, description });
        }
      } else {
        console.error("Database backend layer is offline.");
      }
    } catch (e) { 
      console.error("Deck preservation failure:", e); 
    }

    this.closeDeckModal();
    await this.syncDecksFromStorage();
  },
  
  
  
  
openEditDeckModal: function(id, name, desc, event) {
    if (event) event.stopPropagation();
    this.state.editingDeckId = id;
    
    // Populate input values
    document.getElementById('input-deck-name').value = name;
    document.getElementById('input-deck-desc').value = desc;
    
    // Change UI labels to reflect Edit mode
    const headline = document.getElementById('modal-deck-headline');
    const submitBtn = document.getElementById('modal-deck-submit-btn');
    if (headline) headline.textContent = 'Modify Deck Settings';
    if (submitBtn) submitBtn.textContent = 'Save Changes';
    
    document.getElementById('deck-modal').classList.remove('hidden');
  },

  openDeckWorkspace: function(deckId, targetTitle) {
    this.state.activeDeckId = deckId;
    document.getElementById('active-deck-title').textContent = targetTitle;
    this.switchView('cards');
    this.syncCardsFromStorage();
  },

  removeDeck: async function(id, event) {
    if (event) event.stopPropagation();
    const confirmed = await this.showAppDialog('Confirm Drop', 'Permanently drop deck repository?', true);
    if (confirmed) {
      await api.deleteDeck(id);
      await this.syncDecksFromStorage();
    }
  },

  removeCard: async function(id) {
    await api.deleteCard(id);
    await this.syncCardsFromStorage();
  },

closeDeckModal: function() {
    this.state.editingDeckId = null;
    document.getElementById('input-deck-name').value = '';
    document.getElementById('input-deck-desc').value = '';
    
    // Reset UI labels back to Create mode defaults
    const headline = document.getElementById('modal-deck-headline');
    const submitBtn = document.getElementById('modal-deck-submit-btn');
    if (headline) headline.textContent = 'Initialize Deck';
    if (submitBtn) submitBtn.textContent = 'Create';
    
    document.getElementById('deck-modal').classList.add('hidden');
  },

openAddCardModal: function() {
    this.state.editingCardId = null;
    document.getElementById('input-card-front').value = '';
    document.getElementById('input-card-back').value = '';
    
    const bulkArea = document.getElementById('bulk-paste-area');
    if (bulkArea) bulkArea.value = '';
    
    if (window.BulkImportEngine) {
      BulkImportEngine.calculateBulkCards();
      BulkImportEngine.setCardModalMode('single');
    }
    document.getElementById('card-modal').classList.remove('hidden');
  },

openEditCardModal: function(id, front, back) {
    this.state.editingCardId = id;
    
    // Set field values
    document.getElementById('input-card-front').value = front;
    document.getElementById('input-card-back').value = back;
    
    // Force Single form view mode active
    if (window.BulkImportEngine) {
      BulkImportEngine.setCardModalMode('single');
    } else {
      document.getElementById('modal-form-single').classList.remove('hidden');
      document.getElementById('modal-form-bulk').classList.add('hidden');
    }
    
    // Hide the tab switches entirely during editing to prevent state confusion
    const tabContainer = document.querySelector('.modal-mode-tabs');
    if (tabContainer) tabContainer.style.display = 'none';

    document.getElementById('card-modal').classList.remove('hidden');
  },

  closeCardModal: function() {
    this.state.editingCardId = null;
    document.getElementById('card-modal').classList.add('hidden');
    
    // Reset tabs row back to layout visibility for standard appends
    const tabContainer = document.querySelector('.modal-mode-tabs');
    if (tabContainer) tabContainer.style.display = 'flex';
  },
  
 

commitCardWindowData: function() {
    const formBulk = document.getElementById('modal-form-bulk');
    
    if (formBulk && !formBulk.classList.contains('hidden')) {
      if (window.BulkImportEngine) {
        window.BulkImportEngine.processBulkPaste();
      } else {
        console.error("Runtime Exception: window.BulkImportEngine is still unallocated in global context.");
      }
    } else {
      this.commitCard();
    }
  },
  
  
  
  
  commitCard: async function() {
    const frontInp = document.getElementById('input-card-front');
    const backInp = document.getElementById('input-card-back');
    if (!frontInp || !backInp) return;

    const front = frontInp.value.trim();
    const back = backInp.value.trim();
    if (!front || !back) return this.showAppDialog('Validation Error', 'Fields cannot be left empty.');

    if (this.state.editingCardId) {
      await api.updateCard(this.state.editingCardId, { front, back });
      this.state.editingCardId = null;
    } else {
      await api.createCard(this.state.activeDeckId, { front, back });
    }
    this.closeCardModal();
    await this.syncCardsFromStorage();
  },

  renderDecksView: function() {
    const container = document.getElementById('decks-grid');
    if (!container) return;
    if (!this.state.decks.length) {
      container.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:20px; opacity:0.5;">No active decks found.</p>`;
      return;
    }
    const mode = this.state.currentLayoutMode || 'blocks';
    container.innerHTML = this.state.decks.map(d => DeckRenderModes[mode](d, DeckRenderModes.escape)).join('');
  },

  renderCardsView: function() {
    const container = document.getElementById('cards-list-workspace');
    if (!container) return;
    if (!this.state.cards.length) {
      container.innerHTML = `<p style="text-align:center; padding:30px; opacity:0.5;">Deck is empty.</p>`;
      return;
    }
    container.innerHTML = this.state.cards.map(c => {
      const escape = (str) => (str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
      return `
        <div class="card-row">
          <div style="max-width:70%;">
            <div style="font-weight:600; font-size:14px; margin-bottom:2px;">${c.front}</div>
            <div style="font-size:12px; color:var(--primary-teal);">${c.back}</div>
          </div>
          <div style="display:flex; gap:6px; align-items:center;">
            <button class="icon-btn ghost" style="width:28px; height:28px; border:1px solid rgba(66,132,117,0.3);" title="Edit Card" onclick="AppEngine.openEditCardModal(${c.id}, '${escape(c.front)}', '${escape(c.back)}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px; height:13px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path></svg>
            </button>
            <button class="icon-btn danger-icon" style="width:28px; height:28px;" title="Delete Card" onclick="AppEngine.removeCard(${c.id})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px; height:13px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>`;
    }).join('');
  },




  bindGlobalKeyboardShortcuts: function() {
    document.addEventListener('keydown', (e) => {
      // Dialog modal logic overrides
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

      // App Modal closing logic
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