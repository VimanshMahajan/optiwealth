# OptiWealth - Portfolio Optimizer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**OptiWealth** is an intelligent portfolio management system that combines modern backend technologies with advanced AI/ML analytics to provide comprehensive investment insights and portfolio optimization recommendations.

## 🌟 Features

### Portfolio Management
- **User Authentication & Authorization**: Secure JWT-based authentication system
- **Portfolio Creation & Management**: Create, view, update, and delete investment portfolios
- **Holdings Tracking**: Add and manage stock holdings with cost basis and quantity tracking
- **Real-time Portfolio Valuation**: Live portfolio value calculation using current market prices

### Advanced Analytics
- **Descriptive Metrics**: Calculate returns, volatility, Sharpe ratio, and cumulative returns for each holding
- **Risk Diagnostics**: 
  - Portfolio volatility and correlation analysis
  - Beta calculations against market benchmark
  - Maximum drawdown analysis
  - Value at Risk (VaR) and Conditional VaR (CVaR) at 95% confidence
  - Diversification score assessment
- **Forecasting Models**:
  - ARIMA (5,1,0) for return predictions
  - GARCH (1,1) for volatility forecasting
  - 30-day forward price range estimates
- **Portfolio Optimization**:
  - Maximum Sharpe ratio portfolio allocation
  - Minimum volatility portfolio allocation
  - Monte Carlo simulation (5000 iterations) for efficient frontier approximation
- **AI-Powered Insights**: Natural language portfolio summaries and actionable recommendations using Google Gemini AI

## 🏗️ Architecture

OptiWealth follows a **microservices architecture** with two main components:

### 1. Backend Service (Spring Boot)
- **Technology**: Spring Boot 3.5.6, Java 17
- **Database**: PostgreSQL
- **Security**: Spring Security with JWT authentication
- **API**: RESTful endpoints for portfolio and holdings management
- **Role**: Handles user authentication, data persistence, and orchestrates analytics requests

### 2. Python Analytics Microservice (Flask)
- **Technology**: Flask, Python
- **Libraries**: 
  - `yfinance` for market data
  - `statsmodels` for ARIMA forecasting
  - `arch` for GARCH volatility modeling
  - `numpy` & `pandas` for numerical computations
  - Google Gemini AI for natural language insights
- **Role**: Performs complex financial analytics, forecasting, and optimization

### Communication Flow
```
Client → Spring Boot Backend → Python Analytics Service → AI Models
                ↓                           ↓
         PostgreSQL DB              External APIs (yfinance)
```

## 🛠️ Technology Stack

### Backend (Spring Boot)
- **Framework**: Spring Boot 3.5.6
- **Language**: Java 17
- **Dependencies**:
  - Spring Data JPA (Database ORM)
  - Spring Security (Authentication & Authorization)
  - Spring WebFlux (Reactive HTTP client)
  - PostgreSQL Driver
  - JWT (io.jsonwebtoken:jjwt 0.11.5)
  - Lombok (Code generation)
  - Jakarta Validation API

### Analytics Service (Python)
- **Framework**: Flask
- **Key Libraries**:
  - `yfinance` - Market data fetching
  - `pandas` & `numpy` - Data manipulation
  - `statsmodels` - Time series analysis (ARIMA)
  - `arch` - Volatility modeling (GARCH)
  - Google Generative AI - AI-powered insights
  - `python-dotenv` - Environment management

### Database
- **PostgreSQL**: Relational database for user data, portfolios, and holdings

## 📁 Project Structure

