import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from database import db
from config import Config
from routes import deck_bp, card_bp

def create_app():
    # Flask maps to the frontend directory relative to this file
    app = Flask(__name__, static_folder="../frontend", static_url_path="")
    
    # Load settings from config.py
    app.config.from_object(Config)
    
    # Setup Extensions
    CORS(app)
    db.init_app(app)
    
    # Register Routing Blueprints
    app.register_blueprint(deck_bp)
    app.register_blueprint(card_bp)
    
    # Single Page App Asset Serving
    @app.route("/")
    def serve_index():
        return send_from_directory(app.static_folder, "index.html")

    @app.route("/<path:path>")
    def serve_static(path):
        if os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, "index.html")

    # Safe Engine Auto-Initialization
    with app.app_context():
        db.create_all()
        
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)