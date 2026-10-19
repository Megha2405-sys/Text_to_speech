"""Vox web app entry point for local use and Vercel."""

from __future__ import annotations

from io import BytesIO

from pathlib import Path

from flask import Flask, jsonify, render_template, request, send_file, send_from_directory
from gtts import gTTS

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 64 * 1024
PUBLIC_DIR = Path(__file__).resolve().parent / "public"

LANGUAGES = {
    "en": "English (US)",
    "en-uk": "English (UK)",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese (Brazil)",
    "hi": "Hindi",
    "ja": "Japanese",
    "ko": "Korean",
    "zh-CN": "Chinese (Mandarin)",
    "ar": "Arabic",
    "ru": "Russian",
    "nl": "Dutch",
    "ta": "Tamil",
}
MAX_TEXT_LENGTH = 5000


@app.get("/")
def home():
    return render_template("index.html", languages=LANGUAGES)


@app.get("/style.css")
def stylesheet():
    return send_from_directory(PUBLIC_DIR, "style.css", mimetype="text/css")


@app.get("/app.js")
def javascript():
    return send_from_directory(PUBLIC_DIR, "app.js", mimetype="text/javascript")


@app.post("/api/speech")
def speech():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify(error="Send text and voice settings as JSON."), 400

    text = payload.get("text")
    language = payload.get("language", "en")
    slow = payload.get("slow", False)
    if not isinstance(text, str) or not text.strip():
        return jsonify(error="Enter some text first."), 400
    if len(text) > MAX_TEXT_LENGTH:
        return jsonify(error=f"Please keep the text under {MAX_TEXT_LENGTH:,} characters."), 400
    if not isinstance(language, str) or language not in LANGUAGES:
        return jsonify(error="Choose a supported language."), 400
    if not isinstance(slow, bool):
        return jsonify(error="The slow speech setting must be true or false."), 400

    audio = BytesIO()
    try:
        gTTS(text=text.strip(), lang=language, slow=slow).write_to_fp(audio)
    except Exception:
        app.logger.exception("Speech generation failed")
        return jsonify(error="Speech generation failed. Check the connection and try again."), 502

    audio.seek(0)
    return send_file(audio, mimetype="audio/mpeg", as_attachment=False, download_name="vox-speech.mp3")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
