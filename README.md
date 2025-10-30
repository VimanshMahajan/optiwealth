# OptiWealth: Portfolio Management and Analytics System

OptiWealth is a comprehensive portfolio management and analytics platform designed to empower users with advanced financial insights. The system integrates a Spring Boot backend and a Python-based microservice architecture to deliver robust portfolio tracking, risk diagnostics, forecasting, and optimization capabilities.

## Key Features

### Portfolio Management
- **Multi-Portfolio Support**: Create, update, and manage multiple portfolios with fine-grained access control
- **Holdings Management**: Track individual asset positions with real-time valuation
- **User Authentication**: Secure user registration and authentication using Spring Security with JWT tokens
- **Access Control**: Role-based permissions ensuring data privacy and security

### Risk Analytics
- **Value at Risk (VaR)**: Calculate potential losses at specified confidence levels
- **Conditional Value at Risk (CVaR)**: Assess tail risk beyond VaR thresholds
- **Diversification Analysis**: Evaluate portfolio concentration and diversification scores
- **Risk Metrics Dashboard**: Comprehensive risk assessment across multiple dimensions

### Forecasting Models
- **ARIMA Models**: Time-series forecasting for price trend prediction
- **GARCH Models**: Volatility forecasting using generalized autoregressive conditional heteroskedasticity
- **Monte Carlo Simulations**: Probabilistic modeling for future portfolio value scenarios
- **Trend Analysis**: Identify patterns and predict market movements

### Portfolio Optimization
- **Efficient Frontier**: Generate optimal portfolio allocations across the risk-return spectrum
- **Sharpe Ratio Maximization**: Optimize for maximum risk-adjusted returns
- **Minimum Volatility**: Construct portfolios with the lowest possible risk
- **Custom Constraints**: Support for investment constraints and preferences

### Descriptive Analytics
- **Profit/Loss Tracking**: Real-time and historical P&L calculations
- **Cumulative Returns**: Track performance over time with compound return metrics
- **Performance Attribution**: Analyze contribution of individual holdings to portfolio performance
- **Market Data Integration**: Real-time and historical price data via yFinance

## Technology Stack

### Backend Infrastructure
- **Framework**: Spring Boot 3.5.6 with Java 17
- **Security**: Spring Security with JWT authentication
- **Data Access**: Spring Data JPA with Hibernate ORM
- **Build Tool**: Maven
- **Validation**: Jakarta Validation API

### Python Microservices
- **Framework**: Flask for RESTful API endpoints
- **Data Processing**: NumPy, Pandas for efficient numerical computing
- **Statistical Analysis**: Statsmodels for time-series modeling
- **Volatility Modeling**: ARCH library for GARCH models
- **Market Data**: yFinance for real-time and historical financial data

### Database
- **ORM**: JPA/Hibernate for object-relational mapping
- **Database**: Relational database support (PostgreSQL, MySQL, H2)

### Architecture Design
- **Microservices**: Loosely coupled services for scalability
- **RESTful APIs**: Standard HTTP/REST communication protocol
- **Modular Design**: Separation of concerns for maintainability

## Architecture Overview

OptiWealth employs a modern microservices architecture designed for scalability, maintainability, and performance:

1. **Spring Boot Backend**: Serves as the primary application layer, managing user authentication, portfolio data persistence, and orchestrating microservice calls. Implements RESTful endpoints for client applications.

2. **Python Analytics Microservices**: Handles computationally intensive financial calculations including:
   - Risk diagnostics and metrics computation
   - Time-series forecasting with ARIMA and GARCH models
   - Portfolio optimization algorithms
   - Monte Carlo simulations
   - Report generation and data visualization

3. **Service Integration**: Seamless communication between Spring Boot and Python services via RESTful APIs, enabling efficient data exchange and real-time analytics.

4. **Data Layer**: Persistent storage of user data, portfolios, and holdings using JPA/Hibernate with support for multiple relational database systems.

5. **External Data Sources**: Integration with financial market data providers through yFinance for real-time quotes and historical price information.

## Use Cases

OptiWealth is designed for retail investors, financial analysts, and portfolio managers who need:

