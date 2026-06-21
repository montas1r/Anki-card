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
    editingCardId: null
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

  openEditCardModal: function(id, front, back) {
    this.state.editingCardId = id;
    document.getElementById('input-card-front').value = front;
    document.getElementById('input-card-back').value = back;
    document.getElementById('card-modal').classList.remove('hidden');
  },

  openDeckWorkspace: function(deckId, targetTitle) {
    this.state.activeDeckId = deckId;
    document.getElementById('active-deck-title').textContent = targetTitle;
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

  closeCardModal: function() {
    this.state.editingCardId = null;
    document.getElementById('input-card-front').value = '';
    document.getElementById('input-card-back').value = '';
    document.getElementById('card-modal').classList.add('hidden');
  },

  // ---- WORKSPACE RENDER LAYERS ----
  renderDecksView: function() {
    const container = document.getElementById('decks-grid');
    if (!container) return;
    if (!this.state.decks.length) {
      container.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:20px; opacity:0.5;">No active decks found.</p>`;
      return;
    }
    container.innerHTML = this.state.decks.map(d => {
      const escape = (str) => (str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
      return `
        <div class="deck-card" onclick="AppEngine.openDeckWorkspace(${d.id}, '${escape(d.name)}')">
          <h4 style="font-weight:600; margin-bottom:4px;">${d.name}</h4>
          <p style="font-size:12px; opacity:0.7; min-height:32px;">${d.description || 'No directives.'}</p>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; font-size:11px;">
            <span style="color:var(--primary-teal); font-weight:600;">Due: ${d.due_cards ?? 0}</span>
            <div style="display:flex; gap:4px; align-items:center;">
              <button class="icon-btn ghost" style="width:26px; height:26px; border:1px solid rgba(66,132,117,0.3);" title="Edit Deck" onclick="AppEngine.openEditDeckModal(${d.id}, '${escape(d.name)}', '${escape(d.description)}', event)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px; height:13px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path></svg>
              </button>
              <button class="btn danger" style="padding:2px 6px; font-size:11px;" onclick="AppEngine.removeDeck(${d.id}, event)">Delete</button>
            </div>
          </div>
        </div>`;
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
            <button class="btn flat-action" style="color:var(--error-crimson); padding:0 4px;" onclick="AppEngine.removeCard(${c.id})">✕</button>
          </div>
        </div>`;
    }).join('');
  },

// ---- SEARCH ENGINE TRANSITIONS ----
  toggleSearchPanel: function() {
    const importRack = document.getElementById('import-utility-rack');
    if (importRack) importRack.classList.add('hidden');
    
    const searchRack = document.getElementById('search-utility-rack');
    const triggerBtn = document.getElementById('search-nav-btn');
    if (!searchRack) return;

    searchRack.classList.toggle('hidden');
    if (!searchRack.classList.contains('hidden')) {
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

  toggleImportPanel: function() {
    const searchRack = document.getElementById('search-utility-rack');
    const triggerBtn = document.getElementById('search-nav-btn');
    if (searchRack) {
      searchRack.classList.add('hidden');
      if (triggerBtn) triggerBtn.style.visibility = 'visible';
    }
    
    const importRack = document.getElementById('import-utility-rack');
    if (importRack) importRack.classList.toggle('hidden');
  },

  // 2. Multi-Target Comprehensive Search (Decks + Cards Deep Lookup)
  executeWorkspaceSearch: function() {
    const input = document.getElementById('navbar-search-input');
    if (!input) return;
    const query = input.value.toLowerCase().trim();
    
    // Filter Card Rows inside the workspace view
    document.querySelectorAll('.card-row').forEach(row => {
      // Searches both the prompt faces and target metadata answers seamlessly
      const textContent = row.textContent.toLowerCase();
      row.style.display = textContent.includes(query) ? 'flex' : 'none';
    });

    // Filter Repositories Grid View elements
    document.querySelectorAll('.deck-card').forEach(card => {
      const textContent = card.textContent.toLowerCase();
      card.style.display = textContent.includes(query) ? 'block' : 'none';
    });
  },

  executeJSONImport: function() {
    const field = document.getElementById('import-file-field');
    if (!field.files.length) return alert('Select file context');
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of items) {
          if (item.front && item.back) await api.createCard(this.state.activeDeckId, item);
        }
        await this.syncCardsFromStorage();
        this.toggleImportPanel();
      } catch (err) { alert('Import processing failed.'); }
    };
    reader.readAsText(field.files[0]);
  },

  // ---- REVIEW LOGIC TUNING MODULE ----
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