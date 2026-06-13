import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from groq import Groq

# -----------------------
# LOAD ENV FIRST
# -----------------------

load_dotenv()

app = Flask(__name__)

MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """
You are the official AI FAQ assistant for NayePankh Foundation.
Answer clearly and concisely.
"""

# -----------------------
# GET API KEY SAFELY
# -----------------------

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("GROQ_API_KEY not found. Check your .env file.")

client = Groq(api_key=api_key)

# -----------------------
# ROUTES
# -----------------------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        history = data.get("messages", [])

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT}
        ] + history

        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0.7
        )

        reply = response.choices[0].message.content

        return jsonify({"reply": reply})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------
# RUN
# -----------------------

if __name__ == "__main__":
    app.run(debug=True)