import React from "react";

const DashboardPage: React.FC = () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    return (
        <div style={{ padding: 24 }}>
            <h2>Dashboard (placeholder)</h2>
            <p>Authenticated: {token ? "yes" : "no"}</p>
            <pre>{user ?? "no user"}</pre>
        </div>
    );
};

export default DashboardPage;