- **Data-Driven Investment Decisions**: Leverage quantitative analysis and forecasting models
- **Risk Management**: Understand and manage portfolio risk exposure
- **Portfolio Optimization**: Construct efficient portfolios aligned with investment goals
- **Performance Tracking**: Monitor and analyze investment performance over time
- **Analytical Insights**: Access advanced financial metrics and visualizations

The platform bridges the gap between sophisticated financial analytics and practical portfolio management, making institutional-grade tools accessible to individual investors and small financial advisory firms.

---

## Python Microservices - Detailed File Explanations

The Python microservice layer is the analytical engine of OptiWealth, performing complex financial calculations and providing insights. Below is an in-depth explanation of each major file and the financial concepts they implement.

### 1. **data_fetcher.py** - Market Data Retrieval

**What it does:**
This file is responsible for fetching real-time and historical stock market data from Yahoo Finance (yFinance). Think of it as the "data collector" that gathers all the raw information needed for analysis.

**Key Functions:**

- **`get_current_quote(symbol)`**: Fetches the current trading data for a stock
  - Returns: Current price, previous close, day's high/low, volume, and percentage change
  - Example: For "RVNL.NS", it gets today's price, how much it's up or down, etc.

- **`get_historical_data(symbol, start_date, end_date)`**: Retrieves historical OHLCV data
  - OHLCV = Open, High, Low, Close, Volume (the five key data points for each trading day)
  - Returns: A table with daily prices over the specified period
  - Example: Get all prices from Jan 1, 2023 to Dec 31, 2023

- **`get_fundamentals(symbol)`**: Fetches company fundamentals
  - Returns: Market cap, P/E ratio, dividend yield, EPS, ROE, debt-to-equity, etc.
  - These are the "health metrics" of a company

- **`compute_metrics(historical_df, risk_free_rate)`**: Calculates derived metrics from price data
  - **Daily Return**: Percentage change in price each day
  - **Cumulative Return**: Total return over the entire period
  - **Volatility**: How much the price fluctuates (standard deviation of returns)
  - **Sharpe Ratio**: Risk-adjusted return metric (explained below)

**Financial Concepts Explained:**

- **Volatility**: Measures how wildly a stock price moves. High volatility = risky/unpredictable, low volatility = stable/predictable.
- **Sharpe Ratio**: A score that tells you if the returns you're getting are worth the risk you're taking. Formula: `(Average Return - Risk-Free Rate) / Volatility`. Higher is better. A Sharpe ratio > 1 is considered good.
- **Risk-Free Rate**: The return you'd get from a "safe" investment like government bonds (usually 3-6% annually).

---

### 2. **descriptive_metrics.py** - Portfolio Performance Analysis

**What it does:**
This file analyzes your portfolio's current state, calculating profit/loss, performance metrics, and aggregating data from all your holdings.

**Key Functions:**

- **`analyze_holding(symbol, quantity, avg_cost)`**: Analyzes a single stock holding
  - Calculates: Current value, profit/loss, profit percentage
  - Example: You bought 10 shares of RVNL at ₹350 each. It's now ₹400. This calculates your ₹500 profit (14.3% gain).

- **`analyze_portfolio(holdings)`**: Analyzes your entire portfolio
  - Aggregates all holdings to show total portfolio value, total profit/loss
  - Calculates each holding's weight in your portfolio (what percentage of your total investment)
  - Computes portfolio-level metrics like average volatility and Sharpe ratio

**Financial Concepts Explained:**

- **Profit/Loss (P&L)**: Simple calculation: `(Current Value - Cost) = Profit`. If positive, you're making money. If negative, you're losing money.
- **Profit Percentage**: Your profit as a percentage of what you invested. Formula: `(Profit / Cost) × 100%`
- **Portfolio Weight**: What percentage of your total portfolio each stock represents. Example: If you have ₹100,000 total and ₹25,000 in RVNL, RVNL's weight is 25%.
- **Average Daily Return**: The average percentage your portfolio goes up or down each day.

---

### 3. **forecasting_models.py** - Price and Volatility Prediction

**What it does:**
This file predicts future stock prices and volatility using statistical models and simulations. It's like having a crystal ball (but based on math, not magic).

