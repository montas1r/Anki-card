/**
 * File: js/viewModes.js
 * Purpose: Deck render strategies — blocks, tiles, list, small, big layouts
 * Namespace: DeckRenderModes
 * Methods: blocks, tiles, list, small, big, renderActions, escape
 * Works With: AppEngine.renderDecksView, DOM (decks-grid)
 * Notes: Each mode returns HTML string. 'small' uses folder SVG icon. Inline styles for layout.
 */
 
 
const DeckRenderModes = {
  escape: (str) => (str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;'),

  blocks: function(d, esc) {
    // FIXED: Properly handle the empty payload checking before injecting the string snippet
    const descriptionHTML = d.description 
      ? `<p class="deck-desc-text">${d.description}</p>` 
      : `<p class="deck-desc-text empty-payload" style="display: none;"></p>`;

    return `
      <div class="flat-card mode-block-item" onclick="AppEngine.openDeckWorkspace(${d.id}, '${esc(d.name)}')">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; width:100%;">
          <div style="flex: 1;">
            <h3 style="margin: 0 0 4px 0; font-size: 16px;">${d.name}</h3>
            ${descriptionHTML}
          </div>
          <div class="repo-inline-controls" onclick="event.stopPropagation();">
            <button class="icon-btn ghost" title="Instant Blitz Run" onclick="AppEngine.triggerDirectDeckSession(${d.id}, '${esc(d.name)}', true)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; height:14px; fill:currentColor;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            </button>
            <button class="icon-btn ghost" title="Study Due" onclick="AppEngine.triggerDirectDeckSession(${d.id}, '${esc(d.name)}', false)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; height:14px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </button>
            <button class="icon-btn ghost" title="Modify Context" onclick="AppEngine.openEditDeckModal(${d.id}, '${esc(d.name)}', '${esc(d.description)}', event)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px; height:12px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path></svg>
            </button>
            <button class="icon-btn danger-icon" title="Drop Deck" onclick="AppEngine.removeDeck(${d.id}, event)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px; height:12px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      </div>`;
  },

  tiles: function(d, esc) {
    // FIXED: Dropped placeholder fallback string to prevent search bar interference
    const displayDesc = d.description ? esc(d.description) : '';
    return `
      <div class="flat-card mode-tile-item" onclick="AppEngine.openDeckWorkspace(${d.id}, '${esc(d.name)}')">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <h4 style="margin:0; font-size:14px; font-weight:700;">${d.name}</h4>
          <div class="repo-inline-controls" onclick="event.stopPropagation();" style="gap:2px;">
            <button class="icon-btn ghost" style="width:22px; height:22px;" onclick="AppEngine.triggerDirectDeckSession(${d.id}, '${esc(d.name)}', true)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px; height:11px; fill:currentColor;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg></button>
            <button class="icon-btn ghost" style="width:22px; height:22px;" onclick="AppEngine.triggerDirectDeckSession(${d.id}, '${esc(d.name)}', false)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px; height:11px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></button>
          </div>
        </div>
        <p style="font-size:11px; margin:0; opacity:0.8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${displayDesc}</p>
      </div>`;
  },

  list: function(d, esc) {
    return `
      <div class="flat-card mode-list-item" style="display:flex; align-items:center; justify-content:between; width:100%; padding:12px 16px;" onclick="AppEngine.openDeckWorkspace(${d.id}, '${esc(d.name)}')">
        <div style="flex:1;">
          <strong style="font-size:14px; color:var(--bg-dark);">${d.name}</strong>
          <span style="font-size:12px; margin-left:12px; color:var(--primary-teal); opacity:0.8;">${d.description ? esc(d.description) : ''}</span>
        </div>
        <div class="repo-inline-controls" onclick="event.stopPropagation();">
          <button class="icon-btn ghost" title="Instant Blitz Run" onclick="AppEngine.triggerDirectDeckSession(${d.id}, '${esc(d.name)}', true)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px; height:12px; fill:currentColor;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg></button>
          <button class="icon-btn ghost" title="Study Due" onclick="AppEngine.triggerDirectDeckSession(${d.id}, '${esc(d.name)}', false)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px; height:12px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></button>
        </div>
      </div>`;
  },

  small: function(d, esc) {
    return `
      <div class="flat-card mode-small-item" style="padding:6px 12px; font-size:12px; font-weight:600; display:flex; justify-content:space-between; align-items:center;" onclick="AppEngine.openDeckWorkspace(${d.id}, '${esc(d.name)}')">
        <span style="display:inline-flex; align-items:center; gap:6px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
          ${d.name}
        </span>
        <div class="repo-inline-controls" onclick="event.stopPropagation();" style="gap:2px;">
          <button class="icon-btn ghost" style="width:20px; height:20px;" onclick="AppEngine.triggerDirectDeckSession(${d.id}, '${esc(d.name)}', true)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:10px; height:10px; fill:currentColor;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg></button>
        </div>
      </div>`;
  },

  big: function(d, esc) {
    // FIXED: Dropped long placeholder fallback string layout to prevent search bar interference
    const displayDesc = d.description ? esc(d.description) : '';
    return `
      <div class="flat-card mode-big-item" style="padding:24px;" onclick="AppEngine.openDeckWorkspace(${d.id}, '${esc(d.name)}')">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h2 style="margin:0; font-size:20px; color:var(--bg-dark);">${d.name}</h2>
          <div class="repo-inline-controls" onclick="event.stopPropagation();">
            <button class="btn dynamic-btn success" style="padding:4px 12px; font-size:12px;" onclick="AppEngine.triggerDirectDeckSession(${d.id}, '${esc(d.name)}', true)">⚡ Blitz</button>
            <button class="btn dynamic-btn primary" style="padding:4px 12px; font-size:12px;" onclick="AppEngine.triggerDirectDeckSession(${d.id}, '${esc(d.name)}', false)">▶ Study</button>
          </div>
        </div>
        <p style="font-size:13px; color:var(--primary-teal); line-height:1.5;">${displayDesc}</p>
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