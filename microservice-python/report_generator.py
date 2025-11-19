# report_generator.py
import json
import logging
from data_fetcher import get_historical_data
from descriptive_metrics import analyze_portfolio
from risk_diagnostics import compute_risk_diagnostics
from forecasting_models import generate_forecasts
from optimization_engine import optimize_portfolio
import pandas as pd

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)


# ---------------------------
# Utility: Convert NumPy types to Python native
# ---------------------------
def convert_numpy(obj):
    if isinstance(obj, dict):
        return {k: convert_numpy(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy(i) for i in obj]
    elif isinstance(obj, (float, int)):
        return obj
    elif hasattr(obj, 'tolist'):
        return obj.tolist()
    else:
        return obj


# ---------------------------
# Sweet Spot: Portfolio Report Generator
# ---------------------------
def generate_portfolio_report(holdings, steps=30, sims=500):
    """
    Generates a compact but informative 'sweet spot' JSON report:
    - Layer A: descriptive metrics
    - Layer B: risk diagnostics (with betas & simplified correlation)
    - Layer C: forecasts (expected return, trend, volatility, price range)
    - Layer D: optimization (max Sharpe, min volatility, CVaR)
    """
    try:
        logger.info(f"Starting portfolio analysis for {len(holdings)} holdings")

        # Layer A: Base portfolio & holdings metrics
        logger.info("Computing descriptive metrics...")
        try:
            descriptive_summary = analyze_portfolio(holdings)
            logger.info("✓ Descriptive metrics computed")
        except Exception as e:
            logger.error(f"Error in descriptive metrics: {e}")
            raise RuntimeError(f"Failed to compute descriptive metrics: {str(e)}")

        # Historical data for forecasting
        logger.info("Fetching historical data...")
        historical_data = {}
        failed_symbols = []
        for h in holdings:
            symbol = h["symbol"]
            try:
                end_date = pd.Timestamp.today().date()
                start_date = end_date - pd.Timedelta(days=365)
                df = get_historical_data(symbol, str(start_date), str(end_date))
                if df is not None and not df.empty:
                    historical_data[symbol] = df
                    logger.debug(f"  ✓ {symbol}: {len(df)} rows")
                else:
                    logger.warning(f"  ✗ {symbol}: No data returned")
                    failed_symbols.append(symbol)
            except Exception as e:
                logger.error(f"  ✗ {symbol}: {e}")
                failed_symbols.append(symbol)

        if not historical_data:
            raise RuntimeError("Failed to fetch historical data for any holdings")

        logger.info(f"✓ Historical data fetched for {len(historical_data)}/{len(holdings)} symbols")
        if failed_symbols:
            logger.warning(f"Failed symbols: {', '.join(failed_symbols)}")

        # Layer C: Forecasting (compact)
        logger.info("Generating forecasts...")
        try:
            # Reduce simulations for speed (500 is too many for free tier)
            forecast_summary = generate_forecasts(holdings, historical_data, steps=steps, sims=min(sims, 200))
            sweet_forecasts = {}
            for sym, f in forecast_summary.items():
                if "error" in f:
                    logger.warning(f"  Forecast error for {sym}: {f['error']}")
                    continue
                try:
                    sweet_forecasts[sym] = {
                        "currentPrice": f.get("currentPrice"),
                        "expectedReturn": f.get("forecast", {}).get("expectedReturn"),
                        "trend": f.get("forecast", {}).get("trendDirection"),
                        "volatility": f.get("forecast", {}).get("volatility", {}).get("average"),
                        "priceRange": f.get("forecast", {}).get("priceRange", {}).get("pctChangeRange")
                    }
                except Exception as e:
                    logger.error(f"  Error extracting forecast for {sym}: {e}")

            logger.info(f"✓ Forecasts generated for {len(sweet_forecasts)} symbols")
        except Exception as e:
            logger.error(f"Error generating forecasts: {e}")
            # Continue without forecasts
            sweet_forecasts = {}
            logger.warning("Continuing without forecasts")

        # Layer B: Risk diagnostics
        logger.info("Computing risk diagnostics...")
        try:
            risk_summary = compute_risk_diagnostics(holdings)
            risk_metrics = risk_summary.get("riskMetrics", {})

            # Simplified correlation matrix (only pairwise)
            corr_matrix = risk_metrics.get("correlationMatrix", {})
            simple_corr = {k: {kk: round(vv, 4) for kk, vv in val.items()} for k, val in corr_matrix.items()}
            logger.info("✓ Risk diagnostics computed")
        except Exception as e:
            logger.error(f"Error computing risk diagnostics: {e}")
            # Use defaults
            risk_metrics = {}
            simple_corr = {}
            logger.warning("Continuing with default risk metrics")

        # Layer D: Optimization
        logger.info("Running optimization...")
        try:
            if forecast_summary:
                optimization_summary = optimize_portfolio(forecast_summary, holdings)
                logger.info("✓ Optimization completed")
            else:
                logger.warning("Skipping optimization (no forecasts)")
                optimization_summary = {
                    "efficientFrontier": {
                        "maxSharpe": {"weights": {}},
                        "minVolatility": {"weights": {}}
                    },
                    "portfolioCVaR95": None
                }
        except Exception as e:
            logger.error(f"Error in optimization: {e}")
            optimization_summary = {
                "efficientFrontier": {
                    "maxSharpe": {"weights": {}},
                    "minVolatility": {"weights": {}}
                },
                "portfolioCVaR95": None
            }
            logger.warning("Continuing with default optimization")

        # Construct sweet spot JSON
        final_report = {
            "portfolio": {
                "portfolioValue": descriptive_summary.get("portfolioValue"),
                "totalCost": descriptive_summary.get("totalCost"),
                "profit": descriptive_summary.get("profit"),
                "profitPercent": descriptive_summary.get("profitPercent"),
                "sharpeRatio": descriptive_summary.get("sharpeRatio"),
                "holdings": descriptive_summary.get("holdings")
            },
            "riskMetrics": {
                "portfolioVolatility": risk_metrics.get("portfolioVolatility"),
                "valueAtRisk95": risk_metrics.get("valueAtRisk95"),
                "conditionalVaR95": risk_metrics.get("conditionalVaR95"),
                "maxDrawdown": risk_metrics.get("maxDrawdown"),
                "diversificationScore": risk_metrics.get("diversificationScore"),
                "betas": risk_metrics.get("betas"),
                "correlationMatrix": simple_corr
            },
            "forecasts": sweet_forecasts,
            "optimization": {
                "maxSharpe": optimization_summary.get("efficientFrontier", {}).get("maxSharpe", {}).get("weights", {}),
                "minVolatility": optimization_summary.get("efficientFrontier", {}).get("minVolatility", {}).get("weights", {}),
                "portfolioCVaR95": optimization_summary.get("portfolioCVaR95")
            }
        }

        logger.info("✓ Portfolio report generated successfully")

        # Ensure JSON-serializable
        return convert_numpy(final_report)

    except Exception as e:
        logger.error(f"CRITICAL ERROR in generate_portfolio_report: {e}", exc_info=True)
        raise


# ---------------------------
# Example Test Run
# ---------------------------
# if __name__ == "__main__":
#     holdings = [
#         {"symbol": "RVNL.NS", "quantity": 32, "avgCost": 357.06},
#         {"symbol": "BEL.NS", "quantity": 20, "avgCost": 271.66},
#         {"symbol": "ITC.NS", "quantity": 10, "avgCost": 380.36},
#     ]
#
#     report = generate_portfolio_report(holdings, steps=30, sims=500)
#     print(json.dumps(report, indent=2))
