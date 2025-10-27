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