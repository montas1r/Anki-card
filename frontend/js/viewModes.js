/**
 * Deck Render Strategies for Multiple View Profiles - Icon Variant
 */
const DeckRenderModes = {
  escape: (str) => (str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;'),

  blocks: function(d, escape) {
    return `
      <div class="deck-card mode-blocks" onclick="AppEngine.openDeckWorkspace(${d.id}, '${escape(d.name)}')">
        <h4>${d.name}</h4>
        <p>${d.description || 'No directives.'}</p>
        <div class="deck-meta-row">
          <span class="due-pill">Due: ${d.due_cards ?? 0}</span>
          ${this.renderActions(d, escape)}
        </div>
      </div>`;
  },

  tiles: function(d, escape) {
    return `
      <div class="deck-card mode-tiles" onclick="AppEngine.openDeckWorkspace(${d.id}, '${escape(d.name)}')">
        <div class="tile-content">
          <h4>${d.name}</h4>
          <p>${d.description || ''}</p>
        </div>
        <div class="deck-meta-row">
          <span class="due-pill">Due: ${d.due_cards ?? 0}</span>
          ${this.renderActions(d, escape)}
        </div>
      </div>`;
  },

  list: function(d, escape) {
    return `
      <div class="deck-card mode-list" onclick="AppEngine.openDeckWorkspace(${d.id}, '${escape(d.name)}')">
        <div class="list-left">
          <h4>${d.name}</h4>
          <span class="list-desc">— ${d.description || 'No directives.'}</span>
        </div>
        <div class="deck-meta-row">
          <span class="due-pill">Due: ${d.due_cards ?? 0}</span>
          ${this.renderActions(d, escape)}
        </div>
      </div>`;
  },

  small: function(d, escape) {
    return `
      <div class="deck-card mode-small" onclick="AppEngine.openDeckWorkspace(${d.id}, '${escape(d.name)}')">
        <h4>${d.name}</h4>
        <div class="deck-meta-row">
          <span class="due-pill">Due: ${d.due_cards ?? 0}</span>
          ${this.renderActions(d, escape)}
        </div>
      </div>`;
  },

  big: function(d, escape) {
    return `
      <div class="deck-card mode-big" onclick="AppEngine.openDeckWorkspace(${d.id}, '${escape(d.name)}')">
        <div class="big-header">
          <h4>${d.name}</h4>
          <span class="due-pill">Due: ${d.due_cards ?? 0}</span>
        </div>
        <p class="big-desc">${d.description || 'No operational directives assigned to this structural repository resource.'}</p>
        <div class="preview-cards-box">
          <span class="preview-tag">System Workspace Container Data Matrix</span>
        </div>
        <div class="deck-meta-row" style="margin-top: 16px;">
          <span></span>
          ${this.renderActions(d, escape)}
        </div>
      </div>`;
  },

  renderActions: function(d, escape) {
    return `
      <div class="deck-action-cluster" onclick="event.stopPropagation()">
        <button class="icon-btn ghost action-edit-spec" title="Edit Deck" onclick="AppEngine.openEditDeckModal(${d.id}, '${escape(d.name)}', '${escape(d.description)}', event)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path></svg>
        </button>
        <button class="icon-btn danger-icon btn-deck-del" title="Delete Deck" onclick="AppEngine.removeDeck(${d.id}, event)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        </button>
      </div>`;
  }
};