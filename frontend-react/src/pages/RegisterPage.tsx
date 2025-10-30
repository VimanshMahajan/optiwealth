import React, { useState } from "react";
import { register as registerApi } from "../services/authService";
import { useNavigate } from "react-router-dom";

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
        } catch (e: any) {
            setErr(e?.response?.data || e?.message || "Register failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 480, margin: "6rem auto", padding: 24 }}>
            <h2>Register</h2>
            <form onSubmit={handleRegister}>
                <div style={{ marginBottom: 12 }}>
                    <label>Username</label>
                    <input value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: "100%", padding: 8, marginTop: 6 }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                    <label>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", padding: 8, marginTop: 6 }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                    <label>Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%", padding: 8, marginTop: 6 }} />
                </div>

                {err && <div style={{ color: "crimson", marginBottom: 12 }}>{err}</div>}

                <button disabled={loading} type="submit">{loading ? "Creating..." : "Register"}</button>
            </form>
        </div>
    );
};

export default RegisterPage;