**Key Functions:**

- **`forecast_arima(series, steps)`**: Predicts future returns using ARIMA
  - ARIMA = AutoRegressive Integrated Moving Average
  - Analyzes past price patterns to predict future trends
  - Returns: Predicted daily returns for the next 30 days (or specified steps)

- **`forecast_garch(series, steps)`**: Predicts future volatility using GARCH
  - GARCH = Generalized AutoRegressive Conditional Heteroskedasticity
  - Predicts how risky the stock will be in the future
  - Returns: Expected volatility levels for coming days

- **`monte_carlo_simulation(current_price, mu, sigma, steps, sims)`**: Simulates thousands of possible price paths
  - Uses geometric Brownian motion (the mathematical model of random price movements)
  - Runs 1000+ simulations to see all possible futures
  - Returns: A range of possible prices (best case, worst case, most likely)

- **`summarize_forecast(symbol, df, steps, sims)`**: Creates a comprehensive forecast summary
  - Combines ARIMA, GARCH, and Monte Carlo results
  - Provides expected return, volatility trend, and price range predictions

**Financial Concepts Explained:**

- **ARIMA Model**: A statistical technique that looks at historical patterns to predict future values. It considers three components:
  - **AR (AutoRegressive)**: Uses past values to predict future ones
  - **I (Integrated)**: Accounts for trends in the data
  - **MA (Moving Average)**: Uses past prediction errors to improve accuracy

- **GARCH Model**: Specifically designed to predict volatility. Key insight: volatility clusters (high volatility periods are followed by high volatility, and vice versa).

- **Monte Carlo Simulation**: A technique where you run thousands of random scenarios based on statistical properties (average return and volatility) to see the range of possible outcomes. Named after the famous casino in Monaco!

- **Geometric Brownian Motion**: The mathematical model that assumes stock prices follow a random walk with drift (trend). It's the foundation of the famous Black-Scholes option pricing model.

---

### 4. **optimization_engine.py** - Portfolio Optimization

**What it does:**
This file finds the "best" way to allocate your money across different stocks to maximize returns while minimizing risk.

**Key Functions:**

- **`calculate_portfolio_metrics(weights, expected_returns, cov_matrix)`**: Calculates portfolio return and risk
  - Weights: How much of your money goes into each stock (e.g., 40% RVNL, 30% BEL, 30% ITC)
  - Returns: Expected portfolio return and volatility based on these weights

- **`simulate_efficient_frontier(forecasts, holdings, simulations)`**: Finds optimal portfolio allocations
  - Runs thousands of random weight combinations
  - Identifies two key portfolios:
    - **Max Sharpe Ratio**: Best risk-adjusted returns
    - **Min Volatility**: Lowest risk portfolio
  - Returns: Recommended stock weights for each strategy

- **`calculate_cvar(forecasts, holdings, confidence)`**: Estimates potential losses in worst-case scenarios
  - CVaR = Conditional Value at Risk
  - Tells you: "In the worst 5% of cases, what's your average loss?"

**Financial Concepts Explained:**

- **Efficient Frontier**: A graph showing all the "optimal" portfolios. Any portfolio on this curve gives you the maximum return for a given level of risk. Portfolios below the curve are inefficient (you can do better).

- **Sharpe Ratio Maximization**: Finding the portfolio with the best return per unit of risk. It's like finding the best "bang for your buck" in terms of risk-adjusted performance.

- **Minimum Volatility Portfolio**: The safest possible portfolio given your stock choices. It minimizes ups and downs but may have lower returns.

- **Portfolio Weights**: The percentage allocation to each asset. Weights must sum to 100% (or 1.0 in decimal form).

- **Covariance Matrix**: A table showing how stocks move together. If two stocks always move in the same direction, they have high positive covariance. If they move oppositely, they have negative covariance (which is good for diversification!).

- **Conditional Value at Risk (CVaR)**: Also called Expected Shortfall. It answers: "If things go really bad (bottom 5% of outcomes), how much will I lose on average?" More useful than VaR because it considers the severity of losses, not just their probability.

---

### 5. **risk_diagnostics.py** - Risk Analysis and Metrics

