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

    useEffect(() => {
        loadPortfolioData();
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
                        <button
                            className="btn-analyze"
                            onClick={handleAnalyze}
                            disabled={analyzing || holdings.length === 0}
                        >
                            {analyzing ? "Analyzing..." : "📊 Analyze Portfolio"}
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
                                    ₹{analytics.portfolio_metrics.total_value.toFixed(2)}
                                </div>
                            </div>
                            <div className="analytics-card">
                                <div className="analytics-label">Total Cost</div>
                                <div className="analytics-value">
                                    ₹{analytics.portfolio_metrics.total_cost.toFixed(2)}
                                </div>
                            </div>
                            <div className="analytics-card">
                                <div className="analytics-label">Gain/Loss</div>
                                <div
                                    className={`analytics-value ${
                                        analytics.portfolio_metrics.total_gain_loss >= 0
                                            ? "positive"
                                            : "negative"
                                    }`}
                                >
                                    ₹{analytics.portfolio_metrics.total_gain_loss.toFixed(2)}
                                    <span className="analytics-pct">
                                        ({analytics.portfolio_metrics.total_gain_loss_pct.toFixed(2)}%)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* AI Summary */}
                        {analytics.ai_summary && (
                            <div className="ai-summary-section">
                                <h3 className="ai-title">🤖 AI Insights</h3>
                                {analytics.ai_summary.summary && (
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

                        {/* Holdings Details */}
                        {analytics.holdings && analytics.holdings.length > 0 && (
                            <div className="holdings-analytics">
                                <h3 className="subsection-title">Detailed Holdings Analysis</h3>
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
                                            {analytics.holdings.map((holding, idx) => (
                                                <tr key={idx}>
                                                    <td className="symbol-cell">{holding.symbol}</td>
                                                    <td>₹{holding.current_price.toFixed(2)}</td>
                                                    <td>₹{holding.current_value.toFixed(2)}</td>
                                                    <td
                                                        className={
                                                            holding.gain_loss >= 0 ? "positive" : "negative"
                                                        }
                                                    >
                                                        ₹{holding.gain_loss.toFixed(2)}
                                                        <span className="small-pct">
                                                            ({holding.gain_loss_pct.toFixed(2)}%)
                                                        </span>
                                                    </td>
                                                    <td>{(holding.weight * 100).toFixed(2)}%</td>
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

