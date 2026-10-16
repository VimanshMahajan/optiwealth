# OptiWealth Frontend - React + TypeScript + Vite

A modern, AI-powered portfolio management frontend built with React, TypeScript, and Vite.

## 🚀 Features

### ✅ Completed Features

#### Authentication
- **Login Page** - Secure user authentication with JWT tokens
- **Register Page** - User registration with validation
- **Protected Routes** - Route guards for authenticated-only pages

#### Dashboard
- **Portfolio Overview** - Quick stats and portfolio summary
- **Top Picks Preview** - Shows top 5 AI-recommended stocks
- **Quick Actions** - Fast access to common tasks
- **User Profile** - Display user information

#### Portfolio Management
- **Create Portfolio** - Create new investment portfolios
- **View Portfolios** - List all user portfolios
- **Delete Portfolio** - Remove portfolios with confirmation
- **Portfolio Details** - Detailed view with holdings

#### Holdings Management
- **Add Holdings** - Add stocks to portfolio with symbol, quantity, and cost
- **Edit Holdings** - Update quantity and average cost
- **Delete Holdings** - Remove holdings from portfolio
- **Holdings Table** - Clean tabular display of all holdings

#### Analytics
- **Portfolio Analysis** - Real-time portfolio analytics powered by Python microservice
- **Performance Metrics** - Total value, cost, gain/loss, and percentage returns
- **Holdings Breakdown** - Individual stock performance with current prices
- **AI Insights** - Gemini AI-powered portfolio recommendations and insights
- **Risk Metrics** - Portfolio volatility, Sharpe ratio, and max drawdown

#### Top Picks
- **AI-Powered Recommendations** - Daily updated stock recommendations
- **Confidence Scores** - Visual score indicators with color coding
- **Score Categories** - Excellent (80+), Good (60-79), Moderate (40-59), Low (<40)
- **NSE Stocks** - Focus on Indian National Stock Exchange listings

## 📁 Project Structure

```
frontend-react/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx           # Navigation bar component
│   │   ├── Navbar.css
│   │   └── ProtectedRoute.tsx   # Route protection HOC
│   ├── pages/
│   │   ├── LoginPage.tsx        # Login page
│   │   ├── RegisterPage.tsx     # Registration page
│   │   ├── DashboardPage.tsx    # Main dashboard
│   │   ├── PortfoliosPage.tsx   # Portfolios list
│   │   ├── PortfolioDetailPage.tsx  # Portfolio detail & holdings
│   │   ├── TopPicksPage.tsx     # AI stock recommendations
│   │   └── *.css                # Page-specific styles
│   ├── services/
│   │   ├── api.ts               # Axios instance with interceptors
│   │   ├── authService.ts       # Authentication API calls
│   │   └── portfolioService.ts  # Portfolio/holdings API calls
│   ├── router/
│   │   └── AppRouter.tsx        # Application routing
│   ├── App.tsx                  # Root component
│   └── main.tsx                 # Application entry point
├── .env                         # Environment variables
├── .env.example                 # Environment variables template
└── package.json                 # Dependencies
```

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **CSS3** - Styling with modern gradients and animations

## 🎨 Design Features

- **Dark Theme** - Modern dark UI with gradient accents
- **Glassmorphism** - Frosted glass effect on cards
- **Responsive Design** - Mobile-friendly layouts
- **Smooth Animations** - Hover effects and transitions
- **Color Coding** - Green for gains, red for losses
- **Loading States** - Spinners and loading indicators
- **Empty States** - Friendly messages when no data exists

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- Backend Spring Boot server running on port 8080
- Python microservice running on port 8000

### Installation

1. Install dependencies:
```bash
cd frontend-react
npm install
```

2. Configure environment:
```bash
# Copy .env.example to .env and update if needed
cp .env.example .env
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

## 🔗 API Integration

### Backend Endpoints Used

#### Authentication (Spring Boot - Port 8080)
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

#### Portfolios (Spring Boot - Port 8080)
- `GET /api/portfolios` - Get user's portfolios
- `POST /api/portfolios` - Create new portfolio
- `GET /api/portfolios/:id` - Get portfolio by ID
- `DELETE /api/portfolios/:id` - Delete portfolio

#### Holdings (Spring Boot - Port 8080)
- `GET /api/portfolios/:id/holdings` - Get portfolio holdings
- `POST /api/portfolios/:id/holdings` - Add holding
- `PUT /api/holdings/:id` - Update holding
- `DELETE /api/holdings/:id` - Delete holding

#### Analytics (Spring Boot - Port 8080)
- `GET /api/analytics/:portfolioId/analyze` - Get portfolio analytics

#### Top Picks (Spring Boot - Port 8080)
- `GET /api/top-picks` - Get AI-recommended stocks

### Authentication Flow

1. User logs in → JWT token received
2. Token stored in localStorage
3. Axios interceptor adds token to all requests
4. Protected routes check for token
5. Redirect to login if token missing

## 📊 Features in Detail

### Dashboard
- Displays total portfolios count
- Shows top 5 stock picks with scores
- Quick action buttons for common tasks
- Personalized welcome message

### Portfolio Detail Page
- View all holdings in a portfolio
- Add new holdings with symbol validation
- Edit existing holdings (quantity, avg cost)
- Delete holdings with confirmation
- Real-time portfolio analytics
- AI-powered insights and recommendations
- Color-coded gain/loss indicators

### Top Picks Page
- AI-scored stock recommendations (0-100)
- Visual confidence score bars
- Daily updates from Python microservice
- Score categories with color coding
- Investment disclaimer

## 🎯 Next Steps / Future Enhancements

- [ ] Portfolio comparison tool
- [ ] Historical performance charts
- [ ] Watchlist functionality
- [ ] Price alerts and notifications
- [ ] Export portfolio reports (PDF/CSV)
- [ ] Dark/Light theme toggle
- [ ] Multi-language support
- [ ] Advanced filtering and sorting
- [ ] Portfolio optimization suggestions
- [ ] Social features (share portfolios)

## 🐛 Known Issues

- None at the moment! 🎉

## 📝 Notes

- Stock symbols should be valid NSE symbols (e.g., RELIANCE, TCS, INFY)
- The backend automatically appends ".NS" suffix for NSE stocks
- Portfolio analysis requires at least one holding
- Top picks and the shared symbol catalog are updated daily by the dedicated Python refresh worker

## 🤝 Contributing

This is a standalone frontend system designed to work with the provided Spring Boot backend and Python microservice.

## 📄 License

See LICENSE file in the root directory.

---

Built with ❤️ using React + TypeScript + Vite
