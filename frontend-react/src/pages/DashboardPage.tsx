import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import MetricsExplainer from "../components/MetricsExplainer";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { getUserPortfolios, getTopPicks } from "../services/portfolioService";
import type { Portfolio, TopPick } from "../services/portfolioService";
import "./Dashboard.css";

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [topPicks, setTopPicks] = useState<TopPick[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showExplainer, setShowExplainer] = useState(false);
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const displayName = user.username || user.email || "there";

    const loadDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);
            const [portfoliosData, topPicksData] = await Promise.all([
                getUserPortfolios(),
                getTopPicks(),
            ]);
            setPortfolios(portfoliosData);
            setTopPicks(topPicksData);
        } catch (loadError) {
            console.error("Error loading dashboard data:", loadError);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadDashboardData();
    }, [loadDashboardData]);

    const normalizeScore = (score: number) => (score <= 1 ? score * 100 : score);
    const visiblePicks = topPicks.slice(0, 5);

    return (
        <div className="dashboard-container">
            <Navbar />

            <div className="dashboard-content">
                <header className="dashboard-hero">
                    <div>
                        <p className="eyebrow">Portfolio intelligence</p>
                        <h1 className="hero-title">Good to see you, {displayName}.</h1>
                        <p className="hero-subtitle">
                            A clear view of your portfolios and the latest market signals.
                        </p>
                    </div>
                    <Button onClick={() => navigate("/portfolios")}>Open portfolios</Button>
                </header>

                {loading ? (
                    <DashboardSkeleton />
                ) : error ? (
                    <Card className="dashboard-message">
                        <div className="message-icon" aria-hidden="true">!</div>
                        <div>
                            <h2>We couldn&apos;t load your dashboard</h2>
                            <p>Check your connection and try again. Your account data has not been changed.</p>
                        </div>
                        <Button variant="secondary" onClick={() => void loadDashboardData()}>
                            Try again
                        </Button>
                    </Card>
                ) : (
                    <>
                        <section className="overview-grid" aria-label="Account overview">
                            <Card className="overview-card overview-card-featured">
                                <div className="overview-card-topline">
                                    <span className="overview-icon" aria-hidden="true">⌂</span>
                                    <Badge tone="accent">Workspace</Badge>
                                </div>
                                <strong className="overview-value">{portfolios.length}</strong>
                                <span className="overview-label">Active portfolios</span>
                                <p className="overview-note">Keep your goals organized in one place.</p>
                            </Card>
                            <Card className="overview-card">
                                <div className="overview-card-topline">
                                    <span className="overview-icon overview-icon-blue" aria-hidden="true">✦</span>
                                    <Badge tone="positive">Updated daily</Badge>
                                </div>
                                <strong className="overview-value">{topPicks.length}</strong>
                                <span className="overview-label">Market signals available</span>
                                <p className="overview-note">Ranked recommendations from your analytics service.</p>
                            </Card>
                            <Card className="overview-card">
                                <div className="overview-card-topline">
                                    <span className="overview-icon overview-icon-green" aria-hidden="true">↗</span>
                                    <Badge>Analytics</Badge>
                                </div>
                                <strong className="overview-value">AI</strong>
                                <span className="overview-label">Portfolio insights</span>
                                <p className="overview-note">Run an analysis from any portfolio detail page.</p>
                            </Card>
                        </section>

                        <section className="dashboard-section" aria-labelledby="portfolios-heading">
                            <div className="section-header">
                                <div>
                                    <p className="eyebrow">Your workspace</p>
                                    <h2 id="portfolios-heading" className="section-title">Portfolios</h2>
                                </div>
                                <Button variant="secondary" onClick={() => navigate("/portfolios")}>
                                    View all
                                </Button>
                            </div>

                            {portfolios.length === 0 ? (
                                <EmptyDashboardState
                                    title="Start with your first portfolio"
                                    description="Create a portfolio to track holdings and unlock personalized analysis."
                                    action="Create portfolio"
                                    onAction={() => navigate("/portfolios")}
                                />
                            ) : (
                                <div className="portfolio-grid">
                                    {portfolios.slice(0, 3).map((portfolio) => (
                                        <Card key={portfolio.id} as="article" className="portfolio-card">
                                            <div className="portfolio-card-heading">
                                                <span className="portfolio-mark" aria-hidden="true">
                                                    {portfolio.name.charAt(0).toUpperCase()}
                                                </span>
                                                <div>
                                                    <h3 className="portfolio-name">{portfolio.name}</h3>
                                                    <p className="portfolio-meta">Portfolio {portfolio.id}</p>
                                                </div>
                                            </div>
                                            <div className="portfolio-card-footer">
                                                <span className="portfolio-meta">
                                                    {portfolio.createdAt
                                                        ? `Created ${new Date(portfolio.createdAt).toLocaleDateString()}`
                                                        : "Ready for holdings"}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    className="portfolio-action"
                                                    onClick={() => navigate(`/portfolios/${portfolio.id}`)}
                                                >
                                                    View details <span aria-hidden="true">→</span>
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="dashboard-section" aria-labelledby="signals-heading">
                            <div className="section-header">
                                <div>
                                    <p className="eyebrow">Latest intelligence</p>
                                    <h2 id="signals-heading" className="section-title">Top market signals</h2>
                                </div>
                                <Button variant="secondary" onClick={() => navigate("/top-picks")}>
                                    Explore all
                                </Button>
                            </div>

                            {visiblePicks.length === 0 ? (
                                <div className="dashboard-empty-inline">
                                    <span aria-hidden="true">✦</span>
                                    <p>Market signals will appear here after the next recommendation refresh.</p>
                                </div>
                            ) : (
                                <div className="signals-list">
                                    {visiblePicks.map((pick, index) => {
                                        const score = Math.min(100, Math.max(0, normalizeScore(pick.score)));
                                        return (
                                            <Card key={pick.id} as="article" className="signal-row">
                                                <div className="signal-rank" aria-label={`Rank ${index + 1}`}>
                                                    {String(index + 1).padStart(2, "0")}
                                                </div>
                                                <div className="signal-symbol">
                                                    <strong>{pick.symbol.replace(".NS", "")}</strong>
                                                    <span>{pick.companyName || "NSE listed symbol"}</span>
                                                </div>
                                                <Badge tone={score >= 80 ? "positive" : "accent"}>{pick.period}</Badge>
                                                <div className="signal-score">
                                                    <div className="score-label">
                                                        <span>Signal score</span>
                                                        <strong>{score.toFixed(1)}</strong>
                                                    </div>
                                                    <div className="score-track" aria-label={`Score ${score.toFixed(1)} out of 100`}>
                                                        <span style={{ width: `${score}%` }} />
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        <section className="dashboard-section" aria-labelledby="actions-heading">
                            <div className="section-header">
                                <div>
                                    <p className="eyebrow">Keep moving</p>
                                    <h2 id="actions-heading" className="section-title">Quick actions</h2>
                                </div>
                            </div>
                            <div className="actions-grid">
                                <button className="action-card" onClick={() => navigate("/portfolios")}>
                                    <span className="action-icon" aria-hidden="true">＋</span>
                                    <span><strong>Create portfolio</strong><small>Organize a new investment view</small></span>
                                    <span className="action-arrow" aria-hidden="true">→</span>
                                </button>
                                <button className="action-card" onClick={() => navigate("/top-picks")}>
                                    <span className="action-icon" aria-hidden="true">✦</span>
                                    <span><strong>Review top picks</strong><small>Explore the latest ranked signals</small></span>
                                    <span className="action-arrow" aria-hidden="true">→</span>
                                </button>
                                <button
                                    className="action-card"
                                    disabled={portfolios.length === 0}
                                    onClick={() => portfolios.length > 0 && navigate(`/portfolios/${portfolios[0].id}`)}
                                >
                                    <span className="action-icon" aria-hidden="true">↗</span>
                                    <span><strong>Analyze portfolio</strong><small>{portfolios.length > 0 ? "Open your first portfolio" : "Create a portfolio first"}</small></span>
                                    <span className="action-arrow" aria-hidden="true">→</span>
                                </button>
                                <button className="action-card" onClick={() => setShowExplainer(!showExplainer)} aria-expanded={showExplainer}>
                                    <span className="action-icon" aria-hidden="true">?</span>
                                    <span><strong>{showExplainer ? "Hide metrics guide" : "Learn the metrics"}</strong><small>Understand your analytics</small></span>
                                    <span className="action-arrow" aria-hidden="true">{showExplainer ? "↑" : "→"}</span>
                                </button>
                            </div>
                        </section>

                        {showExplainer && (
                            <section className="dashboard-section" aria-label="Metrics guide">
                                <MetricsExplainer />
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

const DashboardSkeleton: React.FC = () => (
    <div className="dashboard-skeleton" aria-live="polite" aria-label="Loading dashboard">
        <span className="sr-only">Loading dashboard...</span>
        <div className="skeleton-overview">
            <span /><span /><span />
        </div>
        <div className="skeleton-heading" />
        <div className="skeleton-cards"><span /><span /><span /></div>
        <div className="skeleton-heading skeleton-heading-short" />
        <div className="skeleton-signals"><span /><span /><span /></div>
    </div>
);

interface EmptyDashboardStateProps {
    title: string;
    description: string;
    action: string;
    onAction: () => void;
}

const EmptyDashboardState: React.FC<EmptyDashboardStateProps> = ({
    title,
    description,
    action,
    onAction,
}) => (
    <Card className="dashboard-empty">
        <div className="empty-orb" aria-hidden="true">＋</div>
        <h3>{title}</h3>
        <p>{description}</p>
        <Button onClick={onAction}>{action}</Button>
    </Card>
);

export default DashboardPage;
