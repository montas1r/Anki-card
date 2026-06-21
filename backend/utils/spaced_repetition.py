"""
SM-2 Spaced Repetition Algorithm.
quality: 0-5 rating of how well the user recalled the card.
  0-2 = wrong (reset), 3 = hard, 4 = good, 5 = easy.
"""
from datetime import datetime, timedelta


def sm2_update(card, quality):
    quality = max(0, min(5, int(quality)))

    if quality < 3:
        # Failed recall -> reset repetitions
        card.repetitions = 0
        card.interval = 1
    else:
        if card.repetitions == 0:
            card.interval = 1
        elif card.repetitions == 1:
            card.interval = 6
        else:
            card.interval = round(card.interval * card.ease_factor)

        card.repetitions += 1

    # Update ease factor
    card.ease_factor = card.ease_factor + (
        0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    )
    if card.ease_factor < 1.3:
        card.ease_factor = 1.3

    card.due_date = datetime.utcnow() + timedelta(days=card.interval)
    return card