```
optiwealth/
├── backend-springboot/           # Spring Boot backend service
│   ├── src/main/java/com/fin/optiwealth_backend_sb/
│   │   ├── controller/          # REST API endpoints
│   │   │   ├── AuthController.java
│   │   │   ├── PortfolioController.java
│   │   │   ├── HoldingController.java
│   │   │   ├── AnalyticsController.java
│   │   │   └── HealthCheck.java
│   │   ├── entity/              # JPA entities
│   │   │   ├── AppUser.java
│   │   │   ├── Portfolio.java
│   │   │   └── Holding.java
│   │   ├── service/             # Business logic
│   │   │   ├── AppUserService.java
│   │   │   ├── PortfolioService.java
│   │   │   ├── HoldingService.java
│   │   │   └── AnalyticsService.java
│   │   ├── repository/          # Data access layer
│   │   │   ├── AppUserRepository.java
│   │   │   ├── PortfolioRepository.java
│   │   │   └── HoldingRepository.java
│   │   ├── security/            # Security & JWT
│   │   │   ├── JwtService.java
│   │   │   ├── JwtAuthFilter.java
│   │   │   └── AppUserDetailsService.java
│   │   ├── dto/                 # Data transfer objects
│   │   └── exception/           # Global exception handling
│   └── pom.xml                  # Maven dependencies
│
├── microservice-python/         # Python analytics service
│   ├── controller.py            # Flask REST endpoints
│   ├── data_fetcher.py          # Market data retrieval
│   ├── descriptive_metrics.py   # Basic portfolio metrics
│   ├── risk_diagnostics.py      # Risk analysis & VaR/CVaR
│   ├── forecasting_models.py    # ARIMA & GARCH models
│   ├── optimization_engine.py   # Portfolio optimization
│   ├── report_generator.py      # Comprehensive report builder
│   ├── NLP_layer/
│   │   └── gemini.py           # AI-powered insights
│   └── utils/
│       ├── finance_prompt.txt  # AI prompt template
│       └── get_stock_symbols.py
│
├── LICENSE                      # MIT License
└── README.md                    # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and receive JWT token

### Portfolio Management
- `POST /api/portfolios` - Create a new portfolio
- `GET /api/portfolios` - Get all portfolios for authenticated user
- `GET /api/portfolios/{id}` - Get specific portfolio by ID
- `DELETE /api/portfolios/{id}` - Delete a portfolio

### Holdings Management
- `POST /api/portfolios/{portfolioId}/holdings` - Add a holding to portfolio
- `GET /api/portfolios/{portfolioId}/holdings` - Get all holdings in portfolio
- `PUT /api/holdings/{holdingId}` - Update a holding
- `DELETE /api/holdings/{holdingId}` - Delete a holding

### Analytics
- `GET /api/analytics/{portfolioId}/analyze` - Get comprehensive portfolio analysis

### Python Microservice
- `GET /` - Health check
- `POST /analyze-portfolio` - Analyze portfolio (called internally by backend)

## 🚀 Getting Started

### Prerequisites
- Java 17 or higher
- Maven 3.6+
- Python 3.8+
- PostgreSQL 12+
- Google Gemini API key

### Backend Setup (Spring Boot)

1. **Configure Database**
   - Create a PostgreSQL database
   - Create `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/optiwealth
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   spring.jpa.hibernate.ddl-auto=update
   spring.jpa.show-sql=true
   jwt.secret=your_jwt_secret_key
   ```

2. **Build and Run**
   ```bash
   cd backend-springboot
   ./mvnw clean install
   ./mvnw spring-boot:run
   ```
   Backend will start on `http://localhost:8080`

### Python Microservice Setup

1. **Install Dependencies**
   ```bash
   cd microservice-python
   pip install flask yfinance pandas numpy statsmodels arch google-generativeai python-dotenv
   ```

2. **Configure Environment**
   - Create a `.env` file:
   ```
   GOOGLE_API_KEY=your_gemini_api_key
   ```

3. **Run the Service**
   ```bash
   python controller.py
   ```
   Service will start on `http://localhost:8000`

### Usage Flow

1. **Register/Login**: Create an account and obtain a JWT token
2. **Create Portfolio**: Create a portfolio with a name
3. **Add Holdings**: Add stock holdings with symbols (e.g., "RVNL", "BEL", "ITC" for NSE stocks)
4. **Analyze**: Request portfolio analysis to get:
   - Current valuation and P&L
   - Risk metrics (volatility, VaR, CVaR, betas)
   - 30-day forecasts (ARIMA + GARCH)
   - Optimized allocations (max Sharpe, min volatility)
   - AI-generated actionable insights

## 📊 Analytics Output

The analytics engine provides a comprehensive JSON report including:

### Portfolio Metrics
- Total value, cost basis, profit/loss
- Individual holding performance
- Portfolio-level Sharpe ratio

### Risk Analysis
- Portfolio volatility
- Maximum drawdown
- Value at Risk (VaR) & Conditional VaR (CVaR) at 95%
- Beta coefficients vs benchmark
- Correlation matrix
- Diversification score (0-100)

### Forecasts
For each holding:
- Expected return (next 30 days)
- Volatility forecast
- Price range estimates
- Trend direction (up/down/neutral)

### Optimization
- **Max Sharpe Portfolio**: Optimal weights for best risk-adjusted returns
- **Min Volatility Portfolio**: Optimal weights for lowest risk
- Portfolio CVaR under optimized allocations

### AI Insights
Natural language summary with:
- Portfolio overview and key contributors
- Risk assessment and actionable recommendations
- Optimization suggestions with specific rebalancing steps
- Forecast interpretation and positioning ideas

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Encryption**: Spring Security password encoding
- **Authorization**: User-specific portfolio access control
- **Input Validation**: Jakarta Validation API
- **Global Exception Handling**: Centralized error management

## 🎯 Current Development Stage

### ✅ Completed Features
- User authentication and authorization system
- Portfolio and holdings CRUD operations
- Real-time market data integration
- Descriptive portfolio metrics
- Advanced risk diagnostics (VaR, CVaR, Beta, Correlation)
- Time series forecasting (ARIMA + GARCH)
- Portfolio optimization (Monte Carlo simulation)
- AI-powered natural language insights
- Microservices architecture with REST APIs

### 🚧 Future Enhancements
- Frontend web application (React/Angular)
- Real-time WebSocket updates
- Additional asset classes (bonds, commodities, crypto)
- Backtesting framework
- Multi-currency support
- Social features (portfolio sharing, leaderboards)
- Mobile application
- Advanced charting and visualization
- Tax optimization strategies

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Vimansh Mahajan**

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

**Note**: This project uses real market data and should be used for educational and informational purposes only. Always consult with a qualified financial advisor before making investment decisions.
