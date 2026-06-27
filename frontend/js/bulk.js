/**
 * File: js/bulk.js
 * Purpose: Bulk CSV import — paste "front,back" pairs to create multiple cards
 * Namespace: window.BulkImportEngine
 * Methods: setCardModalMode, getParsedBulkItems, calculateBulkCards, processBulkPaste, initListeners
 * Works With: AppEngine (openAddCardModal, syncCardsFromStorage), DOM (bulk-paste-area)
 * Notes: Parses comma-separated lines. Real-time card counter badge.
 */
 
 
window.BulkImportEngine = {
  get state() {
    return AppEngine.state;
  },

  setCardModalMode: function(mode) {
    const formSingle = document.getElementById('modal-form-single');
    const formBulk = document.getElementById('modal-form-bulk');
    const submitBtn = document.getElementById('modal-card-submit-btn');
    const headline = document.getElementById('modal-card-headline');
    const tabSingle = document.getElementById('tab-mode-single');
    const tabBulk = document.getElementById('tab-mode-bulk');

    if (mode === 'bulk') {
      if (formSingle) formSingle.classList.add('hidden');
      if (formBulk) formBulk.classList.remove('hidden');
      if (submitBtn) submitBtn.textContent = 'Commit Bulk Load';
      if (headline) headline.textContent = 'Bulk Load Matrix';
      if (tabSingle) tabSingle.classList.remove('active');
      if (tabBulk) tabBulk.classList.add('active');
    } else {
      if (formBulk) formBulk.classList.add('hidden');
      if (formSingle) formSingle.classList.remove('hidden');
      if (submitBtn) submitBtn.textContent = this.state.editingCardId ? 'Save Changes' : 'Save Card';
      if (headline) headline.textContent = this.state.editingCardId ? 'Edit Flashcard' : 'Append Flashcard';
      if (tabBulk) tabBulk.classList.remove('active');
      if (tabSingle) tabSingle.classList.add('active');
    }
  },

  getParsedBulkItems: function() {
    const bulkArea = document.getElementById('bulk-paste-area');
    if (!bulkArea) return [];
    
    const rawText = bulkArea.value;
    if (!rawText.trim()) return [];
    
    const lines = rawText.split('\n');
    const validPairs = [];
    lines.forEach(line => {
      if (!line.trim()) return;
      const separatorIndex = line.indexOf(',');
      if (separatorIndex === -1) return;
      const front = line.substring(0, separatorIndex).trim();
      const back = line.substring(separatorIndex + 1).trim();
      if (front && back) validPairs.push({ front, back, weight: 10 });
    });
    return validPairs;
  },

  calculateBulkCards: function() {
    const validItems = this.getParsedBulkItems();
    const label = document.getElementById('bulk-counter-badge');
    if (label) label.textContent = `${validItems.length} cards detected`;
  },

  processBulkPaste: async function() {
    if (!this.state.activeDeckId) {
      return AppEngine.showAppDialog('Context Error', 'Select target workspace repository context first.');
    }
    const items = this.getParsedBulkItems();
    if (!items.length) {
      return AppEngine.showAppDialog('Data Error', 'No pairs matching format structure requirements: Front,Back');
    }

    // Sequentially wait for database execution commits
    for (const item of items) {
      if (window.api && typeof window.api.createCard === 'function') {
        await window.api.createCard(this.state.activeDeckId, item);
      } else {
        console.error("Database backend layer API access channel is offline!");
      }
    }

    // Clear textarea
    const bulkArea = document.getElementById('bulk-paste-area');
    if (bulkArea) bulkArea.value = '';

    // Clear search filter context
    const searchBar = document.getElementById('navbar-search-input');
    if (searchBar) searchBar.value = '';

    AppEngine.closeCardModal();
    await AppEngine.syncCardsFromStorage();
  },

  initListeners: function() {
    document.body.addEventListener('input', (e) => {
      if (e.target && e.target.id === 'bulk-paste-area') {
        this.calculateBulkCards();
      }
    });
  }
};

// Auto-initialize real-time badge counters
document.addEventListener('DOMContentLoaded', () => window.BulkImportEngine.initListeners());