from flask import Flask, request, jsonify
from portfolio_analytics import analyze_portfolio
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
    Endpoint to analyze a portfolio.
    Expects JSON input in the following format:
    {
        "portfolioId": 2,
        "holdings": [
            {"symbol": "RVNL", "quantity": 15, "avgCost": 200.10},
            {"symbol": "BEL", "quantity": 5, "avgCost": 100.30},
            {"symbol": "IDFC", "quantity": 10, "avgCost": 103.80}
        ]
    }
    """
    try:
        data = request.get_json()
        if not data or "holdings" not in data:
            return jsonify({"error": "Missing or invalid payload"}), 400

        portfolio_id = data.get("portfolioId")
        holdings = data["holdings"]

        result = analyze_portfolio(holdings)
        result["portfolioId"] = portfolio_id

        return jsonify(result), 200

    except Exception as e:
        print(f"Error in /analyze-portfolio: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
