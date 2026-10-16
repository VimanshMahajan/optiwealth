import React from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
}

const Button: React.FC<ButtonProps> = ({
    variant = "primary",
    className = "",
    type = "button",
    ...props
}) => (
    <button
        {...props}
        type={type}
        className={`ui-button ui-button-${variant} ${className}`.trim()}
    />
);

export default Button;
