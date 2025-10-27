# OptiWealth: Portfolio Management and Analytics System

OptiWealth is a comprehensive portfolio management and analytics platform designed to empower users with advanced financial insights. The system integrates a Spring Boot backend and a Python-based microservice architecture to deliver robust portfolio tracking, risk diagnostics, forecasting, and optimization capabilities.

## Key Features

- **User Management**: Secure user registration and authentication using Spring Security.
- **Portfolio Management**: Create, update, and manage portfolios and holdings with fine-grained access control.
- **Risk Diagnostics**: Analyze portfolio risk metrics, including Value at Risk (VaR), Conditional VaR (CVaR), and diversification scores.
- **Forecasting Models**: Predict future price trends and volatility using ARIMA, GARCH, and Monte Carlo simulations.
- **Optimization Engine**: Generate efficient frontier simulations and optimize portfolio allocations for maximum Sharpe ratio or minimum volatility.
- **Descriptive Analytics**: Compute profit/loss, cumulative returns, and other key metrics for individual holdings and portfolios.
- **Symbol Validation**: Ensure valid stock symbols using a preloaded dataset.
- **Microservice Integration**: Python microservices for analytics, forecasting, and reporting, seamlessly integrated with the Spring Boot backend.

## Technology Stack

- **Backend**: Java, Spring Boot, Spring Security, Maven
- **Microservices**: Python, Flask, NumPy, Pandas, Statsmodels, ARCH, yFinance
- **Database**: JPA/Hibernate (relational database)
- **Frontend**: Not included in the current scope
- **Deployment**: Modular architecture for scalability and maintainability

## Architecture Overview

1. **Spring Boot Backend**: Handles user authentication, portfolio management, and data persistence.
2. **Python Microservices**: Perform computationally intensive tasks such as risk diagnostics, forecasting, and optimization.
3. **Integration**: RESTful APIs for communication between the backend and microservices.
4. **Data Sources**: Real-time and historical market data fetched using yFinance.

## Purpose

OptiWealth aims to provide retail investors and financial analysts with a powerful tool to make data-driven investment decisions. By combining advanced analytics with user-friendly portfolio management, the platform bridges the gap between technology and finance.