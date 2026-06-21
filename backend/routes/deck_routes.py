from flask import Blueprint, request, jsonify
from database import db
from models import Deck

deck_bp = Blueprint("deck_bp", __name__, url_prefix="/api/decks")


@deck_bp.route("/", methods=["GET"])
def get_decks():
    decks = Deck.query.order_by(Deck.created_at.desc()).all()
    return jsonify([d.to_dict() for d in decks])


@deck_bp.route("/<int:deck_id>", methods=["GET"])
def get_deck(deck_id):
    deck = Deck.query.get_or_404(deck_id)
    return jsonify(deck.to_dict())


@deck_bp.route("/", methods=["POST"])
def create_deck():
    data = request.get_json() or {}
    if not data.get("name"):
        return jsonify({"error": "Deck name is required"}), 400

    deck = Deck(name=data["name"], description=data.get("description", ""))
    db.session.add(deck)
    db.session.commit()
    return jsonify(deck.to_dict()), 201


@deck_bp.route("/<int:deck_id>", methods=["PUT"])
def update_deck(deck_id):
    deck = Deck.query.get_or_404(deck_id)
    data = request.get_json() or {}
    deck.name = data.get("name", deck.name)
    deck.description = data.get("description", deck.description)
    db.session.commit()
    return jsonify(deck.to_dict())


@deck_bp.route("/<int:deck_id>", methods=["DELETE"])
def delete_deck(deck_id):
    deck = Deck.query.get_or_404(deck_id)
    db.session.delete(deck)
    db.session.commit()
    return jsonify({"message": "Deck deleted"})