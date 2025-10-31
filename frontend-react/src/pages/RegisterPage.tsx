import React, { useState } from "react";
import { register as registerApi } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

const RegisterPage: React.FC = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr(null);
        setLoading(true);
        try {
            await registerApi({ username, email, password });
            navigate("/login");
        } catch (e: unknown) {
            const error = e as { response?: { data?: string }; message?: string };
            setErr(error?.response?.data || error?.message || "Register failed");
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
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Start optimizing your portfolio today</p>
                </div>

                <form onSubmit={handleRegister} className="auth-form">
                    <div className="form-group">
                        <label className="form-label" htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="form-input"
                            placeholder="Choose a username"
                            disabled={loading}
                        />
                    </div>

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
                            placeholder="Create a strong password"
                            disabled={loading}
                        />
                    </div>

                    {err && (
                        <div className="error-message">
                            {err}
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="submit-button">
                        {loading && <span className="spinner"></span>}
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <div className="auth-features">
                    <div className="feature-item">
                        <span className="feature-icon">📊</span>
                        <span>Portfolio Analytics</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">🎯</span>
                        <span>Risk Optimization</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">📈</span>
                        <span>Real-time Tracking</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">🔒</span>
                        <span>Secure & Private</span>
                    </div>
                </div>

                <div className="auth-footer">
                    <p className="auth-footer-text">Already have an account?</p>
                    <Link to="/login" className="auth-link">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
