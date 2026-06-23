/**
 * Module: UI Layout & Navigation Controller
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