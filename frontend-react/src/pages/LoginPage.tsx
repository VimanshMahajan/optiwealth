import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../services/authService";
import "./Auth.css";

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const resp = await login({ email, password });
            // save token + user
            localStorage.setItem("token", resp.token);
            localStorage.setItem("user", JSON.stringify(resp.user));
            navigate("/dashboard");
        } catch (err: unknown) {
            console.error(err);
            // Backend may return a message; fallback to generic
            const error = err as { response?: { data?: string }; message?: string };
            setError(error?.response?.data || error?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <div className="auth-logo-icon">OW</div>
                    </div>
                    <h1 className="auth-title">Welcome Back</h1>
                    <p className="auth-subtitle">Sign in to optimize your portfolio</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="form-input"
                            placeholder="your@email.com"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="form-input"
                            placeholder="Enter your password"
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            {typeof error === "string" ? error : JSON.stringify(error)}
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="submit-button">
                        {loading && <span className="spinner"></span>}
                        {loading ? "Signing In..." : "Sign In"}
                    </button>
                </form>

                <div className="auth-footer">
                    <p className="auth-footer-text">Don't have an account?</p>
                    <Link to="/register" className="auth-link">
                        Create Account
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
