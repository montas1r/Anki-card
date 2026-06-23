/**
 * Phase 2 Dynamic Search Core Utility Engine - Refactored
 */
const AppSearchEngine = {
  isActive: false,

  init: function() {
    this.injectStyles();
    this.setupListeners();
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
        flex-shrink: 0;
        transition: all 0.2s ease;
      }
      #search-toggle-trigger.active-state,
      #search-toggle-trigger:hover {
        background: rgba(66, 132, 117, 0.15);
        border-color: var(--accent-mint, #428475);
        color: var(--text-cream, #f7f4eb);
      }
      #search-utility-rack {
        background: #142a26;
        border: 1px solid rgba(66, 132, 117, 0.6);
        border-radius: 6px;
        padding: 0 12px;
        width: 260px;
        height: 34px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      #search-utility-rack.hidden {
        display: none !important;
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
      }
      #search-utility-rack input[type="text"]::placeholder {
        color: rgba(247, 244, 235, 0.35);
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

      /* Visual Red-Marking Error Highlighting Frame Style rules */
      .validation-error {
        border: 1px solid #ff4a4a !important;
        background: rgba(255, 74, 74, 0.05) !important;
        box-shadow: 0 0 4px rgba(255, 74, 74, 0.4);
        animation: subtleShake 0.2s ease-in-out 0s 2;
      }
      @keyframes subtleShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-2px); }
        75% { transform: translateX(2px); }
      }
    `;
    document.head.appendChild(styles);
  },

  setupListeners: function() {
    const triggerBtn = document.getElementById('search-toggle-trigger');
    const inputField = document.getElementById('deck-search-input');
    const clearBtn = document.getElementById('search-clear-btn');

    if (triggerBtn) {
      triggerBtn.onclick = (e) => {
        e.stopPropagation();
        this.toggleSearchRack();
      };
    }

    if (inputField) {
      inputField.oninput = (e) => this.executeUnifiedSearch(e.target.value);
      inputField.onkeydown = (e) => {
        if (e.key === 'Escape') {
          this.closeSearch();
          e.stopPropagation();
        }
      };
    }

    if (clearBtn) {
      clearBtn.onclick = () => {
        if (inputField.value === '') {
          this.closeSearch();
        } else {
          inputField.value = '';
          this.executeUnifiedSearch('');
          inputField.focus();
        }
      };
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && !this.isActive && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        this.toggleSearchRack();
      }
    });
  },

  toggleSearchRack: function() {
    const rack = document.getElementById('search-utility-rack');
    const trigger = document.getElementById('search-toggle-trigger');
    const input = document.getElementById('deck-search-input');

    if (!rack) return;

    if (rack.classList.contains('hidden')) {
      this.isActive = true;
      rack.classList.remove('hidden');
      if (trigger) trigger.classList.add('active-state');
      setTimeout(() => { if (input) input.focus(); }, 50);
    } else {
      this.closeSearch();
    }
  },

  closeSearch: function() {
    const rack = document.getElementById('search-utility-rack');
    const trigger = document.getElementById('search-toggle-trigger');
    const input = document.getElementById('deck-search-input');

    if (rack) rack.classList.add('hidden');
    if (trigger) trigger.classList.remove('active-state');
    if (input) input.value = '';
    
    this.isActive = false;
    this.executeUnifiedSearch('');
  },

  executeUnifiedSearch: function(query) {
    const cleanQuery = query.toLowerCase().trim();
    const cardsViewHidden = document.getElementById('view-cards').classList.contains('hidden');

    if (cardsViewHidden) {
      const repositoryBlocks = document.querySelectorAll('#decks-grid > .flat-card');
      repositoryBlocks.forEach(card => {
        const textContent = card.innerText.toLowerCase();
        card.classList.toggle('hidden', !textContent.includes(cleanQuery));
      });
    } else {
      const cardRows = document.querySelectorAll('#cards-list-workspace .card-row');
      cardRows.forEach(row => {
        const textContent = row.innerText.toLowerCase();
        row.classList.toggle('hidden', !textContent.includes(cleanQuery));
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AppSearchEngine.init();
});