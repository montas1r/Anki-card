from datetime import datetime
from database import db


class Deck(db.Model):
    __tablename__ = "decks"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.String(255), default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship: deleting a deck deletes its cards
    cards = db.relationship(
        "Card", backref="deck", cascade="all, delete-orphan", lazy=True
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "created_at": self.created_at.isoformat(),
            "total_cards": len(self.cards),
            "due_cards": len([c for c in self.cards if c.is_due()]),
        }