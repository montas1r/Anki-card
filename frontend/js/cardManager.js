/**
 * File: js/cardManager.js
 * Purpose: Card CRUD + favorites + undo toast notifications
 * Namespace: AppEngine
 * Methods: openAddCardModal, openEditCardModal, closeCardModal, commitCard,
 *          commitCardWindowData, removeCard, undoLastCardDeletion,
 *          renderCardsView, showDeletionToast, dismissToastElement
 * Works With: api.js, AppEngine.state.cards, DOM (card-modal, toast container)
 * Notes: lastDeletedCardCache enables undo. isFavoritesOnly filter supported.
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
    // Preserve favorite status when updating card info
    const existingCard = this.state.cards.find(c => c.id == this.state.editingCardId);
    const isFavorite = existingCard ? existingCard.isFavorite : false;
    await api.updateCard(this.state.editingCardId, { front, back, isFavorite });
    this.state.editingCardId = null;
  } else {
    await api.createCard(this.state.activeDeckId, { front, back, isFavorite: false });
  }
  this.closeCardModal();
  await this.syncCardsFromStorage();
};

/**
 * Global cache to hold the last deleted flashcard for the runtime Undo engine loop
 */
AppEngine.lastDeletedCardCache = null;

AppEngine.removeCard = async function(id) {
  // 1. Find and preserve card details for potential restoration before executing deletion
  const cardToBackup = this.state.cards.find(c => c.id == id);
  if (cardToBackup) {
    this.lastDeletedCardCache = { ...cardToBackup, associatedDeckId: this.state.activeDeckId };
  }

  // 2. Clear out from database storage immediately without native confirm popup blocks
  await api.deleteCard(id);
  await this.syncCardsFromStorage();

  // 3. Render the customized warning template toast notification with Undo access
  if (cardToBackup) {
    this.showDeletionToast(cardToBackup.front);
  }
};

/**
 * Generates and animates a premium custom toast notification alert block matching specified layout definitions
 */
/**
 * Generates and animates a premium custom toast notification alert block matching specified layout definitions
 */
AppEngine.showDeletionToast = function(cardFrontText) {
  const container = document.getElementById('toast-notification-container');
  if (!container) return;

  // Limit visual length of string for clean UI mapping
  const truncatedText = cardFrontText.length > 30 ? cardFrontText.substring(0, 27) + '...' : cardFrontText;
  const toastId = 'toast-' + Date.now();

  const toastHTML = `
    <div id="${toastId}" role="alert" style="
      background-color: #fefce8;
      padding: 16px;
      border-radius: 6px;
      border: 1px solid #fef08a;
      border-left: 4px solid #a16207;
      position: relative;
      transition: all 0.3s ease;
      transform: translateX(50px);
      opacity: 0;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      width: 100%;
      box-sizing: border-box;
    ">
      <div style="display: flex; align-items: start; gap: 10px;">
        
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 486.463 486.463" aria-hidden="true" style="
          width: 18px;
          height: 18px;
          min-width: 18px;
          min-height: 18px;
          fill: #a16207;
          display: inline-block;
          vertical-align: middle;
          margin-top: 1px;
        ">
          <path d="M243.225 333.382c-13.6 0-25 11.4-25 25s11.4 25 25 25c13.1 0 25-11.4 24.4-24.4.6-14.3-10.7-25.6-24.4-25.6" />
          <path d="M474.625 421.982c15.7-27.1 15.8-59.4.2-86.4l-156.6-271.2c-15.5-27.3-43.5-43.5-74.9-43.5s-59.4 16.3-74.9 43.4l-156.8 271.5c-15.6 27.3-15.5 59.8.3 86.9 15.6 26.8 43.5 42.9 74.7 42.9h312.8c31.3 0 59.4-16.3 75.2-43.6m-34-19.6c-8.7 15-24.1 23.9-41.3 23.9h-312.8c-17 0-32.3-8.7-40.8-23.4-8.6-14.9-8.7-32.7-.1-47.7l156.8-271.4c8.5-14.9 23.7-23.7 40.9-23.7 17.1 0 32.4 8.9 40.9 23.8l156.7 271.4c8.4 14.6 8.3 32.2-.3 47.1" />
          <path d="M237.025 157.882c-11.9 3.4-19.3 14.2-19.3 27.3.6 7.9 1.1 15.9 1.7 23.8 1.7 30.1 3.4 59.6 5.1 89.7.6 10.2 8.5 17.6 18.7 17.6s18.2-7.9 18.7-18.2c0-6.2 0-11.9.6-18.2 1.1-19.3 2.3-38.6 3.4-57.9.6-12.5 1.7-25 2.3-37.5 0-4.5-.6-8.5-2.3-12.5-5.1-11.2-17-16.9-28.9-14.1" />
        </svg>
        
        <div style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column;">
          <p style="margin: 0; font-size: 14px; color: #0f172a; font-weight: 500; font-family: sans-serif; line-height: 1.25;">Card deleted</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569; font-family: sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            "${this.escapeHTML(truncatedText)}" has been removed.
          </p>
          
          <button type="button" onclick="AppEngine.undoLastCardDeletion('${toastId}')" style="
            align-self: start;
            font-size: 12px;
            font-weight: 600;
            color: #854d0e;
            text-decoration: underline;
            background: none;
            border: none;
            padding: 0;
            margin-top: 6px;
            cursor: pointer;
            font-family: sans-serif;
          ">
            Undo Action
          </button>
        </div>

        <button type="button" aria-label="Dismiss alert" onclick="AppEngine.dismissToastElement('${toastId}')" style="
          margin-left: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.7;
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 329.269 329" style="width: 10px; height: 10px; fill: #64748b;">
            <path d="M194.8 164.77 323.013 36.555c8.343-8.34 8.343-21.825 0-30.164-8.34-8.34-21.825-8.34-30.164 0L164.633 134.605 36.422 6.391c-8.344-8.34-21.824-8.34-30.164 0-8.344 8.34-8.344 21.824 0 30.164l128.21 128.215L6.259 292.984c-8.344 8.34-8.344 21.825 0 30.164a21.27 21.27 0 0 0 15.082 6.25c5.46 0 10.922-2.09 15.082-6.25l128.21-128.214 128.216 128.214a21.27 21.27 0 0 0 15.082 6.25c5.46 0 10.922-2.09 15.082-6.25 8.343-8.34 8.343-21.824 0-30.164zm0 0" />
          </svg>
        </button>

      </div>
    </div>
  `;

  // Append new toast element node structure securely
  container.insertAdjacentHTML('beforeend', toastHTML);
  const generatedElement = document.getElementById(toastId);

  // Trigger smooth slide entry transition sequence frame delay
  setTimeout(() => {
    if (generatedElement) {
      generatedElement.style.transform = 'translateX(0)';
      generatedElement.style.opacity = '1';
    }
  }, 50);

  // Auto-dismiss safely after 6 seconds if left completely untouched
  setTimeout(() => {
    AppEngine.dismissToastElement(toastId);
  }, 6000);
};


