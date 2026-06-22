from flask import Blueprint, request, jsonify
from database import db
from models import Card, Deck
from utils.spaced_repetition import sm2_update

card_bp = Blueprint("card_bp", __name__, url_prefix="/api/cards")

@card_bp.route("/deck/<int:deck_id>", methods=["GET"])
def get_cards(deck_id):
    Deck.query.get_or_404(deck_id)
    cards = Card.query.filter_by(deck_id=deck_id).all()
    return jsonify([c.to_dict() for c in cards])

@card_bp.route("/deck/<int:deck_id>/study", methods=["GET"])
def get_due_cards(deck_id):
    Deck.query.get_or_404(deck_id)
    # Order cards by due date ascending so you study the oldest due items first
    cards = Card.query.filter_by(deck_id=deck_id).order_by(Card.due_date.asc()).all()
    due = [c.to_dict() for c in cards if c.is_due()]
    return jsonify(due)

@card_bp.route("/deck/<int:deck_id>", methods=["POST"])
def create_card(deck_id):
    Deck.query.get_or_404(deck_id)
    data = request.get_json() or {}
    if not data.get("front") or not data.get("back"):
        return jsonify({"error": "Front and back are required"}), 400

    card = Card(deck_id=deck_id, front=data["front"], back=data["back"])
    db.session.add(card)
    db.session.commit()
    return jsonify(card.to_dict()), 201

@card_bp.route("/<int:card_id>", methods=["PUT"])
def update_card(card_id):
    card = Card.query.get_or_404(card_id)
    data = request.get_json() or {}
    
    # Strict key checks to support flexible fallback values
    card.front = data.get("front", card.front)
    card.back = data.get("back", card.back)
    
    db.session.commit()
    return jsonify(card.to_dict())

@card_bp.route("/<int:card_id>/review", methods=["POST"])
def review_card(card_id):
    card = Card.query.get_or_404(card_id)
    data = request.get_json() or {}
    quality = data.get("quality", 3)
    sm2_update(card, quality)
    db.session.commit()
    return jsonify(card.to_dict())

@card_bp.route("/<int:card_id>", methods=["DELETE"])
def delete_card(card_id):
    card = Card.query.get_or_404(card_id)
    db.session.delete(card)
    db.session.commit()
    return jsonify({"message": "Card deleted"})