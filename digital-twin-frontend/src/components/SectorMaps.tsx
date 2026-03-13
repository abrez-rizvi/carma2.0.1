import { useState } from 'react';
import { API_BASE_URL } from '../config';
import { MapPanelCard } from './MapPanel';

const SECTORS = [
    { id: 'Industry', label: 'Industry', icon: '🏭', color: 'red' },
    { id: 'Transport', label: 'Transport', icon: '🚗', color: 'yellow' },
    { id: 'Power', label: 'Power', icon: '⚡', color: 'purple' },
    { id: 'Residential', label: 'Residential', icon: '🏠', color: 'green' },
    { id: 'Aviation', label: 'Aviation', icon: '✈️', color: 'orange' },
    { id: 'Commercial', label: 'Commercial', icon: '🏢', color: 'blue' },
];

export function SectorMaps() {
    const [selectedSector, setSelectedSector] = useState<string>('Industry');
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const getSectorColor = () => {
        const sector = SECTORS.find(s => s.id === selectedSector);
        return sector?.color || 'gray';
    };

    const handleSectorChange = (sector: string) => {
        setSelectedSector(sector);
        setIsLoading(true);
    };

    const handleYearChange = (year: string) => {
        setSelectedYear(year);
        setIsLoading(true);
    };

    const heatmapSrc = `${API_BASE_URL}/api/emission-map/sector/heatmap.png?sector=${selectedSector}`;
    const hotspotsSrc = selectedYear
        ? `${API_BASE_URL}/api/emission-map/sector/hotspots.png?sector=${selectedSector}&year=${selectedYear}`
        : `${API_BASE_URL}/api/emission-map/sector/hotspots.png?sector=${selectedSector}`;

    return (
        <div>
            {/* Sector Selector */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
                <span className="text-xs text-white/40 uppercase tracking-wider">Sector:</span>
                {SECTORS.map(sector => (
                    <button
                        key={sector.id}
                        onClick={() => handleSectorChange(sector.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                            selectedSector === sector.id
                                ? `bg-${sector.color}-500/20 text-${sector.color}-300 border-${sector.color}-500/50 shadow-lg`
                                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                        }`}
                    >
                        <span>{sector.icon}</span>
                        <span>{sector.label}</span>
                    </button>
                ))}
            </div>

            <div className="flex gap-4">
                <MapPanelCard
                    title={`${selectedSector} Heatmap`}
                    icon={<span role="img" aria-label="chart">📊</span>}
                    imageSrc={heatmapSrc}
                    imageAlt={`${selectedSector} Emission Heatmap`}
                    interactiveUrl={`${API_BASE_URL}/api/emission-map/sector/heatmap?sector=${selectedSector}`}
                    caption={`${selectedSector} sector emission distribution across Delhi.`}
                    onRefresh={() => handleSectorChange(selectedSector)}
                    isLoading={isLoading}
                    loadingText={`Loading ${selectedSector} heatmap...`}
                />
                <MapPanelCard
                    title={`${selectedSector} Sources`}
                    icon={<span role="img" aria-label="target">📍</span>}
                    imageSrc={hotspotsSrc}
                    imageAlt={`${selectedSector} Emission Sources`}
                    interactiveUrl={
                        selectedYear
                            ? `${API_BASE_URL}/api/emission-map/sector/hotspots?sector=${selectedSector}&year=${selectedYear}`
                            : `${API_BASE_URL}/api/emission-map/sector/hotspots?sector=${selectedSector}`
                    }
                    caption={
                        selectedYear
                            ? `Projected ${selectedSector} sources for ${selectedYear}.`
                            : `Current ${selectedSector} emission sources.`
                    }
                    yearSelector={{
                        selectedYear,
                        years: ['2026', '2027', '2028'],
                        onChange: handleYearChange,
                    }}
                    forecastBadge={selectedYear ? {
                        label: `${selectedYear} Forecast`,
                        colorClass: `bg-${getSectorColor()}-500/30 text-${getSectorColor()}-300 border-${getSectorColor()}-500/50`,
                    } : undefined}
                    onRefresh={() => handleYearChange(selectedYear)}
                    isLoading={isLoading}
                    loadingText="Generating forecast..."
                />
            </div>
        </div>
    );
}
