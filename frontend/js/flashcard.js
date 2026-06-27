/**
 * File: js/flashcard.js
 * Purpose: Study session engine — card flipping, rating, queue management, blitz mode
 * Namespace: FlashcardEngine
 * Methods: prepareSessionQueue, checkSessionProgress, renderSessionWrapUp,
 *          loadNextStudyItem, flipCard, submitReview, executeFirstTouchWarmupLoop,
 *          killWarmupTimer, bindSessionShortcuts
 * Works With: AppEngine.state, api.js (reviewCard), DOM (card-viewport, rating controls)
 * Notes: Space/F flips. 1-4 rates. Blitz mode auto-flips on interval. Warmup progress bar.
 */
 
 
const FlashcardEngine = {
  // Shortcut access helper to AppEngine's global state matrix
  get state() {
    return AppEngine.state;
  },

  prepareSessionQueue: function(rawCardsArray) {
    let targetStack = rawCardsArray.map(c => ({
      ...c,
      weight: c.weight !== undefined ? parseInt(c.weight) : 10
    }));

    if (this.state.shuffleEngineMode === 'random') {
      for (let i = targetStack.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [targetStack[i], targetStack[j]] = [targetStack[j], targetStack[i]];
      }
    } else {
      targetStack.sort((a, b) => b.weight - a.weight);
    }
    return targetStack;
  },

  checkSessionProgress: function() {
    if (this.state.currentSessionIndex >= this.state.studyQueue.length) {
      this.renderSessionWrapUp();
    } else {
      this.loadNextStudyItem();
    }
  },

  renderSessionWrapUp: function() {
    const indicator = document.getElementById('study-progress-indicator');
    if (indicator) indicator.textContent = "Remaining: 0";
    
    const overlay = document.getElementById('session-complete-overlay');
    const controls = document.getElementById('study-rating-controls');
    
    if (controls) controls.classList.add('hidden');
    if (overlay) overlay.classList.remove('hidden');
  },

  loadNextStudyItem: function() {
    const currentCard = this.state.studyQueue[this.state.currentSessionIndex];
    
    const totalRemaining = this.state.studyQueue.length - this.state.currentSessionIndex;
    const indicator = document.getElementById('study-progress-indicator');
    if (indicator) {
      indicator.textContent = `Remaining: ${totalRemaining >= 0 ? totalRemaining : 0}`;
    }
	
	const divider = document.getElementById('card-display-divider');
if (divider) divider.classList.add('hidden-opacity');

    if (!currentCard) return;

    const frontFace = document.getElementById('card-display-front');
    const backFace = document.getElementById('card-display-back');
    
    // Set the new front question text node
    if (frontFace) frontFace.textContent = currentCard.front || '';
    
    // Hard protective wipe: Do not write the answer string text into the text container yet
    if (backFace) {
      backFace.textContent = ''; 
      backFace.classList.add('hidden-opacity');
    }
  },
  
flipCard: function() {
    const cardViewport = document.getElementById('card-viewport');
    
    if (cardViewport && cardViewport.classList.contains('card-animate-out')) return;

    this.state.isCardFlipped = !this.state.isCardFlipped;
    
    const cardBack = document.getElementById('card-display-back');
    const divider = document.getElementById('card-display-divider');
    const controls = document.getElementById('study-rating-controls');

    if (this.state.isCardFlipped) {
      const currentCard = this.state.studyQueue[this.state.currentSessionIndex];
      if (cardBack && currentCard) {
        cardBack.textContent = currentCard.back || '';
      }
      if (cardBack) {
        cardBack.classList.remove('hidden-opacity');
        cardBack.style.opacity = '1';
      }
      if (divider) divider.classList.remove('hidden-opacity');
      if (controls) controls.classList.remove('hidden');
    } else {
      if (cardBack) {
        cardBack.classList.add('hidden-opacity');
        cardBack.textContent = ''; 
      }
      if (divider) divider.classList.add('hidden-opacity');
      if (controls) controls.classList.add('hidden');
    }
  },


  
  submitReview: async function(scoreSelectionId) {
    if (!this.state.studyQueue || this.state.studyQueue.length === 0) {
      this.checkSessionProgress();
      return;
    }

    const currentCard = this.state.studyQueue[this.state.currentSessionIndex];
    if (!currentCard) {
      this.checkSessionProgress();
      return;
    }

    const remainingCardsInQueue = this.state.studyQueue.length - (this.state.currentSessionIndex + 1);
    const cardViewport = document.getElementById('card-viewport');

    // 1. Trigger exit slide-out animation
    if (cardViewport) {
      cardViewport.classList.remove('card-animate-in');
      cardViewport.classList.add('card-animate-out');
    }

    // Wipe old answer immediately 
    const cardBack = document.getElementById('card-display-back');
    if (cardBack) {
      cardBack.classList.add('hidden-opacity');
      cardBack.textContent = ''; 
    }

    this.state.isCardFlipped = false;
    const controls = document.getElementById('study-rating-controls');
    if (controls) controls.classList.add('hidden');

    // Wait 120ms for slide-out to finish, then mount content
    setTimeout(async () => {
      try {
        if (scoreSelectionId === 1) {
          const insertOffset = Math.max(1, Math.round(remainingCardsInQueue * 0.50));
          this.state.studyQueue.splice(this.state.currentSessionIndex + 1 + insertOffset, 0, { ...currentCard });
          if (window.api && typeof api.reviewCard === 'function') api.reviewCard(currentCard.id, 1);
        } else if (scoreSelectionId === 2) {
          const insertOffset = Math.max(1, Math.round(remainingCardsInQueue * 0.90));
          this.state.studyQueue.splice(this.state.currentSessionIndex + 1 + insertOffset, 0, { ...currentCard });
          if (window.api && typeof api.reviewCard === 'function') api.reviewCard(currentCard.id, 2);
        } else if (scoreSelectionId === 3 || scoreSelectionId === 4) {
          if (window.api && typeof api.reviewCard === 'function') api.reviewCard(currentCard.id, scoreSelectionId);
        }
      } catch (apiError) {
        console.error("Database sync error:", apiError);
      }

      // Load new text text contents
      this.state.currentSessionIndex++;
      this.checkSessionProgress();

      // Trigger slide-in animation
      if (cardViewport) {
        cardViewport.classList.remove('card-animate-out');
        cardViewport.classList.add('card-animate-in');
        
        // CLEANUP: Strip the animation classes once completed so flip turns work!
        setTimeout(() => {
          cardViewport.classList.remove('card-animate-in');
        }, 150); // Matches the 150ms CSS animation runtime
      }
    }, 120);
  },

executeFirstTouchWarmupLoop: function() {
    this.state.currentSessionIndex = 0;
    document.getElementById('study-rating-controls').classList.add('hidden');
    
    const bar = document.getElementById('warmup-progress-bar');
    if (bar) bar.classList.remove('hidden');

    // FIX: Read directly from AppEngine state configuration fallback loop instead of dead selector element 
    const tickerIntervalDurationMs = this.state.blitzInterval ? parseInt(this.state.blitzInterval) : 800;

    const runTicker = async () => {
      if (this.state.currentSessionIndex >= this.state.studyQueue.length) {
        if (bar) bar.className = "warmup-bar hidden";
        this.state.currentSessionIndex = 0;
        await AppEngine.showAppDialog("Blitz Complete", "Fast overview cycle finished. Returning to workspace.");
        AppEngine.exitSessionBackToDeck();
        return;
      }

      const currentItem = this.state.studyQueue[this.state.currentSessionIndex];
      document.getElementById('study-progress-indicator').textContent = `Blitz: ${this.state.currentSessionIndex + 1}/${this.state.studyQueue.length}`;
      
      const frontNode = document.getElementById('card-display-front');
      const backNode = document.getElementById('card-display-back');
      
      frontNode.textContent = currentItem.front;
      backNode.textContent = currentItem.back;
      
      frontNode.classList.remove('hidden-opacity');
      backNode.classList.remove('hidden-opacity');

      if (bar) {
        bar.style.animationDuration = `${tickerIntervalDurationMs}ms`;
        bar.classList.remove('warmup-animate');
        void bar.offsetWidth;
        bar.classList.add('warmup-animate');
      }

      this.state.currentSessionIndex++;
      this.state.warmupTimerRef = setTimeout(runTicker, tickerIntervalDurationMs);
    };

    runTicker();
  },
  
  
  killWarmupTimer: function() {
    if (this.state.warmupTimerRef) {
      clearTimeout(this.state.warmupTimerRef);
      this.state.warmupTimerRef = null;
    }
    const bar = document.getElementById('warmup-progress-bar');
    if (bar) bar.className = "warmup-bar hidden";
  },

  // Isolated study shortcut layout bindings execution context
  bindSessionShortcuts: function() {
    document.addEventListener('keydown', (e) => {
      // 1. Guard check against text inputs
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      // 2. Only map parameters if the study workspace is actively displayed
      const studyView = document.getElementById('view-study');
      if (!studyView || studyView.classList.contains('hidden')) return;

      // 3. Stop evaluation if session queue bounds are broken
      if (this.state.studyQueue.length === 0 || this.state.currentSessionIndex >= this.state.studyQueue.length) return;

      // Flip card trigger mapping
      if (e.key === ' ' || e.key.toLowerCase() === 'f') {
        e.preventDefault();
        this.flipCard();
      } 
      // Rating assessment mappings (Strict visibility conditions apply)
      else if (this.state.isCardFlipped && !this.state.isBlitzActiveMode) {
        if (e.key === '1') this.submitReview(1);
        if (e.key === '2') this.submitReview(2);
        if (e.key === '3') this.submitReview(3);
        if (e.key === '4') this.submitReview(4);
      }
    });
  }
};

// Mount session hook listeners automatically
document.addEventListener('DOMContentLoaded', () => FlashcardEngine.bindSessionShortcuts());