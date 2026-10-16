import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    tone?: "neutral" | "accent" | "positive" | "negative" | "warning";
}

const Badge: React.FC<BadgeProps> = ({
    tone = "neutral",
    className = "",
    ...props
}) => (
    <span {...props} className={`ui-badge ui-badge-${tone} ${className}`.trim()} />
);

export default Badge;
