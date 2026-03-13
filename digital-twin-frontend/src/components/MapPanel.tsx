"use client";

import { useState, useCallback } from 'react';

interface MapPanelCardProps {
    title: string;
    icon: React.ReactNode;
    imageSrc: string;
    imageAlt: string;
    interactiveUrl: string;
    caption: string;
    yearSelector?: {
        selectedYear: string;
        years: string[];
        onChange: (year: string) => void;
    };
    forecastBadge?: {
        label: string;
        colorClass: string;
    };
    onRefresh: () => void;
    isLoading: boolean;
    loadingText?: string;
}

export function MapPanelCard({
    title,
    icon,
    imageSrc,
    imageAlt,
    interactiveUrl,
    caption,
    yearSelector,
    forecastBadge,
    onRefresh,
    isLoading,
    loadingText = 'Loading...',
}: MapPanelCardProps) {
    const [imgKey, setImgKey] = useState(0);
    const [hasError, setHasError] = useState(false);
    const [isImgLoaded, setIsImgLoaded] = useState(false);

    const currentSrc = `${imageSrc}${imageSrc.includes('?') ? '&' : '?'}t=${imgKey}`;

    const handleRefresh = useCallback(() => {
        setHasError(false);
        setIsImgLoaded(false);
        setImgKey(Date.now());
        onRefresh();
    }, [onRefresh]);

    const handleYearChange = useCallback((year: string) => {
        setHasError(false);
        setIsImgLoaded(false);
        setImgKey(Date.now());
        yearSelector?.onChange(year);
    }, [yearSelector]);

    // Custom select dropdown SVG for dark theme
    const selectStyle = {
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundPosition: 'right 0.5rem center',
        backgroundRepeat: 'no-repeat' as const,
        backgroundSize: '1.2em 1.2em',
    };

    return (
        <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {icon}
                    {title}
                    {forecastBadge && (
                        <span className={`text-xs font-normal px-2 py-0.5 rounded-full border ${forecastBadge.colorClass}`}>
                            {forecastBadge.label}
                        </span>
                    )}
                </h3>
                <div className="flex items-center gap-2">
                    {yearSelector && (
                        <select
                            value={yearSelector.selectedYear}
                            onChange={(e) => handleYearChange(e.target.value)}
                            className="text-xs bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-full transition-all border border-white/10 cursor-pointer appearance-none pr-6"
                            style={selectStyle}
                        >
                            <option value="" className="bg-gray-900">Baseline</option>
                            {yearSelector.years.map((y) => (
                                <option key={y} value={y} className="bg-gray-900">{y}</option>
                            ))}
                        </select>
                    )}
                    <button
                        onClick={handleRefresh}
                        className="text-xs bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-full transition-all border border-white/10"
                    >
                        {yearSelector ? 'Refresh' : 'Refresh Heatmap'}
                    </button>
                </div>
            </div>
            <div className="relative w-full aspect-video bg-black/40 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center group">
                {!hasError && (
                    <img
                        key={imgKey}
                        src={currentSrc}
                        alt={imageAlt}
                        className={`w-full h-full object-cover transition-all duration-700 ${isLoading ? 'opacity-50' : ''}`}
                        onError={() => {
                            setHasError(true);
                            setIsImgLoaded(false);
                        }}
                        onLoad={() => {
                            setIsImgLoaded(true);
                        }}
                    />
                )}
                <div className={`absolute inset-0 pointer-events-none flex items-center justify-center text-white/30 ${isImgLoaded && !hasError ? '-z-10' : 'z-0'}`}>
                    {hasError ? 'Failed to load image' : isLoading ? loadingText : 'Loading...'}
                </div>
            </div>
            <div className="flex justify-between items-center mt-4">
                <p className="text-xs text-white/40">
                    {caption}
                </p>
                <a
                    href={interactiveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-secondary hover:text-white transition-colors hover:underline flex items-center gap-1"
                >
                    Interactive View &rarr;
                </a>
            </div>
        </div>
    );
}
