/**
 * File: js/uiController.js
 * Purpose: UI layout, navigation, modals, dropdowns
 * Namespace: AppEngine
 * Methods: switchView, changeLayoutMode, showAppDialog, closeAppDialog,
 *          toggleIntervalMenu, selectIntervalOption
 * Works With: AppEngine.state, DOM (view panels, modals, dropdown)
 * Notes: Escape closes modals/dialogs. Dialog returns Promise for confirm/cancel.
 */

AppEngine.switchView = function(viewTarget) {
  this.killWarmupTimer();
  ['decks', 'cards', 'study'].forEach(p => {
    const el = document.getElementById(`view-${p}`);
    if (el) el.classList.add('hidden');
  });
  const targetEl = document.getElementById(`view-${viewTarget}`);
  if (targetEl) targetEl.classList.remove('hidden');
  
  const overlay = document.getElementById('session-complete-overlay');
  if (overlay) overlay.classList.add('hidden');
};

AppEngine.changeLayoutMode = function(modeName, tabElement) {
  this.state.currentLayoutMode = modeName;
  document.querySelectorAll('.view-mode-selector .mode-tab').forEach(t => t.classList.remove('active'));
  if (tabElement) tabElement.classList.add('active');

  const grid = document.getElementById('decks-grid');
  if (grid) {
    grid.className = 'flat-grid';
    grid.classList.add(`dynamic-layout-${modeName}`);
  }
  this.renderDecksView();
};

AppEngine.showAppDialog = function(title, text, showCancelBtn = false) {
  return new Promise((resolve) => {
    this.state.activeDialogResolve = resolve;
    this.state.isDialogOpen = true; 
    
    document.getElementById('app-dialog-title').textContent = title;
    document.getElementById('app-dialog-body').textContent = text;
    
    const footer = document.getElementById('app-dialog-footer');
    const cancelBtn = footer.querySelector('.flat-action');
    if (cancelBtn) cancelBtn.style.display = showCancelBtn ? 'inline-block' : 'none';
    
    const modal = document.getElementById('app-dialog-modal');
    modal.classList.remove('hidden');

    setTimeout(() => {
      const confirmBtn = modal.querySelector('.flat-action.primary') || modal.querySelector('button:not([style*="none"])');
      if (confirmBtn) confirmBtn.focus();
    }, 50);
  });
};

AppEngine.closeAppDialog = function(isConfirmed) {
  document.getElementById('app-dialog-modal').classList.add('hidden');
  this.state.isDialogOpen = false;
  if (this.state.activeDialogResolve) {
    this.state.activeDialogResolve(isConfirmed);
    this.state.activeDialogResolve = null;
  }
};

/**
 * Modern Custom Interval Selector Menu Handlers
 */
AppEngine.toggleIntervalMenu = function(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('custom-dropdown-menu');
  if (!menu) return;
  
  const isVisible = menu.style.display === 'block';
  menu.style.display = isVisible ? 'none' : 'block';
};

AppEngine.selectIntervalOption = function(value, label) {
  // Update UI trigger text label
  const valLabel = document.getElementById('custom-dropdown-value');
  if (valLabel) valLabel.innerText = label;
  
  // Reset previous selector highlight states cleanly
  const options = document.querySelectorAll('.dropdown-opt');
  options.forEach(opt => {
    opt.style.backgroundColor = 'transparent';
    opt.style.color = '#334155';
    opt.style.fontWeight = 'normal';
  });

  // Highlight current selected element node matching custom layout reference
  if (window.event && window.event.currentTarget) {
    const targetElement = window.event.currentTarget;
    targetElement.style.backgroundColor = '#fef2f2';
    targetElement.style.color = '#ef4444';
    targetElement.style.fontWeight = '500';
  }

  // Update underlying state engine properties directly
  this.state.blitzInterval = value;

  // Dismiss flyout layout element securely
  const menu = document.getElementById('custom-dropdown-menu');
  if (menu) menu.style.display = 'none';
};

// Auto close dropdown menu wrapper if user clicks outside context bounds
window.addEventListener('click', () => {
  const menu = document.getElementById('custom-dropdown-menu');
  if (menu) menu.style.display = 'none';
});