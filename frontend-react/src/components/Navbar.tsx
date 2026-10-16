import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Button from "./ui/Button";
import ThemeToggle from "./ui/ThemeToggle";
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
                <button className="navbar-brand" onClick={() => navigate("/dashboard")} aria-label="Go to dashboard">
                    <div className="navbar-logo">OW</div>
                    <span className="navbar-title">OptiWealth</span>
                </button>

                <div className="navbar-menu">
                    <NavLink className={({ isActive }) => `nav-btn${isActive ? " active" : ""}`} to="/dashboard">
                        Dashboard
                    </NavLink>
                    <NavLink className={({ isActive }) => `nav-btn${isActive ? " active" : ""}`} to="/portfolios">
                        Portfolios
                    </NavLink>
                    <NavLink className={({ isActive }) => `nav-btn${isActive ? " active" : ""}`} to="/top-picks">
                        Top Picks
                    </NavLink>
                </div>

                <div className="navbar-user">
                    <span className="user-name">{user.username || user.email}</span>
                    <ThemeToggle />
                    <Button className="logout-btn" variant="ghost" onClick={handleLogout}>
                        Logout
                    </Button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
