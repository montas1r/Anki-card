/**
 * File: js/search.js
 * Purpose: Dynamic search/filter for decks and cards
 * Namespace: AppSearchEngine
 * Methods: init, injectStyles, renderSearchTrigger, toggleSearchRack, closeSearch,
 *          executeFilter, executeWorkspaceSearch, bindGlobalShortcuts
 * Works With: AppEngine, DOM (search-utility-rack, decks-grid, cards-list-workspace)
 * Notes: '/' key opens search. Searches card front/back text fields. Filters by innerText for decks.
 */
 
const AppSearchEngine = {
  isActive: false,

  init: function() {
    this.injectStyles();
    this.renderSearchTrigger();
    this.bindGlobalShortcuts();
  },

 injectStyles: function() {
    if (document.getElementById('search-dynamic-core-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'search-dynamic-core-styles';
    styles.textContent = `
      #search-toggle-trigger {
        background: transparent;
        border: 1px solid rgba(66, 132, 117, 0.4);
        border-radius: 4px;
        color: var(--accent-mint, #428475);
        cursor: pointer;
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        padding: 0;
        box-sizing: border-box;
        transition: all 0.2s ease;
      }
      #search-toggle-trigger:hover {
        background: rgba(66, 132, 117, 0.15);
        border-color: var(--accent-mint, #428475);
        color: var(--text-cream, #f7f4eb);
      }
      .search-anchor-wrapper {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        top: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1100;
      }
      #search-utility-rack {
        background: #142a26; /* Deepened match background */
        border: 1px solid rgba(66, 132, 117, 0.6);
        border-radius: 6px;
        padding: 0 12px;
        width: 320px;
        height: 34px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      }
      #search-utility-rack input[type="text"] {
        flex: 1;
        min-width: 0;
        width: 100% !important;
        background: transparent !important;
        border: none !important;
        font-size: 13px;
        color: var(--text-cream, #f7f4eb);
        outline: none !important;
        display: block !important;
      }
      #search-utility-rack input[type="text"]::placeholder {
        color: rgba(247, 244, 235, 0.35); /* Soft low-contrast text for placeholder */
      }
      .search-inside-icon {
        width: 14px;
        height: 14px;
        color: var(--accent-mint, #428475);
        opacity: 0.7;
        flex-shrink: 0;
      }
      .search-close-x {
        background: transparent;
        border: none;
        color: var(--text-cream, #f7f4eb);
        cursor: pointer;
        opacity: 0.4;
        font-size: 14px;
        padding: 4px;
        transition: opacity 0.2s;
      }
      .search-close-x:hover { opacity: 0.9; }
    `;
    document.head.appendChild(styles);
  },
  
 executeWorkspaceSearch: async function() {
    const query = document.getElementById('navbar-search-input').value.toLowerCase().trim();
    if (!this.state.activeDeckId) return;

    // Pull directly from the data state array instead of looking at raw screen text elements
    const allCards = await api.getCards(this.state.activeDeckId);
    
    if (!query) {
      this.state.cards = allCards; this.renderCardsView();
      return;
    }

    // STRICT MATCHING: Only look at actual card data text fields
    const filteredCards = allCards.filter(card => {
      const frontText = (card.front || '').toLowerCase();
      const backText = (card.back || '').toLowerCase();
      
      return frontText.includes(query) || backText.includes(query);
    });

    // Re-render the cleaned stream mapping
    this.state.cards = filteredCards; this.renderCardsView();
  },
  
  
  
  renderSearchTrigger: function() {
    // Look for any existing nav structure to append into
    const navbar = document.querySelector('.slim-navbar') 
                || document.querySelector('.repo-inline-controls')
                || document.querySelector('nav')
                || document.querySelector('header')
                || document.body; // Fallback to raw page framework if all else misses

    const oldBtn = document.getElementById('search-toggle-trigger');
    if (oldBtn) oldBtn.remove();

    const searchBtn = document.createElement('button');
    searchBtn.id = 'search-toggle-trigger';
    searchBtn.title = 'Search Decks (/)';
    searchBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px; display:block; pointer-events:none;">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    `;

    searchBtn.onclick = (e) => {
      e.stopPropagation();
      this.toggleSearchRack();
    };

    // Find custom toolbar action blocks inside your app wrapper, or just append directly
    const targetGroup = navbar.querySelector('.repo-inline-controls') || navbar;
    targetGroup.appendChild(searchBtn);
    console.log("Search button successfully appended to target tree:", targetGroup);
  },

  toggleSearchRack: function() {
    let rackContainer = document.getElementById('search-anchor-container');

    if (rackContainer) {
      this.closeSearch();
    } else {
      this.isActive = true;
      
      rackContainer = document.createElement('div');
      rackContainer.id = 'search-anchor-container';
      rackContainer.className = 'search-anchor-wrapper';
      
      rackContainer.innerHTML = `
        <div id="search-utility-rack">
          <svg class="search-inside-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" id="deck-search-input" placeholder="Filter repositories..." autocomplete="off">
          <button class="search-close-x" id="search-clear-btn">✕</button>
        </div>
      `;

      // Mount into navbar or body container safely
      const mountParent = document.querySelector('.slim-navbar') || document.body;
      mountParent.appendChild(rackContainer);

      const input = document.getElementById('deck-search-input');
      const clearBtn = document.getElementById('search-clear-btn');
      
      setTimeout(() => {
        if (input) {
          input.focus();
        }
      }, 50);
      
      input.oninput = (e) => this.executeFilter(e.target.value);
      
      clearBtn.onclick = () => {
        if (input.value === '') {
          this.closeSearch();
        } else {
          input.value = '';
          this.executeFilter('');
          input.focus();
        }
      };

      input.onkeydown = (e) => {
        if (e.key === 'Escape') {
          this.closeSearch();
          e.stopPropagation();
        }
      };
    }
  },

  closeSearch: function() {
    const rackContainer = document.getElementById('search-anchor-container');
    if (rackContainer) rackContainer.remove();
    this.isActive = false;
    this.executeFilter('');
  },

  executeFilter: function(query) {
    const cleanQuery = query.toLowerCase().trim();
    const cards = document.querySelectorAll('#decks-grid > .flat-card');
    
    cards.forEach(card => {
      const textContent = card.innerText.toLowerCase();
      if (textContent.includes(cleanQuery)) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  },

  bindGlobalShortcuts: function() {
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && !this.isActive && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        this.toggleSearchRack();
      }
    });
  }
};
document.addEventListener('DOMContentLoaded', () => {
  console.log("Search Engine script parsed and running self-start...");
  AppSearchEngine.init();
});