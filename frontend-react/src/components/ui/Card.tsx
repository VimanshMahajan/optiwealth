import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    as?: "div" | "section" | "article";
}

const Card: React.FC<CardProps> = ({ as = "div", className = "", ...props }) => {
    const Component = as;
    return <Component {...props} className={`ui-card ${className}`.trim()} />;
};

export default Card;
