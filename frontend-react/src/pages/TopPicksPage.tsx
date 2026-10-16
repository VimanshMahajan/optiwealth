import React, { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { getTopPicks } from "../services/portfolioService";
import type { TopPick } from "../services/portfolioService";
import "./TopPicks.css";

const periods = ["ALL", "1M", "3M", "6M+"] as const;

const TopPicksPage: React.FC = () => {
    const [topPicks, setTopPicks] = useState<TopPick[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<(typeof periods)[number]>("ALL");

    const loadTopPicks = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);
            const data = await getTopPicks();
            setTopPicks([...data].sort((a, b) => b.score - a.score));
        } catch (loadError) {
            console.error("Error loading top picks:", loadError);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadTopPicks();
    }, [loadTopPicks]);

    const normalizeScore = (score: number) => (score <= 1 ? score * 100 : score);
    const filteredPicks = useMemo(
        () => selectedPeriod === "ALL" ? topPicks : topPicks.filter((pick) => pick.period === selectedPeriod),
        [selectedPeriod, topPicks]
    );
    const highConfidenceCount = filteredPicks.filter((pick) => normalizeScore(pick.score) >= 80).length;

    return (
        <div className="page-container">
            <Navbar />
            <div className="page-content top-picks-page">
                <header className="page-header">
                    <div>
                        <p className="eyebrow">Market intelligence</p>
                        <h1 className="page-title">Top picks</h1>
                        <p className="page-subtitle">Daily ranked signals based on the latest available analysis.</p>
                    </div>
                    <Button variant="secondary" onClick={() => void loadTopPicks()} disabled={loading}>
                        {loading ? "Refreshing..." : "↻ Refresh"}
                    </Button>
                </header>

                {loading ? (
                    <div className="top-picks-loading" aria-live="polite">
                        <span /><span /><span />
                    </div>
                ) : error ? (
                    <Card className="top-picks-state">
                        <h2>Top picks are unavailable</h2>
                        <p>We could not retrieve the latest recommendations.</p>
                        <Button variant="secondary" onClick={() => void loadTopPicks()}>Try again</Button>
                    </Card>
                ) : topPicks.length === 0 ? (
                    <Card className="top-picks-state">
                        <div className="top-picks-mark" aria-hidden="true">✦</div>
                        <h2>No recommendations yet</h2>
                        <p>Top picks are updated daily. Check back after the next refresh.</p>
                    </Card>
                ) : (
                    <>
                        <div className="period-filters" role="tablist" aria-label="Recommendation period">
                            {periods.map((period) => {
                                const count = period === "ALL" ? topPicks.length : topPicks.filter((pick) => pick.period === period).length;
                                return (
                                    <button
                                        key={period}
                                        type="button"
                                        role="tab"
                                        aria-selected={selectedPeriod === period}
                                        className={`period-btn${selectedPeriod === period ? " active" : ""}`}
                                        onClick={() => setSelectedPeriod(period)}
                                    >
                                        {period === "ALL" ? "All signals" : period} <span>{count}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <section className="pick-summary" aria-label="Recommendation summary">
                            <Card><strong>{filteredPicks.length}</strong><span>{selectedPeriod === "ALL" ? "Total signals" : `${selectedPeriod} signals`}</span></Card>
                            <Card><strong>{highConfidenceCount}</strong><span>High confidence</span></Card>
                            <Card><strong>Daily</strong><span>Refresh cadence</span></Card>
                        </section>

                        <section className="picks-list" aria-label="Top recommendations">
                            {filteredPicks.map((pick, index) => {
                                const score = Math.min(100, Math.max(0, normalizeScore(pick.score)));
                                const scoreTone = score >= 80 ? "positive" : score >= 60 ? "accent" : "warning";
                                return (
                                    <Card key={pick.id} as="article" className="pick-card">
                                        <div className="pick-rank">{String(index + 1).padStart(2, "0")}</div>
                                        <div className="pick-identity">
                                            <div className="pick-symbol">{pick.symbol.replace(".NS", "")}</div>
                                            <div className="pick-company">{pick.companyName || "NSE listed symbol"}</div>
                                        </div>
                                        <Badge tone="accent">{pick.period}</Badge>
                                        <div className="pick-score">
                                            <div className="pick-score-topline">
                                                <span>Confidence score</span>
                                                <strong>{score.toFixed(1)}</strong>
                                            </div>
                                            <div className="pick-score-track"><span style={{ width: `${score}%` }} /></div>
                                            <Badge tone={scoreTone}>{score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Moderate"}</Badge>
                                        </div>
                                        <div className="pick-details">
                                            {pick.returnPercent !== undefined && <span>Return <strong>{pick.returnPercent.toFixed(1)}%</strong></span>}
                                            {pick.lastPrice !== undefined && <span>Last price <strong>₹{pick.lastPrice.toFixed(2)}</strong></span>}
                                        </div>
                                        {pick.lastUpdated && <time className="pick-updated">Updated {new Date(pick.lastUpdated).toLocaleDateString()}</time>}
                                    </Card>
                                );
                            })}
                        </section>

                        <aside className="disclaimer">
                            <strong>Important:</strong> Recommendations are generated from historical data and technical analysis. They are not financial advice.
                        </aside>
                    </>
                )}
            </div>
        </div>
    );
};

export default TopPicksPage;
