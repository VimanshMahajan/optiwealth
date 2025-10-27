import os
import json
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

def clean_response(response: str) -> str:
    """
    Removes markdown code fences like ```json ... ``` from a model's response.
    Returns a clean JSON string starting with { and ending with }.
    """
    if not response:
        return response.strip()

    # Remove leading/trailing whitespace and backticks
    cleaned = response.strip()

    # Remove ```json or ``` at start
    if cleaned.startswith("```json"):
        cleaned = cleaned[len("```json"):].strip()
    elif cleaned.startswith("```"):
        cleaned = cleaned[len("```"):].strip()

    # Remove ending ```
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3].strip()

    return cleaned


def generate_response_helper(prompt):
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt]
        )
        return getattr(response, "text", response.candidates[0].content.parts[0].text).strip()
    except Exception as e:
        return str(e)


def generate_response(attachment):
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    AI_PROMPT_FILE = os.path.join(BASE_DIR, "utils", "finance_prompt.txt")

    with open(AI_PROMPT_FILE, "r", encoding="utf-8") as f:
        PROMPT = f.read().strip()

    PROMPT += "\n\n" + json.dumps(attachment, indent=2)
    response = generate_response_helper(PROMPT)
    response = clean_response(response)
    return response


# if __name__ == '__main__':
#     attachment = {
#     "forecasts": {
#         "BEL.NS": {
#             "currentPrice": 422.05,
#             "expectedReturn": 0.005325,
#             "priceRange": [
#                 -2.18,
#                 2.41
#             ],
#             "trend": "up",
#             "volatility": 0.015651
#         },
#         "ITC.NS": {
#             "currentPrice": 416.8,
#             "expectedReturn": 0.005207,
#             "priceRange": [
#                 -1.09,
#                 1.13
#             ],
#             "trend": "up",
#             "volatility": 0.013534
#         },
#         "RVNL.NS": {
#             "currentPrice": 329.45,
#             "expectedReturn": -0.003136,
#             "priceRange": [
#                 -2.84,
#                 2.79
#             ],
#             "trend": "down",
#             "volatility": 0.019511
#         }
#     },
#     "optimization": {
#         "maxSharpe": {
#             "BEL.NS": 0.423,
#             "ITC.NS": 0.575,
#             "RVNL.NS": 0.002
#         },
#         "minVolatility": {
#             "BEL.NS": 0.333,
#             "ITC.NS": 0.453,
#             "RVNL.NS": 0.214
#         },
#         "portfolioCVaR95": -0.01679
#     },
#     "portfolio": {
#         "holdings": [
#             {
#                 "averageDailyReturn": -0.000689,
#                 "avgCost": 357.06,
#                 "cumulativeReturn": -0.2455,
#                 "currentPercent": 45.5367709944107,
#                 "currentPrice": 329.45,
#                 "currentValue": 10542.4,
#                 "profit": -883.52,
#                 "profitPercent": -7.73,
#                 "quantity": 32,
#                 "sharpeRatio": -0.0328,
#                 "symbol": "RVNL.NS",
#                 "timestamp": "2025-10-27T01:06:03.810910",
#                 "volatility": 0.02831
#             },
#             {
#                 "averageDailyReturn": 0.00203,
#                 "avgCost": 271.66,
#                 "cumulativeReturn": 0.4996,
#                 "currentPercent": 36.459998099466986,
#                 "currentPrice": 422.05,
#                 "currentValue": 8441.0,
#                 "profit": 3007.8,
#                 "profitPercent": 55.36,
#                 "quantity": 20,
#                 "sharpeRatio": 0.0936,
#                 "symbol": "BEL.NS",
#                 "timestamp": "2025-10-27T01:06:05.067754",
#                 "volatility": 0.019148
#             },
#             {
#                 "averageDailyReturn": -0.00041,
#                 "avgCost": 380.36,
#                 "cumulativeReturn": -0.1163,
#                 "currentPercent": 18.003230906122305,
#                 "currentPrice": 416.8,
#                 "currentValue": 4168.0,
#                 "profit": 364.4,
#                 "profitPercent": 9.58,
#                 "quantity": 10,
#                 "sharpeRatio": -0.0587,
#                 "symbol": "ITC.NS",
#                 "timestamp": "2025-10-27T01:06:06.269671",
#                 "volatility": 0.01103
#             }
#         ],
#         "portfolioValue": 23151.4,
#         "profit": 2488.68,
#         "profitPercent": 12.04,
#         "sharpeRatio": 0.0007,
#         "totalCost": 20662.72
#     },
#     "riskMetrics": {
#         "betas": {
#             "BEL.NS": 1.193,
#             "ITC.NS": 0.624,
#             "RVNL.NS": 1.704
#         },
#         "conditionalVaR95": -0.031638,
#         "correlationMatrix": {
#             "BEL.NS": {
#                 "BEL.NS": 1.0,
#                 "ITC.NS": 0.224,
#                 "RVNL.NS": 0.5733
#             },
#             "ITC.NS": {
#                 "BEL.NS": 0.224,
#                 "ITC.NS": 1.0,
#                 "RVNL.NS": 0.2162
#             },
#             "RVNL.NS": {
#                 "BEL.NS": 0.5733,
#                 "ITC.NS": 0.2162,
#                 "RVNL.NS": 1.0
#             }
#         },
#         "diversificationScore": 44.14,
#         "maxDrawdown": -0.21576,
#         "portfolioVolatility": 0.019496,
#         "valueAtRisk95": -0.02239
#     }
# }
#
#     with open("check.txt", "w", encoding="utf-8") as f:
#         f.write(generate_response(attachment))
