import os
from flask import Flask
from flask_cors import CORS
from app.core.config import Config
from app.models import db

def create_app(config_overrides=None):
    app = Flask(__name__)
    app.config.from_object(Config)

    if config_overrides:
        app.config.update(config_overrides)

    Config.DATA_DIR.mkdir(parents=True, exist_ok=True)
    Config.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    Config.TEMP_DIR.mkdir(parents=True, exist_ok=True)

    db.init_app(app)
    CORS(app, resources={r"/*": {"origins": "*"}})

    from app.routes.repository_routes import repository_bp
    app.register_blueprint(repository_bp)

    from app.api.api_v1 import api_v1_bp
    app.register_blueprint(api_v1_bp)

    with app.app_context():
        db.create_all()

    return app