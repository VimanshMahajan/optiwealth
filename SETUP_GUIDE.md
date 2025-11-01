# 🚀 OptiWealth - Quick Setup Guide

This guide will help you get the OptiWealth frontend up and running.

## ✅ What's Already Built

### Pages & Features
1. **Authentication** ✅
   - Login page with JWT authentication
   - Register page with form validation
   - Protected routes for authenticated users

2. **Dashboard** ✅
   - Portfolio overview with stats
   - Top picks preview (top 5 stocks)
   - Quick action buttons
   - Welcome message with user name

3. **Portfolios Management** ✅
   - Create new portfolios
   - View all portfolios in a grid
   - Delete portfolios with confirmation
   - Navigate to portfolio details

4. **Portfolio Details** ✅
   - View all holdings in a table
   - Add new holdings (symbol, quantity, avg cost)
   - Edit existing holdings
   - Delete holdings
   - Analyze portfolio button
   - Display analytics results with AI insights

5. **Top Picks** ✅
   - AI-powered stock recommendations
   - Confidence scores with visual indicators
   - Color-coded performance ratings
   - Daily updated picks

### Components
- **Navbar** - Navigation with user profile and logout
- **ProtectedRoute** - HOC for route protection

### Services
- **authService** - Login, register APIs
- **portfolioService** - All portfolio/holdings/analytics APIs
- **api** - Axios instance with JWT interceptor

## 🛠️ Setup Steps

### 1. Install Dependencies

```bash
cd frontend-react
npm install
```

### 2. Configure Environment

The `.env` file is already created with:
```
VITE_API_URL=http://localhost:8080
```

Update this if your backend runs on a different port.

### 3. Start the Development Server

```bash
npm run dev
```

The app will run at `http://localhost:5173`

### 4. Ensure Backend Services are Running

#### Spring Boot Backend (Port 8080)
```bash
cd backend-springboot
mvnw spring-boot:run
# OR
./mvnw spring-boot:run  # On Linux/Mac
```

#### Python Microservice (Port 8000)
```bash
cd microservice-python
python controller.py
```

## 📱 User Flow

### First Time User
1. Visit `http://localhost:5173`
2. Redirected to `/login`
3. Click "Create Account" → `/register`
4. Fill in username, email, password
5. Submit → Redirected to `/login`
6. Login with credentials
7. Redirected to `/dashboard`

### Existing User
1. Visit `http://localhost:5173/login`
2. Enter email and password
3. Click "Sign In"
4. Redirected to `/dashboard`

### Creating Your First Portfolio
1. From dashboard, click "Create Portfolio" or navigate to "Portfolios"
2. Click "+ Create Portfolio" button
3. Enter portfolio name (e.g., "Tech Stocks", "Retirement Fund")
4. Click "Create Portfolio"
5. Portfolio appears in the list

### Adding Holdings to Portfolio
1. Click on a portfolio to open details
2. Click "+ Add Holding" button
3. Enter:
   - Stock Symbol (e.g., RELIANCE, TCS, INFY)
   - Quantity (number of shares)
   - Average Cost (₹ per share)
4. Click "Add Holding"
5. Holding appears in the table

### Analyzing Portfolio
1. Open portfolio details page
2. Ensure you have at least one holding
3. Click "📊 Analyze Portfolio" button
4. Wait for analysis to complete (calls Python microservice)
5. View results:
   - Portfolio metrics (value, cost, gain/loss)
   - AI insights and recommendations
   - Detailed holdings analysis with current prices

### Viewing Top Picks
1. Click "Top Picks" in the navbar
2. View AI-recommended stocks with confidence scores
3. Scores are color-coded:
   - Green (80+): Excellent
   - Blue (60-79): Good
   - Yellow (40-59): Moderate
   - Red (<40): Low

## 🎨 UI/UX Highlights

### Design
- **Dark theme** with purple/blue gradients
- **Glassmorphism** effects on cards
- **Smooth animations** on hover
- **Color-coded** gain/loss indicators
- **Responsive** design for mobile/tablet/desktop

### Navigation
- **Navbar** always visible at top
- Quick links to Dashboard, Portfolios, Top Picks
- User profile and logout in navbar

