import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getUserPortfolios, getTopPicks } from "../services/portfolioService";
import type { Portfolio, TopPick } from "../services/portfolioService";
import "./Dashboard.css";

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [topPicks, setTopPicks] = useState<TopPick[]>([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [portfoliosData, topPicksData] = await Promise.all([
                getUserPortfolios(),
                getTopPicks(),
            ]);
            setPortfolios(portfoliosData);
            setTopPicks(topPicksData);
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <Navbar />

            <div className="dashboard-content">
                {/* Hero Section */}
                <div className="dashboard-hero">
                    <div className="hero-content">
                        <h1 className="hero-title">
                            Welcome back, <span className="hero-name">{user.username || user.email}</span>! 👋
                        </h1>
                        <p className="hero-subtitle">
                            Optimize your wealth with AI-powered portfolio analytics
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>Loading your dashboard...</p>
                    </div>
                ) : (
                    <>
                        {/* Quick Stats */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">💼</div>
                                <div className="stat-content">
                                    <h3 className="stat-value">{portfolios.length}</h3>
                                    <p className="stat-label">Active Portfolios</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">⭐</div>
                                <div className="stat-content">
                                    <h3 className="stat-value">{topPicks.length}</h3>
                                    <p className="stat-label">Top Picks Available</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📈</div>
                                <div className="stat-content">
                                    <h3 className="stat-value">AI</h3>
                                    <p className="stat-label">Powered Analytics</p>
                                </div>
                            </div>
                        </div>

                        {/* Portfolios Section */}
                        <div className="section">
                            <div className="section-header">
                                <h2 className="section-title">Your Portfolios</h2>
                                <button
                                    className="btn-primary"
                                    onClick={() => navigate("/portfolios")}
                                >
                                    View All
                                </button>
                            </div>

                            {portfolios.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📊</div>
                                    <h3>No portfolios yet</h3>
                                    <p>Create your first portfolio to start tracking your investments</p>
                                    <button
                                        className="btn-primary"
                                        onClick={() => navigate("/portfolios")}
                                    >
                                        Create Portfolio
                                    </button>
                                </div>
                            ) : (
                                <div className="portfolio-grid">
                                    {portfolios.slice(0, 3).map((portfolio) => (
                                        <div
                                            key={portfolio.id}
                                            className="portfolio-card"
                                            onClick={() => navigate(`/portfolios/${portfolio.id}`)}
                                        >
                                            <div className="portfolio-icon">💼</div>
                                            <h3 className="portfolio-name">{portfolio.name}</h3>
                                            <p className="portfolio-id">ID: {portfolio.id}</p>
                                            <button className="portfolio-action">
                                                View Details →
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Top Picks Section */}
                        <div className="section">
                            <div className="section-header">
                                <h2 className="section-title">Today's Top Picks</h2>
                                <button
                                    className="btn-secondary"
                                    onClick={() => navigate("/top-picks")}
                                >
                                    View All
                                </button>
                            </div>

                            {topPicks.length === 0 ? (
                                <div className="empty-state-small">
                                    <p>No top picks available at the moment</p>
                                </div>
                            ) : (
                                <div className="top-picks-grid">
                                    {topPicks.slice(0, 5).map((pick) => (
                                        <div key={pick.id} className="top-pick-card">
                                            <div className="pick-symbol">{pick.symbol.replace('.NS', '')}</div>
                                            <div className="pick-score">
                                                Score: <span>{pick.score.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="section">
                            <h2 className="section-title">Quick Actions</h2>
                            <div className="actions-grid">
                                <button
                                    className="action-card"
                                    onClick={() => navigate("/portfolios")}
                                >
                                    <span className="action-icon">➕</span>
                                    <span className="action-text">Create Portfolio</span>
                                </button>
                                <button
                                    className="action-card"
                                    onClick={() => navigate("/top-picks")}
                                >
                                    <span className="action-icon">⭐</span>
                                    <span className="action-text">View Top Picks</span>
                                </button>
                                <button className="action-card" onClick={() => portfolios.length > 0 && navigate(`/portfolios/${portfolios[0].id}`)}>
                                    <span className="action-icon">📊</span>
                                    <span className="action-text">Analyze Portfolio</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
