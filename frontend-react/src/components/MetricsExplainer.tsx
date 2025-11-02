import React, { useState } from 'react';
import './MetricsExplainer.css';

interface Metric {
    id: string;
    title: string;
    simpleExplanation: string;
    detailedExplanation: string;
    example: string;
    goodRange?: string;
    icon: string;
}

const metrics: Metric[] = [
    {
        id: 'portfolio-volatility',
        title: 'Portfolio Volatility',
        icon: '📊',
        simpleExplanation: 'How much your portfolio\'s value swings up and down',
        detailedExplanation: 'Volatility measures how dramatically your portfolio\'s value changes over time. Think of it like a roller coaster - high volatility means bigger ups and downs, while low volatility means a smoother, steadier ride. It\'s calculated using the standard deviation of returns.',
        example: 'If your portfolio has 2% volatility, it typically moves up or down by about 2% in a given period. A 10% volatility means much bigger swings.',
        goodRange: 'Lower is generally safer (1-5% is low, 5-15% is moderate, 15%+ is high)'
    },
    {
        id: 'value-at-risk',
        title: 'Value at Risk (VaR)',
        icon: '⚠️',
        simpleExplanation: 'The maximum amount you could lose on a bad day',
        detailedExplanation: 'VaR tells you the worst-case loss you might face under normal market conditions. It\'s like weather forecasting - if VaR is -5%, there\'s a small chance (usually 5%) you could lose 5% or more of your portfolio value in a day.',
        example: 'If you have ₹1,00,000 invested and VaR(95%) is -3%, you could lose up to ₹3,000 in the worst 5% of trading days.',
        goodRange: 'Closer to 0% is better (less risk of loss)'
    },
    {
        id: 'conditional-var',
        title: 'Conditional VaR (CVaR)',
        icon: '🔴',
        simpleExplanation: 'How bad things get when they really go wrong',
        detailedExplanation: 'CVaR, also called Expected Shortfall, tells you the average loss when things are really bad - beyond the VaR threshold. If VaR is the door to bad outcomes, CVaR shows you what\'s behind that door. It\'s more realistic than VaR because it accounts for extreme losses.',
        example: 'If your CVaR(95%) is -5%, when you have a bad day (in the worst 5% of cases), you\'ll lose an average of 5%.',
        goodRange: 'Closer to 0% is better, but always worse than VaR'
    },
    {
        id: 'max-drawdown',
        title: 'Maximum Drawdown',
        icon: '📉',
        simpleExplanation: 'The biggest drop from peak to bottom your portfolio has experienced',
        detailedExplanation: 'Max Drawdown shows the largest percentage decline from the highest point to the lowest point in your portfolio\'s history. It\'s like measuring how deep the valley is after climbing a mountain. This tells you how much patience and risk tolerance you need.',
        example: 'If your portfolio grew from ₹1,00,000 to ₹1,50,000, then dropped to ₹1,20,000, the max drawdown is 20% [(150k-120k)/150k].',
        goodRange: 'Lower is better. 10-20% is normal, 20-30% is concerning, 30%+ is very risky'
    },
    {
        id: 'diversification-score',
        title: 'Diversification Score',
        icon: '🎯',
        simpleExplanation: 'How well you\'ve spread your eggs across different baskets',
        detailedExplanation: 'Diversification Score measures how much you\'ve reduced risk by spreading investments across different stocks. A score of 0 means all eggs in one basket, while 100 means perfect diversification. It\'s calculated based on how differently your stocks move relative to each other.',
        example: 'A score of 70 means you\'ve done a good job diversifying - your stocks don\'t all move in the same direction at the same time.',
        goodRange: '50-70 is good diversification, 70+ is excellent, below 30 means too concentrated'
    },
    {
        id: 'beta',
        title: 'Beta (β)',
        icon: '🌊',
        simpleExplanation: 'How much your stock moves compared to the overall market',
        detailedExplanation: 'Beta compares your stock\'s movements to the market (NIFTY 50). A beta of 1 means it moves exactly with the market. Above 1 means it\'s more volatile than the market (amplifies market moves), below 1 means it\'s less volatile (dampens market moves). Negative beta means it moves opposite to the market.',
        example: 'Beta of 1.5: If NIFTY goes up 10%, this stock typically goes up 15%. Beta of 0.5: If NIFTY drops 10%, this stock typically drops only 5%.',
        goodRange: 'Depends on risk appetite. 0.8-1.2 is moderate, 1.2+ is aggressive, below 0.8 is defensive'
    },
    {
        id: 'sharpe-ratio',
        title: 'Sharpe Ratio',
        icon: '⚖️',
        simpleExplanation: 'How much extra return you get for the risk you take',
        detailedExplanation: 'The Sharpe Ratio measures risk-adjusted returns - basically, "bang for your buck" in investing. It compares your returns above the risk-free rate (like a fixed deposit) to the volatility you endured. Higher is better, meaning you got more return for each unit of risk.',
        example: 'Sharpe Ratio of 2 means you earned 2% extra return for every 1% of risk taken. A ratio of 0.5 means you barely got compensated for the risk.',
        goodRange: 'Below 0 is bad, 0-1 is acceptable, 1-2 is good, 2+ is excellent'
    },
    {
        id: 'max-sharpe',
        title: 'Maximum Sharpe Ratio Portfolio',
        icon: '🎖️',
        simpleExplanation: 'The best risk-reward mix for your stocks',
        detailedExplanation: 'This shows you how to redistribute your money among your current stocks to get the best possible risk-adjusted returns. It\'s the "sweet spot" allocation that maximizes your Sharpe Ratio - giving you the best return for the risk you\'re taking.',
        example: 'If you own stocks A, B, and C equally, Max Sharpe might suggest 60% in A, 30% in B, and 10% in C for better risk-adjusted performance.',
        goodRange: 'This is always the optimal allocation for risk-adjusted returns'
    },
    {
        id: 'min-volatility',
        title: 'Minimum Volatility Portfolio',
        icon: '🛡️',
        simpleExplanation: 'The safest way to arrange your current stocks',
        detailedExplanation: 'This shows you how to redistribute your investments to minimize ups and downs (volatility) while still holding all your stocks. It\'s for investors who want the smoothest ride possible and are willing to sacrifice some potential returns for stability.',
        example: 'Instead of equal weights, it might suggest more money in stable stocks and less in volatile ones to reduce overall portfolio swings.',
        goodRange: 'This is always the lowest risk allocation possible with your current stocks'
    },
    {
        id: 'correlation',
        title: 'Correlation Matrix',
        icon: '🔗',
        simpleExplanation: 'How similarly your stocks move together',
        detailedExplanation: 'Correlation measures how much two stocks move in sync. +1 means they always move together, -1 means they move in opposite directions, and 0 means they move independently. Lower correlation between your stocks means better diversification.',
        example: 'If Stock A and B have 0.9 correlation, they move together 90% of the time - not great for diversification. If they have 0.2 correlation, they move mostly independently - much better!',
        goodRange: 'For diversification, aim for correlations below 0.5 between stocks'
    },
    {
        id: 'expected-return',
        title: 'Expected Return',
        icon: '💰',
        simpleExplanation: 'The predicted profit or loss percentage',
        detailedExplanation: 'Based on historical data and forecasting models (ARIMA, GARCH), this estimates the likely percentage change in the stock\'s price over the next 30 days. It\'s not a guarantee, but an educated prediction based on patterns and trends.',
        example: 'An expected return of 2.5% means the model predicts the stock will likely gain 2.5% in the next month. -1.2% means a predicted small loss.',
        goodRange: 'Positive is good, but higher returns usually come with higher risk'
    },
    {
        id: 'forecast-trend',
        title: 'Forecast Trend',
        icon: '🔮',
        simpleExplanation: 'The overall direction the stock is heading',
        detailedExplanation: 'Using AI models and technical analysis, this indicates whether the stock is expected to go UP, DOWN, or move SIDEWAYS in the near future. It combines price momentum, volatility predictions, and market patterns to give an overall directional signal.',
        example: 'An "UP" trend with positive expected return is a bullish signal. A "DOWN" trend suggests caution or potential shorting opportunity.',
        goodRange: 'UP is bullish, DOWN is bearish, SIDEWAYS suggests consolidation'
    }
];

