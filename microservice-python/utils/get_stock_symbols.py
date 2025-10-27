import pandas as pd

url = "https://www.nseindia.com/api/master-quote"
headers = {"User-Agent": "Mozilla/5.0"}

# Alternate source (more reliable):
csv_url = "https://archives.nseindia.com/content/equities/EQUITY_L.csv"

df = pd.read_csv(csv_url)
symbols = df['SYMBOL'].tolist()

# Save only symbols to a clean CSV
pd.DataFrame(symbols, columns=["SYMBOL"]).to_csv("nse_symbols.csv", index=False)

print(f"Downloaded {len(symbols)} symbols.")
