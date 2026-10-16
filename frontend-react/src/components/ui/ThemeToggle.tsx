import React, { useEffect, useState } from "react";

type Theme = "light" | "dark";

const getInitialTheme = (): Theme => {
    const storedTheme = localStorage.getItem("theme");
    return storedTheme === "dark" ? "dark" : "light";
};

const ThemeToggle: React.FC = () => {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem("theme", theme);
    }, [theme]);

    const nextTheme = theme === "dark" ? "light" : "dark";

    return (
        <button
            className="theme-toggle"
            type="button"
            onClick={() => setTheme(nextTheme)}
            aria-label={`Switch to ${nextTheme} theme`}
            title={`Switch to ${nextTheme} theme`}
        >
            <span className="theme-toggle-label">{theme === "dark" ? "Light theme" : "Dark theme"}</span>
        </button>
    );
};

export default ThemeToggle;
