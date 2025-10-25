from flask import Flask, request, jsonify
from report_generator import generate_portfolio_report
from datetime import datetime

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
         {"symbol": "RVNL.NS", "quantity": 32, "avgCost": 357.06},
         {"symbol": "BEL.NS", "quantity": 20, "avgCost": 271.66},
         {"symbol": "ITC.NS", "quantity": 10, "avgCost": 380.36}
     ]
    }
    """
    try:
        data = request.get_json()
        if not data or "holdings" not in data:
            return jsonify({"error": "Missing or invalid payload"}), 400

        # Append '.NS' to each symbol
        holdings_with_ns = [
            {**h, "symbol": h["symbol"].upper() + ".NS"} for h in data["holdings"]
        ]

        result = generate_portfolio_report(holdings=holdings_with_ns)
        return jsonify(result), 200

    except Exception as e:
        print(f"Error in /analyze-portfolio: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
