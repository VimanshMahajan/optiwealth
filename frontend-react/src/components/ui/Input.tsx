import React from "react";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className = "", ...props }, ref) => (
        <input ref={ref} {...props} className={`ui-input ${className}`.trim()} />
    )
);

Input.displayName = "Input";

export default Input;
