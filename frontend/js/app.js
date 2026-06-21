/**
 * Phase 1 Execution & State Management Engine
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
    currentLayoutMode: 'blocks' // Default initialization layout mode state
  },

  init: async function() {
    this.bindGlobalKeyboardShortcuts();
    await this.syncDecksFromStorage();
  },

  switchView: function(viewTarget) {
    ['decks', 'cards', 'study'].forEach(p => {
      const el = document.getElementById(`view-${p}`);
      if (el) el.classList.add('hidden');
    });
    const targetEl = document.getElementById(`view-${viewTarget}`);
    if (targetEl) targetEl.classList.remove('hidden');
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

  // Layout Mode Shift Control Layer Engine
  changeLayoutMode: function(modeName, tabElement) {
    this.state.currentLayoutMode = modeName;
    
    // Toggle active state visualization tabs
    document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
    if (tabElement) tabElement.classList.add('active');

    // Mutate container grid styling profile class
    const grid = document.getElementById('decks-grid');
    if (grid) {
      grid.className = 'flat-grid';
      grid.classList.add(`dynamic-layout-${modeName}`);
    }
    this.renderDecksView();
  },

  // ---- CRUD CONTROL OPERATIONS ----
  commitDeck: async function() {
    const nameInp = document.getElementById('input-deck-name');
    const descInp = document.getElementById('input-deck-desc');
    if (!nameInp) return;

    const name = nameInp.value.trim();
    const description = descInp ? descInp.value.trim() : '';
    if (!name) return alert('Missing Identifier');

    if (this.state.editingDeckId) {
      await fetch(`/api/decks/${this.state.editingDeckId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description })
      });
      this.state.editingDeckId = null;
    } else {
      await api.createDeck({ name, description });
    }
    this.closeDeckModal();
    await this.syncDecksFromStorage();
  },

  openEditDeckModal: function(id, name, desc, event) {
    if (event) event.stopPropagation();
    this.state.editingDeckId = id;
    document.getElementById('input-deck-name').value = name;
    document.getElementById('input-deck-desc').value = desc;
    document.getElementById('deck-modal').classList.remove('hidden');
  },

  openDeckWorkspace: function(deckId, targetTitle) {
    this.state.activeDeckId = deckId;
    document.getElementById('active-deck-title').textContent = targetTitle;
    
    // Clear old bulk load terminal area variables
    const bulkField = document.getElementById('bulk-paste-area');
    if (bulkField) bulkField.value = '';
    this.calculateBulkCards();

    this.switchView('cards');
    this.syncCardsFromStorage();
  },

  removeDeck: async function(id, event) {
    if (event) event.stopPropagation();
    if (confirm("Permanently drop deck repository?")) {
      await api.deleteDeck(id);
      await this.syncDecksFromStorage();
    }
  },

  removeCard: async function(id) {
    if (confirm("Delete card payload item?")) {
      await api.deleteCard(id);
      await this.syncCardsFromStorage();
    }
  },

  closeDeckModal: function() {
    this.state.editingDeckId = null;
    document.getElementById('input-deck-name').value = '';
    document.getElementById('input-deck-desc').value = '';
    document.getElementById('deck-modal').classList.add('hidden');
  },

  // ---- CARD MODAL MULTI-MODE LAYER CONTROL ----
  setCardModalMode: function(mode) {
    const tabSingle = document.getElementById('tab-mode-single');
    const tabBulk = document.getElementById('tab-mode-bulk');
    const formSingle = document.getElementById('modal-form-single');
    const formBulk = document.getElementById('modal-form-bulk');
    const submitBtn = document.getElementById('modal-card-submit-btn');
    const headline = document.getElementById('modal-card-headline');

    if (mode === 'bulk') {
      if (tabSingle) tabSingle.classList.remove('active');
      if (tabBulk) tabBulk.classList.add('active');
      if (formSingle) formSingle.classList.add('hidden');
      if (formBulk) formBulk.classList.remove('hidden');
      if (submitBtn) submitBtn.textContent = 'Commit Bulk Load';
      if (headline) headline.textContent = 'Bulk Load Matrix';
    } else {
      if (tabBulk) tabBulk.classList.remove('active');
      if (tabSingle) tabSingle.classList.add('active');
      if (formBulk) formBulk.classList.add('hidden');
      if (formSingle) formSingle.classList.remove('hidden');
      if (submitBtn) submitBtn.textContent = this.state.editingCardId ? 'Save Changes' : 'Save Card';
      if (headline) headline.textContent = this.state.editingCardId ? 'Edit Flashcard' : 'Append Flashcard';
    }
  },

  closeCardModal: function() {
    this.state.editingCardId = null;
    document.getElementById('input-card-front').value = '';
    document.getElementById('input-card-back').value = '';
    document.getElementById('bulk-paste-area').value = '';
    this.calculateBulkCards();
    
    // Reset window selection profiles seamlessly
    this.setCardModalMode('single');
    const tabs = document.getElementById('modal-mode-tabs');
    if (tabs) tabs.classList.remove('hidden');

    document.getElementById('card-modal').classList.add('hidden');
  },

  openEditCardModal: function(id, front, back) {
    this.state.editingCardId = id;
    document.getElementById('input-card-front').value = front;
    document.getElementById('input-card-back').value = back;
    
    // Lock choice matrix while updating a explicit card item
    const tabs = document.getElementById('modal-mode-tabs');
    if (tabs) tabs.classList.add('hidden');
    
    this.setCardModalMode('single');
    document.getElementById('card-modal').classList.remove('hidden');
  },

  commitCardWindowData: function() {
    const tabBulk = document.getElementById('tab-mode-bulk');
    if (tabBulk && tabBulk.classList.contains('active')) {
      this.processBulkPaste();
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
    if (!front || !back) return alert('Fields cannot be empty');

    if (this.state.editingCardId) {
      await api.updateCard(this.state.editingCardId, { front, back });
      this.state.editingCardId = null;
    } else {
      await api.createCard(this.state.activeDeckId, { front, back });
    }
    this.closeCardModal();
    await this.syncCardsFromStorage();
  },

  // ---- WORKSPACE RENDER LAYERS ----
  renderDecksView: function() {
    const container = document.getElementById('decks-grid');
    if (!container) return;
    if (!this.state.decks.length) {
      container.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:20px; opacity:0.5;">No active decks found.</p>`;
      return;
    }

    const mode = this.state.currentLayoutMode || 'blocks';
    container.innerHTML = this.state.decks.map(d => {
      return DeckRenderModes[mode](d, DeckRenderModes.escape);
    }).join('');
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

  // ---- UTILITY SEARCH MODULE OVERLAYS ----
  toggleSearchPanel: function() {
    const rack = document.getElementById('search-utility-rack');
    const triggerBtn = document.getElementById('search-nav-btn');
    if (!rack) return;

    rack.classList.toggle('hidden');
    if (!rack.classList.contains('hidden')) {
      if (triggerBtn) triggerBtn.style.visibility = 'hidden';
      const input = document.getElementById('navbar-search-input');
      if (input) {
        input.value = '';
        input.focus();
      }
      this.executeWorkspaceSearch();
    } else {
      if (triggerBtn) triggerBtn.style.visibility = 'visible';
    }
  },

  executeWorkspaceSearch: function() {
    const input = document.getElementById('navbar-search-input');
    if (!input) return;
    const query = input.value.toLowerCase().trim();
    
    document.querySelectorAll('.card-row').forEach(r => r.style.display = r.textContent.toLowerCase().includes(query) ? 'flex' : 'none');
    document.querySelectorAll('.deck-card').forEach(c => c.style.display = c.textContent.toLowerCase().includes(query) ? 'block' : 'none');
  },

  // Real-time Count Processing Functionality Module
  getParsedBulkItems: function() {
    const rawText = document.getElementById('bulk-paste-area').value;
    if (!rawText.trim()) return [];
    
    const lines = rawText.split('\n');
    const validPairs = [];

    lines.forEach(line => {
      if (!line.trim()) return;
      const separatorIndex = line.indexOf(',');
      if (separatorIndex === -1) return;

      const front = line.substring(0, separatorIndex).trim();
      const back = line.substring(separatorIndex + 1).trim();
      
      if (front && back) {
        validPairs.push({ front, back });
      }
    });
    return validPairs;
  },

  calculateBulkCards: function() {
    const validItems = this.getParsedBulkItems();
    const label = document.getElementById('bulk-counter-badge');
    if (label) {
      label.textContent = `${validItems.length} cards detected`;
    }
  },

  processBulkPaste: async function() {
    if (!this.state.activeDeckId) return alert('Select repository target workspace context');
    const items = this.getParsedBulkItems();
    
    if (!items.length) {
      return alert('No verified items found matching structural requirements: Front,Back');
    }

    for (const item of items) {
      await api.createCard(this.state.activeDeckId, item);
    }

    this.closeCardModal();
    await this.syncCardsFromStorage();
  },

  // ---- REVIEW SYSTEM ENGINE ----
  startStudySession: async function() {
    this.state.studyQueue = await api.getDueCards(this.state.activeDeckId);
    this.state.currentSessionIndex = 0;
    this.switchView('study');
    this.loadNextStudyItem();
  },

  loadNextStudyItem: function() {
    this.state.isCardFlipped = false;
    document.getElementById('study-rating-controls').classList.add('hidden');
    
    const frontNode = document.getElementById('card-display-front');
    const backNode = document.getElementById('card-display-back');

    if (this.state.currentSessionIndex >= this.state.studyQueue.length) {
      document.getElementById('study-progress-indicator').textContent = "Queue: 0";
      frontNode.textContent = "🎉 Review Complete!";
      backNode.classList.add('hidden-opacity');
      this.clearMetadataFooter();
      return;
    }

    const item = this.state.studyQueue[this.state.currentSessionIndex];
    document.getElementById('study-progress-indicator').textContent = `Remaining: ${this.state.studyQueue.length - this.state.currentSessionIndex}`;
    
    frontNode.textContent = item.front;
    backNode.textContent = item.back;
    frontNode.classList.remove('hidden-opacity');
    backNode.classList.add('hidden-opacity');
    this.renderMetadataFooter(item);
  },

  flipCard: function() {
    if (this.state.currentSessionIndex >= this.state.studyQueue.length) return;
    this.state.isCardFlipped = !this.state.isCardFlipped;
    
    const frontNode = document.getElementById('card-display-front');
    const backNode = document.getElementById('card-display-back');
    const controls = document.getElementById('study-rating-controls');

    if (this.state.isCardFlipped) {
      frontNode.classList.add('hidden-opacity');
      backNode.classList.remove('hidden-opacity');
      controls.classList.remove('hidden');
    } else {
      frontNode.classList.remove('hidden-opacity');
      backNode.classList.add('hidden-opacity');
      controls.classList.add('hidden');
    }
  },

  submitReview: async function(score) {
    const item = this.state.studyQueue[this.state.currentSessionIndex];
    await api.reviewCard(item.id, score);
    this.state.currentSessionIndex++;
    this.loadNextStudyItem();
  },

  renderMetadataFooter: function(schema) {
    const fmt = (iso) => iso ? new Date(iso).toLocaleDateString(undefined, {month:'short', day:'numeric', hour:'2-digit'}) : 'Never';
    document.getElementById('meta-created').textContent = fmt(schema.created_at || schema.dateCreated);
    document.getElementById('meta-reviewed').textContent = fmt(schema.dateLastReviewed);
    document.getElementById('meta-due').textContent = fmt(schema.due_date || schema.dateNeededToReview);
  },

  clearMetadataFooter: function() {
    ['created','reviewed','due'].forEach(id => document.getElementById(`meta-${id}`).textContent = '-');
  },

  bindGlobalKeyboardShortcuts: function() {
    document.addEventListener('keydown', (e) => {
      const activePanel = !document.getElementById('view-study').classList.contains('hidden');
      if (!activePanel || this.state.currentSessionIndex >= this.state.studyQueue.length) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.key === ' ' || e.key.toLowerCase() === 'f') {
        e.preventDefault();
        this.flipCard();
      } else if (this.state.isCardFlipped) {
        if (e.key === '1') this.submitReview(0);
        if (e.key === '2') this.submitReview(3);
        if (e.key === '3') this.submitReview(4);
        if (e.key === '4') this.submitReview(5);
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => AppEngine.init());