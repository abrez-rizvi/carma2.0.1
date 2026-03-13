import React from 'react';

interface ChartPanelProps {
    title: string;
    icon: React.ReactNode;
    loading: boolean;
    loadingText: string;
    headerRight?: React.ReactNode;
    footer?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export const chartTooltipStyle: React.CSSProperties = {
    backgroundColor: 'rgba(15, 5, 24, 0.9)',
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(10px)',
};

export function ChartPanel({
    title,
    icon,
    loading,
    loadingText,
    headerRight,
    footer,
    children,
    className = '',
}: ChartPanelProps) {
    return (
        <div className={`glass-panel p-6 relative min-h-[400px] w-full ${className}`}>
            {loading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-white font-medium animate-pulse tracking-wide">{loadingText}</div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {icon}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                        {title}
                    </span>
                </h3>
                {headerRight}
            </div>

            {children}

            {footer}
        </div>
    );
}
