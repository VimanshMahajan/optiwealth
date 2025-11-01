import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getTopPicks } from "../services/portfolioService";
import type { TopPick } from "../services/portfolioService";
import "./TopPicks.css";

const TopPicksPage: React.FC = () => {
    const [topPicks, setTopPicks] = useState<TopPick[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTopPicks();
    }, []);

    const loadTopPicks = async () => {
        try {
            setLoading(true);
            const data = await getTopPicks();
            // Sort by score descending
            const sorted = data.sort((a, b) => b.score - a.score);
            setTopPicks(sorted);
        } catch (error) {
            console.error("Error loading top picks:", error);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "#4ade80";
        if (score >= 60) return "#60a5fa";
        if (score >= 40) return "#fbbf24";
        return "#f87171";
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return "Excellent";
        if (score >= 60) return "Good";
        if (score >= 40) return "Moderate";
        return "Low";
    };

    return (
        <div className="page-container">
            <Navbar />

            <div className="page-content">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">⭐ Today's Top Stock Picks</h1>
                        <p className="page-subtitle">
                            AI-powered stock recommendations updated daily
                        </p>
                    </div>
                    <button className="btn-refresh" onClick={loadTopPicks} disabled={loading}>
                        {loading ? "Refreshing..." : "🔄 Refresh"}
                    </button>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>Loading top picks...</p>
                    </div>
                ) : topPicks.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">⭐</div>
                        <h3>No top picks available</h3>
                        <p>Top picks are updated daily. Please check back later.</p>
                    </div>
                ) : (
                    <>
                        <div className="top-picks-info">
                            <div className="info-card">
                                <span className="info-icon">📊</span>
                                <div>
                                    <div className="info-value">{topPicks.length}</div>
                                    <div className="info-label">Total Picks</div>
                                </div>
                            </div>
                            <div className="info-card">
                                <span className="info-icon">🎯</span>
                                <div>
                                    <div className="info-value">
                                        {topPicks.filter((p) => p.score >= 80).length}
                                    </div>
                                    <div className="info-label">High Confidence</div>
                                </div>
                            </div>
                            <div className="info-card">
                                <span className="info-icon">📅</span>
                                <div>
                                    <div className="info-value">Daily</div>
                                    <div className="info-label">Updated</div>
                                </div>
                            </div>
                        </div>

                        <div className="top-picks-grid-large">
                            {topPicks.map((pick, index) => (
                                <div key={pick.id} className="top-pick-card-large">
                                    <div className="pick-rank">#{index + 1}</div>

                                    <div className="pick-main">
                                        <div className="pick-symbol-large">
                                            {pick.symbol.replace('.NS', '')}
                                        </div>
                                        <div className="pick-nse-label">NSE</div>
                                    </div>

                                    <div className="pick-score-section">
                                        <div className="pick-score-label">Confidence Score</div>
                                        <div className="pick-score-bar-container">
                                            <div
                                                className="pick-score-bar"
                                                style={{
                                                    width: `${pick.score}%`,
                                                    background: getScoreColor(pick.score),
                                                }}
                                            ></div>
                                        </div>
                                        <div className="pick-score-details">
                                            <span
                                                className="pick-score-value"
                                                style={{ color: getScoreColor(pick.score) }}
                                            >
                                                {pick.score.toFixed(1)}
                                            </span>
                                            <span
                                                className="pick-score-badge"
                                                style={{
                                                    background: `${getScoreColor(pick.score)}20`,
                                                    color: getScoreColor(pick.score),
                                                }}
                                            >
                                                {getScoreLabel(pick.score)}
                                            </span>
                                        </div>
                                    </div>

                                    {pick.lastUpdated && (
                                        <div className="pick-updated">
                                            Updated: {new Date(pick.lastUpdated).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="disclaimer">
                            <div className="disclaimer-icon">⚠️</div>
                            <div>
                                <strong>Disclaimer:</strong> These recommendations are AI-generated based on
                                historical data and technical analysis. They should not be considered as
                                financial advice. Please do your own research and consult with a financial
                                advisor before making investment decisions.
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default TopPicksPage;