### States
- **Loading states** with spinners
- **Empty states** with helpful messages
- **Error handling** with alerts
- **Confirmation dialogs** for destructive actions

## 🔧 Troubleshooting

### "Failed to load portfolios"
- Check if Spring Boot backend is running on port 8080
- Check if you're logged in (token in localStorage)
- Open browser console for detailed error messages

### "Failed to analyze portfolio"
- Ensure Python microservice is running on port 8000
- Make sure portfolio has at least one holding
- Check that stock symbols are valid NSE symbols

### "Login failed"
- Verify credentials are correct
- Check if backend database is accessible
- Ensure Spring Boot app is running

### Stock symbol not found
- Use valid NSE symbols (e.g., RELIANCE, TCS, INFY)
- Don't add ".NS" suffix (backend adds it automatically)
- Check `valid_symbols.csv` in backend resources

## 📊 API Endpoints Reference

### Authentication
- `POST /auth/register` - Create new user
- `POST /auth/login` - Login and get JWT token

### Portfolios
- `GET /api/portfolios` - Get all user portfolios
- `POST /api/portfolios` - Create portfolio
- `GET /api/portfolios/{id}` - Get portfolio by ID
- `DELETE /api/portfolios/{id}` - Delete portfolio

### Holdings
- `GET /api/portfolios/{id}/holdings` - Get all holdings
- `POST /api/portfolios/{id}/holdings` - Add holding
- `PUT /api/holdings/{id}` - Update holding
- `DELETE /api/holdings/{id}` - Delete holding

### Analytics
- `GET /api/analytics/{portfolioId}/analyze` - Analyze portfolio
  - Calls Python microservice internally
  - Returns portfolio metrics, AI insights, risk metrics

### Top Picks
- `GET /api/top-picks` - Get AI stock recommendations

## 🎯 What to Test

### Authentication Flow
- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should show error)
- [ ] Logout (clears token, redirects to login)
- [ ] Try accessing protected route without login (should redirect)

### Portfolio Operations
- [ ] Create portfolio
- [ ] View portfolios list
- [ ] Delete portfolio
- [ ] Click portfolio to view details

### Holdings Operations
- [ ] Add holding with valid symbol
- [ ] Add holding with invalid symbol (should show error)
- [ ] Edit holding quantity and cost
- [ ] Delete holding

### Analytics
- [ ] Analyze portfolio with holdings
- [ ] View portfolio metrics
- [ ] View AI insights
- [ ] View detailed holdings analysis

### Top Picks
- [ ] View top picks
- [ ] Refresh top picks
- [ ] Check score indicators and colors

### UI/UX
- [ ] Test on different screen sizes
- [ ] Check all animations work
- [ ] Verify color coding (green/red for gains/losses)
- [ ] Test empty states (no portfolios, no holdings)

## 📝 Sample Test Data

### User Registration
```
Username: testuser
Email: test@example.com
Password: Test123!
```

### Portfolio Names
- "Tech Portfolio"
- "Blue Chip Stocks"
- "Dividend Stocks"
- "Growth Portfolio"

### Sample NSE Holdings
```
Symbol: RELIANCE, Quantity: 10, Avg Cost: 2500
Symbol: TCS, Quantity: 5, Avg Cost: 3400
Symbol: INFY, Quantity: 15, Avg Cost: 1450
Symbol: HDFCBANK, Quantity: 8, Avg Cost: 1600
Symbol: ITC, Quantity: 20, Avg Cost: 380
```

## 🚀 Next Steps

You now have a fully functional portfolio management frontend! Here's what you can do:

1. **Test thoroughly** - Go through all features
2. **Customize styling** - Modify CSS to match your brand
3. **Add features** - Extend with charts, reports, etc.
4. **Deploy** - Build for production and deploy to hosting

## 💡 Tips

- Use the browser's DevTools (F12) to debug
- Check Network tab to see API calls
- Check Console tab for error messages
- localStorage stores the JWT token (key: "token")
- Mock data can be helpful for frontend-only testing

---

**Happy Building! 🎉**

If you have any questions or need modifications, feel free to ask!

