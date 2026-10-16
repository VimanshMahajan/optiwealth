import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { getUserPortfolios, createPortfolio, deletePortfolio } from "../services/portfolioService";
import type { Portfolio } from "../services/portfolioService";
import "./Portfolios.css";

const PortfoliosPage: React.FC = () => {
    const navigate = useNavigate();
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPortfolioName, setNewPortfolioName] = useState("");
    const [creating, setCreating] = useState(false);

    const loadPortfolios = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);
            setPortfolios(await getUserPortfolios());
        } catch (loadError) {
            console.error("Error loading portfolios:", loadError);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadPortfolios();
    }, [loadPortfolios]);

    const handleCreatePortfolio = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!newPortfolioName.trim()) return;
        try {
            setCreating(true);
            await createPortfolio(newPortfolioName.trim());
            setNewPortfolioName("");
            setShowCreateModal(false);
            await loadPortfolios();
        } catch (createError) {
            console.error("Error creating portfolio:", createError);
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
        } catch (deleteError) {
            console.error("Error deleting portfolio:", deleteError);
            alert("Failed to delete portfolio");
        }
    };

    return (
        <div className="page-container">
            <Navbar />
            <div className="page-content portfolios-page">
                <header className="page-header">
                    <div>
                        <p className="eyebrow">Your workspace</p>
                        <h1 className="page-title">Portfolios</h1>
                        <p className="page-subtitle">A focused home for the investments you are tracking.</p>
                    </div>
                    <Button onClick={() => setShowCreateModal(true)}>＋ New portfolio</Button>
                </header>

                {loading ? (
                    <div className="portfolio-loading" aria-live="polite">
                        <span /><span /><span />
                    </div>
                ) : error ? (
                    <Card className="portfolio-state">
                        <h2>Portfolios are unavailable</h2>
                        <p>We could not retrieve your portfolios right now.</p>
                        <Button variant="secondary" onClick={() => void loadPortfolios()}>Try again</Button>
                    </Card>
                ) : portfolios.length === 0 ? (
                    <Card className="portfolio-state">
                        <div className="state-mark" aria-hidden="true">＋</div>
                        <h2>Create your first portfolio</h2>
                        <p>Start organizing your holdings and unlock portfolio analytics.</p>
                        <Button onClick={() => setShowCreateModal(true)}>Create portfolio</Button>
                    </Card>
                ) : (
                    <section className="portfolios-grid" aria-label="Your portfolios">
                        {portfolios.map((portfolio) => (
                            <Card key={portfolio.id} as="article" className="portfolio-card-large">
                                <div className="portfolio-card-header">
                                    <span className="portfolio-icon-large" aria-hidden="true">
                                        {portfolio.name.charAt(0).toUpperCase()}
                                    </span>
                                    <div>
                                        <h2 className="portfolio-name-large">{portfolio.name}</h2>
                                        <p className="meta-item">Portfolio {portfolio.id}</p>
                                    </div>
                                </div>
                                <div className="portfolio-meta">
                                    <span className="meta-item">
                                        {portfolio.createdAt
                                            ? `Created ${new Date(portfolio.createdAt).toLocaleDateString()}`
                                            : "Ready for holdings"}
                                    </span>
                                </div>
                                <div className="portfolio-actions">
                                    <Button variant="secondary" onClick={() => navigate(`/portfolios/${portfolio.id}`)}>
                                        View details
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={() => void handleDeletePortfolio(portfolio.id, portfolio.name)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </section>
                )}
            </div>

            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content portfolio-modal" role="dialog" aria-modal="true" aria-labelledby="create-portfolio-title" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <p className="eyebrow">New workspace</p>
                                <h2 id="create-portfolio-title">Create portfolio</h2>
                            </div>
                            <button className="modal-close" type="button" aria-label="Close dialog" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreatePortfolio} className="modal-form">
                            <div className="form-group">
                                <label className="form-label" htmlFor="portfolio-name">Portfolio name</label>
                                <Input id="portfolio-name" type="text" placeholder="e.g. Long-term growth" value={newPortfolioName} onChange={(event) => setNewPortfolioName(event.target.value)} required autoFocus />
                            </div>
                            <div className="modal-actions">
                                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                                <Button type="submit" disabled={creating}>{creating ? "Creating..." : "Create portfolio"}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PortfoliosPage;
