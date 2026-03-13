import { useState } from 'react';
import { API_BASE_URL } from '../config';
import { MapPanelCard } from './MapPanel';

export function EmissionMaps() {
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const handleYearChange = (year: string) => {
        setSelectedYear(year);
        setIsLoading(true);
    };

    const heatmapCaption = 'Grid-based CO₂ concentration analysis across Delhi.';
    const hotspotsCaption = selectedYear
        ? `Projected CO₂ sources based on ${selectedYear} emission forecasts.`
        : 'Sector-wise emission sources: Industry, Transport, Power, Residential.';

    return (
        <div className='flex gap-4'>
            <MapPanelCard
                title="CO₂ Emission Heatmap"
                icon={<span role="img" aria-label="map">🌡️</span>}
                imageSrc={`${API_BASE_URL}/api/emission-map/heatmap.png`}
                imageAlt="CO2 Emission Heatmap"
                interactiveUrl={`${API_BASE_URL}/api/emission-map/heatmap`}
                caption={heatmapCaption}
                onRefresh={() => {}}
                isLoading={false}
            />
            <MapPanelCard
                title="Emission Sources"
                icon={<span role="img" aria-label="factory">🏭</span>}
                imageSrc={
                    selectedYear
                        ? `${API_BASE_URL}/api/emission-map/hotspots.png?year=${selectedYear}`
                        : `${API_BASE_URL}/api/emission-map/hotspots.png`
                }
                imageAlt="CO2 Emission Sources"
                interactiveUrl={
                    selectedYear
                        ? `${API_BASE_URL}/api/emission-map/hotspots?year=${selectedYear}`
                        : `${API_BASE_URL}/api/emission-map/hotspots`
                }
                caption={hotspotsCaption}
                yearSelector={{
                    selectedYear,
                    years: ['2026', '2027', '2028'],
                    onChange: handleYearChange,
                }}
                forecastBadge={selectedYear ? {
                    label: `${selectedYear} Forecast`,
                    colorClass: 'bg-blue-500/30 text-blue-300 border-blue-500/50',
                } : undefined}
                onRefresh={() => handleYearChange(selectedYear)}
                isLoading={isLoading}
                loadingText="Generating forecast..."
            />

            {/* Legend */}
            <div className="fixed bottom-4 left-4 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg p-3 text-xs z-50 hidden lg:block">
                <div className="font-bold text-white mb-2">Emission Sources</div>
                <div className="space-y-1 text-white/70">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span> Industry
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-orange-500"></span> Aviation
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-500"></span> Transport
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-purple-500"></span> Power
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span> Residential
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span> Commercial
                    </div>
                </div>
            </div>
        </div>
    );
}
