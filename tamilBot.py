from flask import Flask, request, jsonify
from huggingface_hub import InferenceClient
import logging
from googletrans import Translator
import time
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  

HUGGING_FACE_TOKEN = "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"  
MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.2"

client = InferenceClient(
    model=MODEL_NAME,
    token=HUGGING_FACE_TOKEN
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

translator = Translator()

default_system_prompt = """
You are a helpful assistant for farmers. Provide clear, structured responses about agriculture, plants, or diseases. Follow these rules:
1. Use headings (**Problem**, **Solution**, **Prevention**,**Chemical Products** (Must list the chemical fertilizers available in market with exact brand name and the name should be in block letters))).
2. Use bullet points (•) for key details.
3. If the query is unrelated to farming, reply: "This question is not relevant."
"""

def translate_with_retry(text, src="ta", dest="en", retries=3):
    """Translate text with retries for reliability."""
    for attempt in range(retries):
        try:
            return translator.translate(text, src=src, dest=dest).text
        except Exception as e:
            logger.error(f"Translation failed (attempt {attempt + 1}): {e}")
            time.sleep(2)
    return text  

def get_ai_response(system_prompt, user_prompt):
    """Generate AI response using Mistral's instruction-following capabilities."""
    user_prompt_en = translate_with_retry(user_prompt, src="ta", dest="en")

    prompt = f"[INST] {system_prompt}\n\n{user_prompt_en} [/INST]"

    try:
        ai_response_en = client.text_generation(
            prompt=prompt,
            max_new_tokens=1000,
            temperature=0.7,
        )


        ai_response_ta = translate_with_retry(ai_response_en, src="en", dest="ta")
        return ai_response_ta
    except Exception as e:
        logger.error(f"AI response generation failed: {e}")
        return "Error: Could not generate a response. Please try again."

@app.route("/chat", methods=["POST"])
def chat():
    """Handle POST requests from the frontend."""
    data = request.json
    user_query = data.get("query", "").strip()

    if not user_query:
        return jsonify({"reply": "⚠️ Error: Please enter a valid query."})

    reply = get_ai_response(default_system_prompt, user_query)
    return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)