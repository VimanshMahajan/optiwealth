from flask import Flask, request, jsonify
from datetime import datetime
import json

from NLP_layer.gemini import generate_response
from report_generator import generate_portfolio_report

app = Flask(__name__)

@app.route("/")
def home():
    return jsonify({
        "service": "OptiWealth Python Analytics Service",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    })


@app.route("/analyze-portfolio", methods=["POST"])
def analyze_portfolio_route():
    """
    Expects JSON input in the following format:
    {
        "portfolioId": 2,
        "holdings" : [
         {"symbol": "RVNL", "quantity": 32, "avgCost": 357.06},
         {"symbol": "BEL",  "quantity": 20, "avgCost": 271.66},
         {"symbol": "ITC",  "quantity": 10, "avgCost": 380.36}
     ]
    }
    """
    try:
        data = request.get_json()
        if not data or "holdings" not in data:
            return jsonify({"error": "Missing or invalid payload"}), 400

        # Append ".NS" suffix for NSE-listed symbols
        holdings_with_ns = [
            {**h, "symbol": h["symbol"].upper() + ".NS"} for h in data["holdings"]
        ]

        # Generate portfolio analytics
        result = generate_portfolio_report(holdings=holdings_with_ns)

        # Generate AI summary using Gemini
        get_ai_summary = generate_response(result)

        # If generate_response returns a JSON string, convert to dict
        if isinstance(get_ai_summary, str):
            try:
                get_ai_summary = json.loads(get_ai_summary)
            except json.JSONDecodeError:
                print("Warning: AI summary was not valid JSON. Returning raw text.")
                get_ai_summary = {"ai_summary": {"raw_text": get_ai_summary}}

        # Append AI summary to the result
        result["ai_summary"] = get_ai_summary.get("ai_summary", {})

        return jsonify(result), 200

    except Exception as e:
        print(f"Error in /analyze-portfolio: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
