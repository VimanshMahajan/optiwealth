import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";

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
        } catch (err: any) {
            console.error(err);
            // Backend may return a message; fallback to generic
            setError(err?.response?.data || err?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 480, margin: "6rem auto", padding: 24 }}>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: "100%", padding: 8, marginTop: 6 }}
                    />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: "100%", padding: 8, marginTop: 6 }}
                    />
                </div>

                {error && (
                    <div style={{ color: "crimson", marginBottom: 12 }}>
                        {typeof error === "string" ? error : JSON.stringify(error)}
                    </div>
                )}

                <button type="submit" disabled={loading} style={{ padding: "8px 16px" }}>
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>

            <div style={{ marginTop: 16 }}>
                <a href="/register">Register</a>
            </div>
        </div>
    );
};

export default LoginPage;
