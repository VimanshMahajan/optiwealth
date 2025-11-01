import React from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand" onClick={() => navigate("/dashboard")}>
                    <div className="navbar-logo">OW</div>
                    <span className="navbar-title">OptiWealth</span>
                </div>

                <div className="navbar-menu">
                    <button className="nav-btn" onClick={() => navigate("/dashboard")}>
                        <span className="nav-icon">📊</span>
                        Dashboard
                    </button>
                    <button className="nav-btn" onClick={() => navigate("/portfolios")}>
                        <span className="nav-icon">💼</span>
                        Portfolios
                    </button>
                    <button className="nav-btn" onClick={() => navigate("/top-picks")}>
                        <span className="nav-icon">⭐</span>
                        Top Picks
                    </button>
                </div>

                <div className="navbar-user">
                    <span className="user-name">{user.username || user.email}</span>
                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

