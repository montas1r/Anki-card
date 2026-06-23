/**
 * Module: Deck Workspace Repository Controller
 */

AppEngine.openEditDeckModal = function(id, name, desc, event) {
  if (event) event.stopPropagation();
  this.state.editingDeckId = id;
  
  document.getElementById('input-deck-name').value = name;
  document.getElementById('input-deck-desc').value = desc;
  
  const headline = document.getElementById('modal-deck-headline');
  const submitBtn = document.getElementById('modal-deck-submit-btn');
  if (headline) headline.textContent = 'Modify Deck Settings';
  if (submitBtn) submitBtn.textContent = 'Save Changes';
  
  document.getElementById('deck-modal').classList.remove('hidden');
};

AppEngine.closeDeckModal = function() {
  this.state.editingDeckId = null;
  document.getElementById('input-deck-name').value = '';
  document.getElementById('input-deck-desc').value = '';
  
  const headline = document.getElementById('modal-deck-headline');
  const submitBtn = document.getElementById('modal-deck-submit-btn');
  if (headline) headline.textContent = 'Initialize Deck';
  if (submitBtn) submitBtn.textContent = 'Create';
  
  document.getElementById('deck-modal').classList.add('hidden');
};

AppEngine.commitDeck = async function() {
  const nameInp = document.getElementById('input-deck-name');
  const descInp = document.getElementById('input-deck-desc');
  if (!nameInp) return;

  const name = nameInp.value.trim();
  const description = descInp ? descInp.value.trim() : '';
  if (!name) return this.showAppDialog('Validation Error', 'Missing Identifier Title.');

  try {
    if (window.api) {
      if (this.state.editingDeckId) {
        await window.api.deleteDeck(this.state.editingDeckId);
        await window.api.createDeck({ name, description });
        this.state.editingDeckId = null;
      } else {
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
};

AppEngine.openDeckWorkspace = function(deckId, targetTitle) {
  this.state.activeDeckId = deckId;
  document.getElementById('active-deck-title').textContent = targetTitle;
  this.switchView('cards');
  this.syncCardsFromStorage();
};

AppEngine.removeDeck = async function(id, event) {
  if (event) event.stopPropagation();
  const confirmed = await this.showAppDialog('Confirm Drop', 'Permanently drop deck repository?', true);
  if (confirmed) {
    await api.deleteDeck(id);
    await this.syncDecksFromStorage();
  }
};

AppEngine.renderDecksView = function() {
  const container = document.getElementById('decks-grid');
  if (!container) return;
  if (!this.state.decks.length) {
    container.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:20px; opacity:0.5;">No active decks found.</p>`;
    return;
  }
  const mode = this.state.currentLayoutMode || 'blocks';
  container.innerHTML = this.state.decks.map(d => DeckRenderModes[mode](d, DeckRenderModes.escape)).join('');
};