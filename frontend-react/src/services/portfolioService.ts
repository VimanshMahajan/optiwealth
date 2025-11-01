import api from "./api";

export interface Portfolio {
    id: number;
    name: string;
    userId: number;
    createdAt?: string;
}

export interface Holding {
    id: number;
    symbol: string;
    quantity: number;
    avgCost: number;
    portfolioId: number;
}

export interface AnalyticsResult {
    portfolio_metrics: {
        total_value: number;
        total_cost: number;
        total_gain_loss: number;
        total_gain_loss_pct: number;
    };
    holdings: Array<{
        symbol: string;
        quantity: number;
        avg_cost: number;
        current_price: number;
        current_value: number;
        gain_loss: number;
        gain_loss_pct: number;
        weight: number;
    }>;
    risk_metrics?: {
        portfolio_volatility: number;
        sharpe_ratio: number;
        max_drawdown: number;
    };
    ai_summary?: {
        summary?: string;
        recommendations?: string[];
    };
}

export interface TopPick {
    id: number;
    symbol: string;
    score: number;
    lastUpdated: string;
}

// Portfolio APIs
export const createPortfolio = async (name: string): Promise<Portfolio> => {
    const res = await api.post("/api/portfolios", { name });
    return res.data;
};

export const getUserPortfolios = async (): Promise<Portfolio[]> => {
    const res = await api.get("/api/portfolios");
    return res.data;
};

export const getPortfolioById = async (id: number): Promise<Portfolio> => {
    const res = await api.get(`/api/portfolios/${id}`);
    return res.data;
};

export const deletePortfolio = async (id: number): Promise<void> => {
    await api.delete(`/api/portfolios/${id}`);
};

// Holding APIs
export const addHolding = async (
    portfolioId: number,
    symbol: string,
    quantity: number,
    avgCost: number
): Promise<Holding> => {
    const res = await api.post(`/api/portfolios/${portfolioId}/holdings`, {
        symbol,
        quantity: quantity.toString(),
        avgCost: avgCost.toString(),
    });
    return res.data;
};

export const getHoldings = async (portfolioId: number): Promise<Holding[]> => {
    const res = await api.get(`/api/portfolios/${portfolioId}/holdings`);
    return res.data;
};

export const updateHolding = async (
    holdingId: number,
    quantity: number,
    avgCost: number
): Promise<Holding> => {
    const res = await api.put(`/api/holdings/${holdingId}`, {
        quantity: quantity.toString(),
        avgCost: avgCost.toString(),
    });
    return res.data;
};

export const deleteHolding = async (holdingId: number): Promise<void> => {
    await api.delete(`/api/holdings/${holdingId}`);
};

// Analytics API
export const analyzePortfolio = async (portfolioId: number): Promise<AnalyticsResult> => {
    const res = await api.get(`/api/analytics/${portfolioId}/analyze`);
    return res.data;
};

// Top Picks API
export const getTopPicks = async (): Promise<TopPick[]> => {
    const res = await api.get("/api/top-picks");
    return res.data;
};

