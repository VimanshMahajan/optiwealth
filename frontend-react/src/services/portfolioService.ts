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
    portfolio: {
        portfolioValue: number;
        totalCost: number;
        profit: number;
        profitPercent: number;
        sharpeRatio: number;
        holdings: Array<{
            symbol: string;
            quantity: number;
            avgCost: number;
            currentPrice: number;
            currentValue: number;
            profit: number;
            profitPercent: number;
            currentPercent: number;
            volatility?: number;
            sharpeRatio?: number;
            cumulativeReturn?: number;
        }>;
    };
    riskMetrics?: {
        portfolioVolatility?: number;
        valueAtRisk95?: number;
        conditionalVaR95?: number;
        maxDrawdown?: number;
        diversificationScore?: number;
        betas?: { [key: string]: number | null };
        correlationMatrix?: { [key: string]: { [key: string]: number } };
    };
    forecasts?: {
        [symbol: string]: {
            currentPrice?: number;
            expectedReturn?: number;
            trend?: string;
            volatility?: number;
            priceRange?: any;
        };
    };
    optimization?: {
        maxSharpe?: any;
        minVolatility?: any;
        portfolioCVaR95?: number;
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

