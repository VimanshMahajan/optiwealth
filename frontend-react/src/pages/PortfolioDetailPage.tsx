import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
    getPortfolioById,
    getHoldings,
    addHolding,
    updateHolding,
    deleteHolding,
    analyzePortfolio,
} from "../services/portfolioService";
import type { Portfolio, Holding, AnalyticsResult } from "../services/portfolioService";
import "./PortfolioDetail.css";

const PortfolioDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const portfolioId = parseInt(id || "0");

    const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingHolding, setEditingHolding] = useState<Holding | null>(null);

    const [formData, setFormData] = useState({
        symbol: "",
        quantity: "",
        avgCost: "",
    });

    // Collapsible sections state
    const [expandedSections, setExpandedSections] = useState({
        aiInsights: true,
        riskMetrics: true,
        forecasts: true,
        optimization: true,
        holdingsAnalysis: true,
    });

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    useEffect(() => {
        loadPortfolioData();
        // Load cached analytics from sessionStorage
        const cachedAnalytics = sessionStorage.getItem(`analytics_${portfolioId}`);
        if (cachedAnalytics) {
            try {
                setAnalytics(JSON.parse(cachedAnalytics));
            } catch (error) {
                console.error("Error loading cached analytics:", error);
            }
        }
    }, [portfolioId]);

    const loadPortfolioData = async () => {
        try {
            setLoading(true);
            const [portfolioData, holdingsData] = await Promise.all([
                getPortfolioById(portfolioId),
                getHoldings(portfolioId),
            ]);
            setPortfolio(portfolioData);
            setHoldings(holdingsData);
        } catch (error) {
            console.error("Error loading portfolio:", error);
            alert("Failed to load portfolio");
            navigate("/portfolios");
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async () => {
        try {
            setAnalyzing(true);
            const result = await analyzePortfolio(portfolioId);
            setAnalytics(result);
            // Cache the analytics result in sessionStorage
            sessionStorage.setItem(`analytics_${portfolioId}`, JSON.stringify(result));
        } catch (error) {
            console.error("Error analyzing portfolio:", error);
            alert("Failed to analyze portfolio. Make sure you have holdings added.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleAddHolding = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addHolding(
                portfolioId,
                formData.symbol,
                parseFloat(formData.quantity),
                parseFloat(formData.avgCost)
            );
            setFormData({ symbol: "", quantity: "", avgCost: "" });
            setShowAddModal(false);
            // Clear cached analytics since holdings changed
            sessionStorage.removeItem(`analytics_${portfolioId}`);
            setAnalytics(null);
            await loadPortfolioData();
        } catch (error) {
            console.error("Error adding holding:", error);
            alert("Failed to add holding. Please check if the symbol is valid.");
        }
    };

    const handleUpdateHolding = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingHolding) return;

        try {
            await updateHolding(
                editingHolding.id,
                parseFloat(formData.quantity),
                parseFloat(formData.avgCost)
            );
            setShowEditModal(false);
            setEditingHolding(null);
            setFormData({ symbol: "", quantity: "", avgCost: "" });
            // Clear cached analytics since holdings changed
            sessionStorage.removeItem(`analytics_${portfolioId}`);
            setAnalytics(null);
            await loadPortfolioData();
        } catch (error) {
            console.error("Error updating holding:", error);
            alert("Failed to update holding");
        }
    };

    const handleDeleteHolding = async (holdingId: number, symbol: string) => {
        if (!confirm(`Delete ${symbol}?`)) return;

        try {
            await deleteHolding(holdingId);
            // Clear cached analytics since holdings changed
            sessionStorage.removeItem(`analytics_${portfolioId}`);
            setAnalytics(null);
            await loadPortfolioData();
        } catch (error) {
            console.error("Error deleting holding:", error);
            alert("Failed to delete holding");
        }
    };

    const openEditModal = (holding: Holding) => {
        setEditingHolding(holding);
        setFormData({
            symbol: holding.symbol,
            quantity: holding.quantity.toString(),
            avgCost: holding.avgCost.toString(),
        });
        setShowEditModal(true);
    };

    if (loading) {
        return (
            <div className="page-container">
                <Navbar />
                <div className="page-content">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>Loading portfolio...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <Navbar />

            <div className="page-content">
                {/* Portfolio Header */}
                <div className="portfolio-detail-header">
                    <button className="back-btn" onClick={() => navigate("/portfolios")}>
                        ← Back
                    </button>
                    <div className="portfolio-detail-title">
                        <div className="portfolio-icon-xl">💼</div>
                        <div>
                            <h1 className="page-title">{portfolio?.name}</h1>
                            <p className="page-subtitle">Portfolio ID: {portfolioId}</p>
                        </div>
                    </div>
                    <div className="portfolio-header-actions">
                        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                            + Add Holding
                        </button>
                        {analytics && (
                            <button
                                className="btn-secondary"
                                onClick={() => {
                                    sessionStorage.removeItem(`analytics_${portfolioId}`);
                                    setAnalytics(null);
                                }}
                                title="Clear cached analysis"
                            >
                                🗑️ Clear Analysis
                            </button>
                        )}
                        <button
                            className="btn-analyze"
                            onClick={handleAnalyze}
                            disabled={analyzing || holdings.length === 0}
                        >
                            {analyzing ? "Analyzing..." : analytics ? "🔄 Re-Analyze Portfolio" : "📊 Analyze Portfolio"}
                        </button>
                    </div>
                </div>

                {/* Holdings Section */}
                <div className="section">
                    <h2 className="section-title">Holdings ({holdings.length})</h2>

                    {holdings.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📈</div>
                            <h3>No holdings yet</h3>
                            <p>Add your first stock holding to start tracking</p>
                            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                                Add Your First Holding
                            </button>
                        </div>
                    ) : (
                        <div className="holdings-table-container">
                            <table className="holdings-table">
                                <thead>
                                    <tr>
                                        <th>Symbol</th>
                                        <th>Quantity</th>
                                        <th>Avg Cost</th>
                                        <th>Total Cost</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {holdings.map((holding) => (
                                        <tr key={holding.id}>
                                            <td className="symbol-cell">{holding.symbol}</td>
                                            <td>{holding.quantity}</td>
                                            <td>₹{holding.avgCost.toFixed(2)}</td>
                                            <td>₹{(holding.quantity * holding.avgCost).toFixed(2)}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-edit-small"
                                                        onClick={() => openEditModal(holding)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn-delete-small"
                                                        onClick={() =>
                                                            handleDeleteHolding(holding.id, holding.symbol)
                                                        }
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Analytics Section */}
                {analytics && (
                    <div className="section">
                        <h2 className="section-title">Portfolio Analytics</h2>

                        {/* Portfolio Metrics */}
                        <div className="analytics-grid">
                            <div className="analytics-card">
                                <div className="analytics-label">Total Value</div>
                                <div className="analytics-value">
                                    ₹{analytics.portfolio?.portfolioValue?.toFixed(2) || '0.00'}
                                </div>
                            </div>
                            <div className="analytics-card">
                                <div className="analytics-label">Total Cost</div>
                                <div className="analytics-value">
                                    ₹{analytics.portfolio?.totalCost?.toFixed(2) || '0.00'}
                                </div>
                            </div>
                            <div className="analytics-card">
                                <div className="analytics-label">Gain/Loss</div>
                                <div
                                    className={`analytics-value ${
                                        (analytics.portfolio?.profit || 0) >= 0
                                            ? "positive"
                                            : "negative"
                                    }`}
                                >
                                    ₹{analytics.portfolio?.profit?.toFixed(2) || '0.00'}
                                    <span className="analytics-pct">
                                        ({analytics.portfolio?.profitPercent?.toFixed(2) || '0.00'}%)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* AI Summary - Enhanced */}
                        {analytics.ai_summary && (
                            <div className="ai-summary-section">
                                <div className="collapsible-header" onClick={() => toggleSection('aiInsights')}>
                                    <h3 className="ai-title">🤖 AI-Powered Insights</h3>
                                    <button className="collapse-btn">
                                        {expandedSections.aiInsights ? '▼' : '▶'}
                                    </button>
                                </div>

                                {expandedSections.aiInsights && (
                                <div className="collapsible-content">

                                {/* Portfolio Summary */}
                                {(analytics.ai_summary as any).portfolioSummary && (
                                    <div className="ai-insight-card">
                                        <h4 className="insight-heading">📊 Portfolio Summary</h4>
                                        <p className="insight-text">{(analytics.ai_summary as any).portfolioSummary}</p>
                                    </div>
                                )}

                                {/* Risk Analysis */}
                                {(analytics.ai_summary as any).riskAnalysis && (
                                    <div className="ai-insight-card">
                                        <h4 className="insight-heading">⚠️ Risk Analysis</h4>
                                        <p className="insight-text">{(analytics.ai_summary as any).riskAnalysis}</p>
                                    </div>
                                )}

                                {/* Forecast Insights */}
                                {(analytics.ai_summary as any).forecastInsights && (
                                    <div className="ai-insight-card">
                                        <h4 className="insight-heading">🔮 Market Forecast</h4>
                                        <p className="insight-text">{(analytics.ai_summary as any).forecastInsights}</p>
                                    </div>
                                )}

                                {/* Optimization Insights */}
                                {(analytics.ai_summary as any).optimizationInsights && (
                                    <div className="ai-insight-card">
                                        <h4 className="insight-heading">⚡ Optimization Recommendations</h4>
                                        <p className="insight-text">{(analytics.ai_summary as any).optimizationInsights}</p>
                                    </div>
                                )}

                                {/* Conclusion */}
                                {(analytics.ai_summary as any).summaryConclusion && (
                                    <div className="ai-insight-card conclusion">
                                        <h4 className="insight-heading">💡 Key Takeaways</h4>
                                        <p className="insight-text">{(analytics.ai_summary as any).summaryConclusion}</p>
                                    </div>
                                )}

                                {/* Legacy support for old format */}
                                {analytics.ai_summary.summary && !(analytics.ai_summary as any).portfolioSummary && (
                                    <div className="ai-summary-box">
                                        <p>{analytics.ai_summary.summary}</p>
                                    </div>
                                )}
                                {analytics.ai_summary.recommendations && analytics.ai_summary.recommendations.length > 0 && (
                                    <div className="ai-recommendations">
                                        <h4>Recommendations:</h4>
                                        <ul>
                                            {analytics.ai_summary.recommendations.map((rec, idx) => (
                                                <li key={idx}>{rec}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                </div>
                                )}
                            </div>
                        )}

                        {/* Risk Metrics Section */}
                        {analytics.riskMetrics && (
                            <div className="section">
                                <div className="collapsible-header" onClick={() => toggleSection('riskMetrics')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <h2 className="section-title" style={{ marginBottom: 0 }}>📉 Risk Metrics</h2>
                                        <span style={{
                                            fontSize: '10px',
                                            color: '#999',
                                            fontWeight: 400
                                        }}>
                                            (1Y historical)
                                        </span>
                                    </div>
                                    <button className="collapse-btn">
                                        {expandedSections.riskMetrics ? '▼' : '▶'}
                                    </button>
                                </div>

                                {expandedSections.riskMetrics && (
                                <div className="collapsible-content">
                                <div className="analytics-grid">
                                    {analytics.riskMetrics.portfolioVolatility !== undefined && (
                                        <div className="analytics-card">
                                            <div className="analytics-label">Portfolio Volatility</div>
                                            <div className="analytics-value">
                                                {(analytics.riskMetrics.portfolioVolatility * 100).toFixed(2)}%
                                            </div>
                                        </div>
                                    )}
                                    {analytics.riskMetrics.valueAtRisk95 !== undefined && (
                                        <div className="analytics-card">
                                            <div className="analytics-label">Value at Risk (95%)</div>
                                            <div className="analytics-value negative">
                                                {(analytics.riskMetrics.valueAtRisk95 * 100).toFixed(2)}%
                                            </div>
                                        </div>
                                    )}
                                    {analytics.riskMetrics.maxDrawdown !== undefined && (
                                        <div className="analytics-card">
                                            <div className="analytics-label">Max Drawdown</div>
                                            <div className="analytics-value negative">
                                                {(analytics.riskMetrics.maxDrawdown * 100).toFixed(2)}%
                                            </div>
                                        </div>
                                    )}
                                    {analytics.riskMetrics.diversificationScore !== undefined && (
                                        <div className="analytics-card">
                                            <div className="analytics-label">Diversification Score</div>
                                            <div className="analytics-value">
                                                {analytics.riskMetrics.diversificationScore.toFixed(2)}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Beta Values */}
                                {analytics.riskMetrics.betas && Object.keys(analytics.riskMetrics.betas).length > 0 && (
                                    <div className="beta-section">
                                        <h3 className="subsection-title">Beta vs Market (NIFTY 50)</h3>
                                        <div className="beta-grid">
                                            {Object.entries(analytics.riskMetrics.betas).map(([symbol, beta]) => (
                                                <div key={symbol} className="beta-card">
                                                    <div className="beta-symbol">{symbol.replace('.NS', '')}</div>
                                                    <div className="beta-value">β = {beta?.toFixed(3) || 'N/A'}</div>
                                                    <div className="beta-label">
                                                        {beta && beta > 1 ? 'More volatile' : beta && beta < 1 ? 'Less volatile' : 'As volatile'} than market
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                </div>
                                )}
                            </div>
                        )}

                        {/* Forecasts Section */}
                        {analytics.forecasts && Object.keys(analytics.forecasts).length > 0 && (
                            <div className="section">
                                <div className="collapsible-header" onClick={() => toggleSection('forecasts')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <h2 className="section-title" style={{ marginBottom: 0 }}>🔮 Market Forecasts</h2>
                                        <span style={{
                                            fontSize: '10px',
                                            color: '#999',
                                            fontWeight: 400
                                        }}>
                                            (30-day outlook)
                                        </span>
                                    </div>
                                    <button className="collapse-btn">
                                        {expandedSections.forecasts ? '▼' : '▶'}
                                    </button>
                                </div>

                                {expandedSections.forecasts && (
                                <div className="collapsible-content">
                                <div className="forecast-grid">
                                    {Object.entries(analytics.forecasts).map(([symbol, forecast]) => (
                                        <div key={symbol} className="forecast-card">
                                            <div className="forecast-header">
                                                <div className="forecast-symbol">{symbol.replace('.NS', '')}</div>
                                                <div className={`forecast-trend ${forecast.trend}`}>
                                                    {forecast.trend === 'up' ? '📈' : forecast.trend === 'down' ? '📉' : '➡️'} {forecast.trend?.toUpperCase()}
                                                </div>
                                            </div>
                                            <div className="forecast-metrics">
                                                <div className="forecast-item">
                                                    <span className="forecast-label">Current:</span>
                                                    <span className="forecast-value">₹{forecast.currentPrice?.toFixed(2)}</span>
                                                </div>
                                                <div className="forecast-item">
                                                    <span className="forecast-label">Expected Return:</span>
                                                    <span className={`forecast-value ${(forecast.expectedReturn || 0) >= 0 ? 'positive' : 'negative'}`}>
                                                        {((forecast.expectedReturn || 0) * 100).toFixed(2)}%
                                                    </span>
                                                </div>
                                                <div className="forecast-item">
                                                    <span className="forecast-label">Volatility:</span>
                                                    <span className="forecast-value">
                                                        {((forecast.volatility || 0) * 100).toFixed(2)}%
                                                    </span>
                                                </div>
                                                {forecast.priceRange && Array.isArray(forecast.priceRange) && (
                                                    <div className="forecast-item">
                                                        <span className="forecast-label">Price Range:</span>
                                                        <span className="forecast-value">
                                                            {forecast.priceRange[0]?.toFixed(2)}% to {forecast.priceRange[1]?.toFixed(2)}%
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{
                                                marginTop: '12px',
                                                paddingTop: '8px',
                                                borderTop: '1px solid #f0f0f0',
                                                fontSize: '10px',
                                                color: '#999',
                                                textAlign: 'center'
                                            }}>
                                                30-day forecast
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                </div>
                                )}
                            </div>
                        )}

                        {/* Optimization Section */}
                        {analytics.optimization && (
                            <div className="section">
                                <div className="collapsible-header" onClick={() => toggleSection('optimization')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <h2 className="section-title" style={{ marginBottom: 0 }}>⚡ Portfolio Optimization</h2>
                                        <span style={{
                                            fontSize: '10px',
                                            color: '#999',
                                            fontWeight: 400
                                        }}>
                                            (based on 1Y data)
                                        </span>
                                    </div>
                                    <button className="collapse-btn">
                                        {expandedSections.optimization ? '▼' : '▶'}
                                    </button>
                                </div>

                                {expandedSections.optimization && (
                                <div className="collapsible-content">

                                <div className="optimization-container">
                                    {/* Max Sharpe */}
                                    {analytics.optimization.maxSharpe && (
                                        <div className="optimization-card">
                                            <h3 className="optimization-heading">📊 Maximum Sharpe Ratio</h3>
                                            <p className="optimization-desc">Best risk-adjusted returns</p>
                                            <div className="weight-bars">
                                                {Object.entries(analytics.optimization.maxSharpe).map(([symbol, weight]) => (
                                                    <div key={symbol} className="weight-bar-container">
                                                        <div className="weight-label">
                                                            <span className="weight-symbol">{symbol.replace('.NS', '')}</span>
                                                            <span className="weight-percent">{((weight as number) * 100).toFixed(2)}%</span>
                                                        </div>
                                                        <div className="weight-bar-bg">
                                                            <div
                                                                className="weight-bar-fill sharpe"
                                                                style={{ width: `${(weight as number) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Min Volatility */}
                                    {analytics.optimization.minVolatility && (
                                        <div className="optimization-card">
                                            <h3 className="optimization-heading">🛡️ Minimum Volatility</h3>
                                            <p className="optimization-desc">Lowest risk portfolio</p>
                                            <div className="weight-bars">
                                                {Object.entries(analytics.optimization.minVolatility).map(([symbol, weight]) => (
                                                    <div key={symbol} className="weight-bar-container">
                                                        <div className="weight-label">
                                                            <span className="weight-symbol">{symbol.replace('.NS', '')}</span>
                                                            <span className="weight-percent">{((weight as number) * 100).toFixed(2)}%</span>
                                                        </div>
                                                        <div className="weight-bar-bg">
                                                            <div
                                                                className="weight-bar-fill minvol"
                                                                style={{ width: `${(weight as number) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* CVaR */}
                                    {analytics.optimization.portfolioCVaR95 !== undefined && (
                                        <div className="optimization-card cvar">
                                            <h3 className="optimization-heading">⚠️ Conditional VaR (95%)</h3>
                                            <p className="optimization-desc">Potential loss in worst 5% scenarios</p>
                                            <div className="cvar-value">
                                                {(analytics.optimization.portfolioCVaR95 * 100).toFixed(2)}%
                                            </div>
                                        </div>
                                    )}
                                </div>
                                </div>
                                )}
                            </div>
                        )}

                        {/* Holdings Details */}
                        {analytics.portfolio?.holdings && analytics.portfolio.holdings.length > 0 && (
                            <div className="holdings-analytics">
                                <div className="collapsible-header" onClick={() => toggleSection('holdingsAnalysis')}>
                                    <h3 className="subsection-title">📈 Detailed Holdings Analysis</h3>
                                    <button className="collapse-btn">
                                        {expandedSections.holdingsAnalysis ? '▼' : '▶'}
                                    </button>
                                </div>

                                {expandedSections.holdingsAnalysis && (
                                <div className="collapsible-content">
                                <div className="holdings-table-container">
                                    <table className="holdings-table">
                                        <thead>
                                            <tr>
                                                <th>Symbol</th>
                                                <th>Current Price</th>
                                                <th>Value</th>
                                                <th>Gain/Loss</th>
                                                <th>Weight</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analytics.portfolio.holdings.map((holding, idx) => (
                                                <tr key={idx}>
                                                    <td className="symbol-cell">{holding.symbol}</td>
                                                    <td>₹{holding.currentPrice?.toFixed(2) || '0.00'}</td>
                                                    <td>₹{holding.currentValue?.toFixed(2) || '0.00'}</td>
                                                    <td
                                                        className={
                                                            (holding.profit || 0) >= 0 ? "positive" : "negative"
                                                        }
                                                    >
                                                        ₹{holding.profit?.toFixed(2) || '0.00'}
                                                        <span className="small-pct">
                                                            ({holding.profitPercent?.toFixed(2) || '0.00'}%)
                                                        </span>
                                                    </td>
                                                    <td>{holding.currentPercent?.toFixed(2) || '0.00'}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add Holding Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Holding</h2>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleAddHolding} className="modal-form">
                            <div className="form-group">
                                <label className="form-label">Stock Symbol</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., RELIANCE, TCS, INFY"
                                    value={formData.symbol}
                                    onChange={(e) =>
                                        setFormData({ ...formData, symbol: e.target.value.toUpperCase() })
                                    }
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Quantity</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    placeholder="Number of shares"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Average Cost (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    placeholder="Cost per share"
                                    value={formData.avgCost}
                                    onChange={(e) => setFormData({ ...formData, avgCost: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowAddModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Add Holding
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Holding Modal */}
            {showEditModal && editingHolding && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Holding: {editingHolding.symbol}</h2>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleUpdateHolding} className="modal-form">
                            <div className="form-group">
                                <label className="form-label">Quantity</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Average Cost (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    value={formData.avgCost}
                                    onChange={(e) => setFormData({ ...formData, avgCost: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowEditModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Update Holding
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PortfolioDetailPage;

