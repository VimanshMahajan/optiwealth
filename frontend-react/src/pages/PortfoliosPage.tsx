import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getUserPortfolios, createPortfolio, deletePortfolio } from "../services/portfolioService";
import type { Portfolio } from "../services/portfolioService";
import "./Portfolios.css";

const PortfoliosPage: React.FC = () => {
    const navigate = useNavigate();
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPortfolioName, setNewPortfolioName] = useState("");
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadPortfolios();
    }, []);

    const loadPortfolios = async () => {
        try {
            setLoading(true);
            const data = await getUserPortfolios();
            setPortfolios(data);
        } catch (error) {
            console.error("Error loading portfolios:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePortfolio = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPortfolioName.trim()) return;

        try {
            setCreating(true);
            await createPortfolio(newPortfolioName);
            setNewPortfolioName("");
            setShowCreateModal(false);
            await loadPortfolios();
        } catch (error) {
            console.error("Error creating portfolio:", error);
            alert("Failed to create portfolio");
        } finally {
            setCreating(false);
        }
    };

    const handleDeletePortfolio = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            await deletePortfolio(id);
            await loadPortfolios();
        } catch (error) {
            console.error("Error deleting portfolio:", error);
            alert("Failed to delete portfolio");
        }
    };

    return (
        <div className="page-container">
            <Navbar />

            <div className="page-content">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Your Portfolios</h1>
                        <p className="page-subtitle">Manage and track your investment portfolios</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                        + Create Portfolio
                    </button>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>Loading portfolios...</p>
                    </div>
                ) : portfolios.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📊</div>
                        <h3>No portfolios yet</h3>
                        <p>Create your first portfolio to start tracking your investments</p>
                        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                            Create Your First Portfolio
                        </button>
                    </div>
                ) : (
                    <div className="portfolios-grid">
                        {portfolios.map((portfolio) => (
                            <div key={portfolio.id} className="portfolio-card-large">
                                <div className="portfolio-card-header">
                                    <div className="portfolio-icon-large">💼</div>
                                    <h3 className="portfolio-name-large">{portfolio.name}</h3>
                                </div>

                                <div className="portfolio-meta">
                                    <span className="meta-item">ID: {portfolio.id}</span>
                                    {portfolio.createdAt && (
                                        <span className="meta-item">
                                            Created: {new Date(portfolio.createdAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>

                                <div className="portfolio-actions">
                                    <button
                                        className="btn-view"
                                        onClick={() => navigate(`/portfolios/${portfolio.id}`)}
                                    >
                                        View Details
                                    </button>
                                    <button
                                        className="btn-delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeletePortfolio(portfolio.id, portfolio.name);
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create New Portfolio</h2>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleCreatePortfolio} className="modal-form">
                            <div className="form-group">
                                <label className="form-label">Portfolio Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., Tech Stocks, Retirement Fund"
                                    value={newPortfolioName}
                                    onChange={(e) => setNewPortfolioName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={creating}>
                                    {creating ? "Creating..." : "Create Portfolio"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PortfoliosPage;

