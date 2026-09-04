from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.models import db

def create_app(config_overrides=None):
    app = Flask(__name__)
    app.config.from_object(Config)

    if config_overrides:
        app.config.update(config_overrides)

    db.init_app(app)
    CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

    from app.routes.repository_routes import repository_bp
    app.register_blueprint(repository_bp)

    with app.app_context():
        db.create_all()

    return app