import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getTopPicks } from "../services/portfolioService";
import type { TopPick } from "../services/portfolioService";
import "./TopPicks.css";

const TopPicksPage: React.FC = () => {
    const [topPicks, setTopPicks] = useState<TopPick[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<string>("ALL");

    useEffect(() => {
        loadTopPicks();
    }, []);

    const loadTopPicks = async () => {
        try {
            setLoading(true);
            const data = await getTopPicks();
            console.log("Received top picks data:", data);
            console.log("Total picks:", data.length);
            console.log("Period distribution:", {
                "1M": data.filter(p => p.period === "1M").length,
                "3M": data.filter(p => p.period === "3M").length,
                "6M+": data.filter(p => p.period === "6M+").length,
                "undefined": data.filter(p => !p.period).length
            });
            // Sort by score descending
            const sorted = data.sort((a, b) => b.score - a.score);
            setTopPicks(sorted);
        } catch (error) {
            console.error("Error loading top picks:", error);
        } finally {
            setLoading(false);
        }
    };

    // Convert score to percentage (handles both 0-1 and 0-100 ranges)
    const normalizeScore = (score: number): number => {
        // If score is between 0 and 1, multiply by 100
        // If score is already 0-100, use as is
        return score <= 1 ? score * 100 : score;
    };

    const getScoreColor = (score: number) => {
        const normalized = normalizeScore(score);
        if (normalized >= 80) return "#4ade80";
        if (normalized >= 60) return "#60a5fa";
        if (normalized >= 40) return "#fbbf24";
        return "#f87171";
    };

    const getScoreLabel = (score: number) => {
        const normalized = normalizeScore(score);
        if (normalized >= 80) return "Excellent";
        if (normalized >= 60) return "Good";
        if (normalized >= 40) return "Moderate";
        return "Low";
    };

    // Filter picks by selected period
    const filteredPicks = selectedPeriod === "ALL"
        ? topPicks
        : topPicks.filter(pick => pick.period === selectedPeriod);

    // Get counts by period
    const periodCounts = {
        "1M": topPicks.filter(p => p.period === "1M").length,
        "3M": topPicks.filter(p => p.period === "3M").length,
        "6M+": topPicks.filter(p => p.period === "6M+").length,
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
                        {/* Period Filter Buttons */}
                        <div className="period-filters">
                            <button
                                className={`period-btn ${selectedPeriod === "ALL" ? "active" : ""}`}
                                onClick={() => setSelectedPeriod("ALL")}
                            >
                                All ({topPicks.length})
                            </button>
                            <button
                                className={`period-btn ${selectedPeriod === "1M" ? "active" : ""}`}
                                onClick={() => setSelectedPeriod("1M")}
                            >
                                1 Month ({periodCounts["1M"]})
                            </button>
                            <button
                                className={`period-btn ${selectedPeriod === "3M" ? "active" : ""}`}
                                onClick={() => setSelectedPeriod("3M")}
                            >
                                3 Months ({periodCounts["3M"]})
                            </button>
                            <button
                                className={`period-btn ${selectedPeriod === "6M+" ? "active" : ""}`}
                                onClick={() => setSelectedPeriod("6M+")}
                            >
                                6+ Months ({periodCounts["6M+"]})
                            </button>
                        </div>

                        <div className="top-picks-info">
                            <div className="info-card">
                                <span className="info-icon">📊</span>
                                <div>
                                    <div className="info-value">{filteredPicks.length}</div>
                                    <div className="info-label">
                                        {selectedPeriod === "ALL" ? "Total Picks" : `${selectedPeriod} Picks`}
                                    </div>
                                </div>
                            </div>
                            <div className="info-card">
                                <span className="info-icon">🎯</span>
                                <div>
                                    <div className="info-value">
                                        {filteredPicks.filter((p) => normalizeScore(p.score) >= 80).length}
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
                            {filteredPicks.map((pick, index) => (
                                <div key={pick.id} className="top-pick-card-large">
                                    <div className="pick-rank">#{index + 1}</div>

                                    <div className="pick-main">
                                        <div className="pick-symbol-large">
                                            {pick.symbol.replace('.NS', '')}
                                        </div>
                                        <div className="pick-nse-label">NSE</div>
                                        <div className="pick-period-badge">{pick.period}</div>
                                    </div>

                                    <div className="pick-score-section">
                                        <div className="pick-score-label">Confidence Score</div>
                                        <div className="pick-score-bar-container">
                                            <div
                                                className="pick-score-bar"
                                                style={{
                                                    width: `${normalizeScore(pick.score)}%`,
                                                    background: getScoreColor(pick.score),
                                                }}
                                            ></div>
                                        </div>
                                        <div className="pick-score-details">
                                            <span
                                                className="pick-score-value"
                                                style={{ color: getScoreColor(pick.score) }}
                                            >
                                                {normalizeScore(pick.score).toFixed(1)}
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

