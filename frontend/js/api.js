/**
 * File: js/api.js
 * Purpose: Backend API client — all HTTP fetch calls to Flask backend
 * Namespace: window.api
 * Methods: getDecks, createDeck, deleteDeck, getCards, getDueCards, 
 *          createCard, updateCard, reviewCard, deleteCard
 * Works With: Backend Flask API (/api/decks/*, /api/cards/*)
 * Notes: API_BASE = "/api". All methods async/await. Throws on non-ok status.
 */

const API_BASE = "/api";

window.api = {
  // ---- DECKS ----
  getDecks: async function() {
    const res = await fetch(`${API_BASE}/decks/`);
    if (!res.ok) throw new Error("Failed to fetch decks");
    return res.json();
  },

  createDeck: async function(deckData) {
    const res = await fetch(`${API_BASE}/decks/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deckData)
    });
    if (!res.ok) throw new Error("Failed to create deck");
    return res.json();
  },
  
    updateDeck: async function(deckId, deckData) {
    const res = await fetch(`${API_BASE}/decks/${deckId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deckData)
    });
    if (!res.ok) throw new Error("Failed to update deck");
    return res.json();
  },

  deleteDeck: async function(deckId) {
    const res = await fetch(`${API_BASE}/decks/${deckId}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete deck");
    return res.json();
  },

  // ---- CARDS ----
  getCards: async function(deckId) {
    const res = await fetch(`${API_BASE}/cards/deck/${deckId}`);
    if (!res.ok) throw new Error("Failed to fetch cards");
    return res.json();
  },

  getDueCards: async function(deckId) {
    const res = await fetch(`${API_BASE}/cards/deck/${deckId}/study`);
    if (!res.ok) throw new Error("Failed to fetch due cards");
    return res.json();
  },

  createCard: async function(deckId, cardData) {
    const res = await fetch(`${API_BASE}/cards/deck/${deckId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cardData)
    });
    if (!res.ok) throw new Error("Failed to create card");
    return res.json();
  },

  updateCard: async function(cardId, cardData) {
    const res = await fetch(`${API_BASE}/cards/${cardId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cardData)
    });
    if (!res.ok) throw new Error("Failed to update card");
    return res.json();
  },

  reviewCard: async function(cardId, quality) {
    const res = await fetch(`${API_BASE}/cards/${cardId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quality })
    });
    if (!res.ok) throw new Error("Failed to submit review");
    return res.json();
  },

  deleteCard: async function(cardId) {
    const res = await fetch(`${API_BASE}/cards/${cardId}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete card");
    return res.json();
  }
};