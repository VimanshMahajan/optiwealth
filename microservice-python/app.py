from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import json
import threading
import atexit
from apscheduler.schedulers.background import BackgroundScheduler

from NLP_layer.gemini import generate_response
from report_generator import generate_portfolio_report
from top_picks.top_picks import execute_picks

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://optiwealth-drab.vercel.app",
            "https://optiwealth-backend.onrender.com",
            "http://localhost:8080",
            "http://localhost:8000",
            "http://localhost:5173"
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Global scheduler instance
scheduler = None

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
    import time
    start_time = time.time()

    try:
        print(f"[{datetime.now().isoformat()}] Received analyze-portfolio request")

        data = request.get_json()
        if not data or "holdings" not in data:
            print("Error: Missing or invalid payload")
            return jsonify({"error": "Missing or invalid payload"}), 400

        holdings = data.get("holdings", [])
        if len(holdings) == 0:
            print("Error: No holdings provided")
            return jsonify({"error": "No holdings provided"}), 400

        print(f"Processing {len(holdings)} holdings: {[h.get('symbol') for h in holdings]}")

        # Append ".NS" suffix for NSE-listed symbols
        holdings_with_ns = [
            {**h, "symbol": h["symbol"].upper() + ".NS"} for h in holdings
        ]

        # Generate portfolio analytics with reduced simulations for speed
        # Render free tier has 30s timeout, so we need to be fast
        print("Generating portfolio report...")
        result = generate_portfolio_report(
            holdings=holdings_with_ns,
            steps=30,
            sims=100  # Reduced from 500 to 100 for faster processing
        )

        elapsed = time.time() - start_time
        print(f"Portfolio report generated in {elapsed:.2f}s")

        # Skip AI summary if we're running out of time (>25s)
        if elapsed > 25:
            print(f"WARNING: Already at {elapsed:.2f}s, skipping AI summary to avoid timeout")
            result["ai_summary"] = {
                "note": "AI summary skipped due to processing time constraints"
            }
            return jsonify(result), 200

        # Generate AI summary using Gemini
        try:
            print("Generating AI summary...")
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
        except Exception as e:
            print(f"Error generating AI summary: {e}")
            result["ai_summary"] = {
                "error": "Failed to generate AI summary",
                "details": str(e)
            }

        total_time = time.time() - start_time
        print(f"[{datetime.now().isoformat()}] Request completed in {total_time:.2f}s")

        return jsonify(result), 200

    except Exception as e:
        elapsed = time.time() - start_time
        print(f"[{datetime.now().isoformat()}] Error in /analyze-portfolio after {elapsed:.2f}s: {e}")
        import traceback
        traceback.print_exc()

        error_response = {
            "error": str(e),
            "message": "An error occurred while analyzing the portfolio",
            "processingTime": f"{elapsed:.2f}s"
        }

        # Only include full traceback in development (not in production logs for security)
        if elapsed < 1:  # Quick failure suggests validation/input error
            error_response["type"] = "validation_error"
        elif elapsed > 25:  # Timeout-like failure
            error_response["type"] = "timeout_error"
            error_response["suggestion"] = "The analysis took too long. Try again or reduce the number of holdings."
        else:
            error_response["type"] = "processing_error"

        return jsonify(error_response), 500


# ==== Scheduler Setup ====

def scheduled_job_wrapper():
    """Wrapper for scheduled job with error handling and logging."""
    print(f"[{datetime.now().isoformat()}] Scheduled Top Picks update starting...")
    try:
        execute_picks()
        print(f"[{datetime.now().isoformat()}] Scheduled Top Picks update completed successfully.")
    except Exception as e:
        print(f"[{datetime.now().isoformat()}] ERROR in scheduled Top Picks update: {e}")
        import traceback
        traceback.print_exc()


def start_scheduler():
    """Starts a background scheduler that updates top picks daily."""
    global scheduler

    # Prevent duplicate scheduler in debug mode
    if scheduler is not None:
        print("Scheduler already running, skipping initialization.")
        return

    scheduler = BackgroundScheduler()

    # Run once at startup
    print(f"[{datetime.now().isoformat()}] Initial Top Picks update running...")
    try:
        execute_picks()
        print(f"[{datetime.now().isoformat()}] Initial Top Picks update completed.")
    except Exception as e:
        print(f"[{datetime.now().isoformat()}] Initial execution failed: {e}")
        import traceback
        traceback.print_exc()

    # Schedule daily updates (every 24 hours)
    scheduler.add_job(
        scheduled_job_wrapper,
        'interval',
        hours=24,
        id='daily_top_picks_job',
        replace_existing=True
    )
    scheduler.start()
    print(f"[{datetime.now().isoformat()}] Scheduler started — Top Picks will update every 24 hours.")


def shutdown_scheduler():
    """Shutdown the scheduler gracefully."""
    global scheduler
    if scheduler is not None:
        print(f"[{datetime.now().isoformat()}] Shutting down scheduler...")
        scheduler.shutdown()
        print(f"[{datetime.now().isoformat()}] Scheduler shut down successfully.")


# Register cleanup function
atexit.register(shutdown_scheduler)

if __name__ == "__main__":
    import os
    # Start scheduler safely
    try:
        start_scheduler()
    except Exception as e:
        print(f"Scheduler startup failed: {e}")

    # Run the Flask app
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)
