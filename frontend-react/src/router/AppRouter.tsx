import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import PortfoliosPage from "../pages/PortfoliosPage";
import PortfolioDetailPage from "../pages/PortfolioDetailPage";
import TopPicksPage from "../pages/TopPicksPage";
import ProtectedRoute from "../components/ProtectedRoute";

const AppRouter: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/portfolios"
                    element={
                        <ProtectedRoute>
                            <PortfoliosPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/portfolios/:id"
                    element={
                        <ProtectedRoute>
                            <PortfolioDetailPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/top-picks"
                    element={
                        <ProtectedRoute>
                            <TopPicksPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;
