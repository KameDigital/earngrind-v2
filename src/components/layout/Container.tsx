import React from "react";

interface ContainerProps {
    children: React.ReactNode;
    className?: string;
}

export default function Container({ children, className = "" }: ContainerProps) {
    return (
        <div className={`max-w-6xl mx-auto px-4 w-full ${className}`}>
            {children}
        </div>
    );
}