const MetricsExplainer: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

    const filteredMetrics = metrics.filter(metric =>
        metric.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        metric.simpleExplanation.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleMetric = (id: string) => {
        setExpandedMetric(expandedMetric === id ? null : id);
    };

    return (
        <div className="metrics-explainer">
            <div className="explainer-header">
                <div className="explainer-title-section">
                    <h2 className="explainer-title">📚 Metrics Explainer</h2>
                    <p className="explainer-subtitle">
                        Understanding your portfolio analytics in simple terms
                    </p>
                </div>
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search metrics..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            <div className="metrics-list">
                {filteredMetrics.length === 0 ? (
                    <div className="no-results">
                        <p>No metrics found matching "{searchTerm}"</p>
                    </div>
                ) : (
                    filteredMetrics.map((metric) => (
                        <div
                            key={metric.id}
                            className={`metric-card ${expandedMetric === metric.id ? 'expanded' : ''}`}
                        >
                            <div
                                className="metric-header"
                                onClick={() => toggleMetric(metric.id)}
                            >
                                <div className="metric-title-section">
                                    <span className="metric-icon">{metric.icon}</span>
                                    <div>
                                        <h3 className="metric-title">{metric.title}</h3>
                                        <p className="metric-simple">{metric.simpleExplanation}</p>
                                    </div>
                                </div>
                                <button className="expand-btn">
                                    {expandedMetric === metric.id ? '▼' : '▶'}
                                </button>
                            </div>

                            {expandedMetric === metric.id && (
                                <div className="metric-details">
                                    <div className="detail-section">
                                        <h4 className="detail-heading">📖 Detailed Explanation</h4>
                                        <p className="detail-text">{metric.detailedExplanation}</p>
                                    </div>

                                    <div className="detail-section">
                                        <h4 className="detail-heading">💡 Example</h4>
                                        <p className="detail-text example-text">{metric.example}</p>
                                    </div>

                                    {metric.goodRange && (
                                        <div className="detail-section good-range">
                                            <h4 className="detail-heading">✅ What's a Good Value?</h4>
                                            <p className="detail-text range-text">{metric.goodRange}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="explainer-footer">
                <p className="footer-note">
                    💡 <strong>Tip:</strong> These metrics work together to give you a complete picture.
                    Low volatility with high Sharpe Ratio is ideal. High diversification with low correlation is great for risk management.
                </p>
            </div>
        </div>
    );
};

export default MetricsExplainer;

