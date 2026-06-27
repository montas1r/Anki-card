from datetime import datetime
from database import db

class Card(db.Model):
    __tablename__ = "cards"
    id = db.Column(db.Integer, primary_key=True)
    deck_id = db.Column(db.Integer, db.ForeignKey("decks.id"), nullable=False)
    front = db.Column(db.Text, nullable=False)
    back = db.Column(db.Text, nullable=False)
    ease_factor = db.Column(db.Float, default=2.5)
    interval = db.Column(db.Integer, default=0)
    repetitions = db.Column(db.Integer, default=0)
    due_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    isFavorite = db.Column(db.Boolean, default=False)
    weight = db.Column(db.Integer, default=10)

    def is_due(self):
        return self.due_date <= datetime.utcnow()

    def to_dict(self):
        return {
            "id": self.id,
            "deck_id": self.deck_id,
            "front": self.front,
            "back": self.back,
            "ease_factor": self.ease_factor,
            "interval": self.interval,
            "repetitions": self.repetitions,
            "due_date": self.due_date.isoformat(),
            "created_at": self.created_at.isoformat(),
            "is_due": self.is_due(),
            "isFavorite": self.isFavorite,
            "weight": self.weight,
        }