/**
 * Smoothly animates out and detaches a specific target toast instance from the DOM
 */
AppEngine.dismissToastElement = function(toastId) {
  const element = document.getElementById(toastId);
  if (!element) return;

  element.style.transform = 'translateX(100px)';
  element.style.opacity = '0';

  setTimeout(() => {
    if (element.parentNode) {
      element.remove();
    }
  }, 300);
};

/**
 * Restores the cached deleted item back to the database system layer
 */
AppEngine.undoLastCardDeletion = async function(toastId) {
  if (!this.lastDeletedCardCache) return;

  try {
    const { associatedDeckId, front, back, isFavorite } = this.lastDeletedCardCache;
    
    // Write data back into local database storage layer using internal api hooks
    await api.createCard(associatedDeckId, { front, back, isFavorite: isFavorite || false });
    
    // Clear out cache variables to prevent multiple duplicate undo submissions
    this.lastDeletedCardCache = null;

    // Instantly sync layout views to show restored items
    await this.syncCardsFromStorage();
    
    // Dismiss the active notification instance cleanly
    this.dismissToastElement(toastId);
  } catch (e) {
    console.error("Critical failure encountered while reversing target card deletion step:", e);
  }
};


AppEngine.renderCardsView = function() {
  const container = document.getElementById('cards-list-workspace');
  if (!container) return;

  let activePool = [...this.state.cards];

  // 1. Isolate favorite items if the UI filter toggle is true
  if (this.state.isFavoritesOnly) {
    activePool = activePool.filter(c => c.isFavorite);
  }

  if (!activePool.length) {
    container.innerHTML = `<p style="text-align:center; padding:30px; opacity:0.5;">No flashcards available matching filters.</p>`;
    return;
  }

  container.innerHTML = activePool.map(c => {
    const escape = (str) => (str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    
    // Determine dynamic star design color palettes
    // Find these variable rows inside AppEngine.renderCardsView template generation loop:
const starFillColor = c.isFavorite ? 'rgba(20, 42, 38, 0.8)' : 'none';
const starStrokeColor = '#142a26';

    return `
      <div class="card-row">
        <div style="max-width:70%;">
          <div style="font-weight:600; font-size:14px; margin-bottom:2px;">${c.front}</div>
          <div style="font-size:12px; color:var(--primary-teal);">${c.back}</div>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          
          <button class="icon-btn ghost" style="width:28px; height:28px; border:1px solid rgba(66,132,117,0.3); color: ${c.isFavorite ? '#ffc107' : 'var(--primary-teal)'};" title="Toggle Favorite" onclick="AppEngine.toggleCardStarInline('${c.id}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="${starFillColor}" stroke="${starStrokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>
          </button>

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