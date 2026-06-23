/**
 * Module: Card Item Unit Controller
 */

AppEngine.openAddCardModal = function() {
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
};

AppEngine.openEditCardModal = function(id, front, back) {
  this.state.editingCardId = id;
  
  document.getElementById('input-card-front').value = front;
  document.getElementById('input-card-back').value = back;
  
  if (window.BulkImportEngine) {
    BulkImportEngine.setCardModalMode('single');
  } else {
    document.getElementById('modal-form-single').classList.remove('hidden');
    document.getElementById('modal-form-bulk').classList.add('hidden');
  }
  
  const tabContainer = document.querySelector('.modal-mode-tabs');
  if (tabContainer) tabContainer.style.display = 'none';

  document.getElementById('card-modal').classList.remove('hidden');
};

AppEngine.closeCardModal = function() {
  this.state.editingCardId = null;
  document.getElementById('card-modal').classList.add('hidden');
  
  const tabContainer = document.querySelector('.modal-mode-tabs');
  if (tabContainer) tabContainer.style.display = 'flex';
};

AppEngine.commitCardWindowData = function() {
  const formBulk = document.getElementById('modal-form-bulk');
  
  if (formBulk && !formBulk.classList.contains('hidden')) {
    if (window.BulkImportEngine) {
      window.BulkImportEngine.processBulkPaste();
    } else {
      console.error("Runtime Exception: window.BulkImportEngine is unallocated.");
    }
  } else {
    this.commitCard();
  }
};

AppEngine.commitCard = async function() {
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
};

AppEngine.removeCard = async function(id) {
  await api.deleteCard(id);
  await this.syncCardsFromStorage();
};

AppEngine.renderCardsView = function() {
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
};