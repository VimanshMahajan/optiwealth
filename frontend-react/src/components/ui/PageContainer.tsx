import React from "react";

interface PageContainerProps extends React.HTMLAttributes<HTMLElement> {
    children: React.ReactNode;
}

const PageContainer: React.FC<PageContainerProps> = ({
    children,
    className = "",
    ...props
}) => (
    <main {...props} className={`ui-page-container ${className}`.trim()}>
        {children}
    </main>
);

export default PageContainer;
