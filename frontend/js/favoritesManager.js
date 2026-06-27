/**
 * File: js/favoritesManager.js
 * Purpose: Card starring/favoriting + favorites filter + preview overlay
 * Namespace: AppEngine
 * Methods: toggleCardStarInline, toggleFavoritesFilter, openPreviewOverlay, escapeHTML
 * Works With: api.js (updateCard), AppEngine.state.cards, DOM (filter-fav-toggle, preview modal)
 * Notes: Preview overlay shows table of all cards with star status. Dark text on light bg.
 */

// Initialize state trackers under the main AppEngine namespace
AppEngine.state.isFavoritesOnly = false;

/**
 * Toggles the favorite status of an individual card item
 */
AppEngine.toggleCardStarInline = async function(cardId) {
  // Use loose comparison (==) since IDs might be numbers or string formats
  const card = this.state.cards.find(c => c.id == cardId);
  if (!card) return;

  card.isFavorite = !card.isFavorite;

  try {
    // Persist down to the existing storage engine layer
    await window.api.updateCard(cardId, card);
    
    // Refresh the UI display using your specific system view function
    this.renderCardsView();
  } catch (e) {
    console.error("Failed to commit card favorite state modification:", e);
  }
};

/**
 * Switches the global workspace view filter to isolate starred components
 */
// UPDATE THIS METHOD INSIDE js/favoritesManager.js
AppEngine.toggleFavoritesFilter = function() {
  this.state.isFavoritesOnly = !this.state.isFavoritesOnly;
  
  const btn = document.getElementById('filter-fav-toggle');
  if (btn) {
    btn.classList.toggle('active', this.state.isFavoritesOnly);
    const starSvg = btn.querySelector('svg');
    if (starSvg) {
      // If active, fill with warm gold; if off, blend seamlessly back into the standard teal action tier
      starSvg.setAttribute('fill', this.state.isFavoritesOnly ? '#ffc107' : 'none');
      starSvg.setAttribute('stroke', this.state.isFavoritesOnly ? '#ffc107' : 'currentColor');
    }
  }
  
  this.renderCardsView();
};

/**
 * Renders the high-visibility, dark text matrix ledger stream modal overlay
 */
/**
 * Renders the high-visibility, dark text matrix ledger stream modal overlay
 */
AppEngine.openPreviewOverlay = function() {
  const tableBody = document.getElementById('preview-overlay-table-body');
  if (!tableBody) return;

  if (!this.state.cards || this.state.cards.length === 0) {
    tableBody.innerHTML = `<p style="text-align:center; padding:20px; color:#142a26; opacity:0.6;">No flashcards found inside the active deck.</p>`;
  } else {
    tableBody.innerHTML = `
      <table style="width:100%; border-collapse:collapse; color:#142a26; text-align:left; font-size:14px; font-family:sans-serif;">
        <thead>
          <tr style="border-bottom:2px solid #142a26; background:rgba(20,42,38,0.06);">
            <th style="padding:12px; font-weight:700;">Front Prompt Context</th>
            <th style="padding:12px; font-weight:700;">Back Target Solution</th>
            <th style="padding:12px; width:80px; text-align:center; font-weight:700;">Starred</th>
          </tr>
        </thead>
        <tbody>
          ${this.state.cards.map(c => {
            // Fix: correctly check c.isFavorite and apply dark shade of stroke color if true
            const starFillColor = c.isFavorite ? "rgba(20, 42, 38, 0.8)" : "none";
            const starStrokeColor = "#142a26";
            
            const starMarkup = `
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${starFillColor}" stroke="${starStrokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star" style="display:inline-block; vertical-align:middle;">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            `;

            return `
              <tr style="border-bottom:1px solid rgba(20,42,38,0.15);">
                <td style="padding:12px; font-weight:600; max-width:260px; word-break:break-word;">${this.escapeHTML(c.front || '')}</td>
                <td style="padding:12px; color:rgba(20,42,38,0.85); max-width:300px; word-break:break-word;">${this.escapeHTML(c.back || '')}</td>
                <td style="padding:12px; text-align:center;">${starMarkup}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }
  const modal = document.getElementById('preview-overlay-modal');
  if (modal) modal.classList.remove('hidden');
};
AppEngine.escapeHTML = function(str) {
  return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
};