**What it does:**
This file performs comprehensive risk analysis on your portfolio, identifying potential dangers and measuring how risky your investments are.

**Key Functions:**

- **`compute_max_drawdown(returns_series)`**: Calculates the biggest peak-to-trough decline
  - Answers: "What's the worst loss I would have experienced from the highest point?"
  - Example: If your portfolio went from ₹100,000 to ₹70,000, that's a 30% drawdown

- **`compute_var(returns, confidence)`**: Calculates Value at Risk
  - VaR at 95% confidence answers: "What's the maximum I can lose on a bad day, 95% of the time?"
  - Example: VaR = -2% means you'll lose at most 2% on 95 out of 100 days

- **`compute_cvar(returns, confidence)`**: Calculates Conditional Value at Risk
  - CVaR answers: "When things go really bad (worst 5% of days), what's my average loss?"
  - Always worse than VaR because it focuses on the tail risk

- **`compute_beta(asset_returns, benchmark_returns)`**: Measures systematic risk vs. market
  - Beta = 1: Stock moves with the market
  - Beta > 1: Stock is more volatile than the market (amplifies market moves)
  - Beta < 1: Stock is less volatile than the market (defensive)
  - Beta < 0: Stock moves opposite to the market (rare, good for hedging)

- **`compute_risk_diagnostics(holdings)`**: Comprehensive risk report for entire portfolio
  - Calculates correlation matrix, portfolio volatility, VaR, CVaR, max drawdown
  - Computes beta for each stock vs. benchmark (NIFTY 50 for Indian stocks)
  - Calculates diversification score

**Financial Concepts Explained:**

- **Value at Risk (VaR)**: The maximum loss you can expect at a given confidence level over a specific time period. It's the industry standard for risk measurement. Example: "1-day VaR at 95% confidence = ₹5,000" means you won't lose more than ₹5,000 on 95 out of 100 days.

- **Conditional Value at Risk (CVaR)**: The average loss in the worst-case scenarios (beyond VaR threshold). It's more conservative than VaR and regulators prefer it because it doesn't ignore extreme events.

- **Maximum Drawdown**: The largest percentage drop from peak to trough in your portfolio's history. It shows your worst-case scenario that actually happened. Example: If you had ₹100K that dropped to ₹75K, max drawdown = 25%.

- **Beta**: Measures how much a stock moves relative to the overall market. It's calculated using covariance and variance. Beta is crucial for understanding systematic risk (market risk you can't diversify away).

- **Correlation Matrix**: A table showing how each pair of stocks moves together. Values range from -1 (perfect opposite movement) to +1 (perfect same movement). For good diversification, you want stocks with low or negative correlations.

- **Diversification Score**: A measure of how well-diversified your portfolio is. Calculated from average correlations. Score of 0% = all stocks move together (bad), 100% = all stocks move independently (excellent).

- **Portfolio Volatility**: The overall riskiness of your portfolio. It's not just the average of individual stock volatilities because correlations matter. This is why diversification reduces risk!

- **Systematic Risk**: Risk that affects the entire market (recession, interest rate changes, geopolitical events). Measured by beta. You can't diversify this away.

- **Idiosyncratic Risk**: Risk specific to individual companies (CEO resignation, product recall, earnings miss). You CAN diversify this away by holding multiple stocks.

---

## How These Files Work Together

1. **Data Collection**: `data_fetcher.py` gathers current prices and historical data for all stocks in your portfolio.

2. **Current Analysis**: `descriptive_metrics.py` analyzes your portfolio's current state (profit/loss, performance).

3. **Risk Assessment**: `risk_diagnostics.py` evaluates how risky your portfolio is (VaR, CVaR, beta, correlations).

4. **Future Prediction**: `forecasting_models.py` predicts what might happen to your stocks in the future using statistical models.

5. **Optimization**: `optimization_engine.py` recommends how to reallocate your money to achieve better risk-return tradeoffs.

6. **Orchestration**: `controller.py` coordinates all these services via a Flask API and generates AI-powered summaries using Google's Gemini.

The end result is a comprehensive portfolio analysis that would typically require expensive financial advisors or Bloomberg terminals—now accessible through code!