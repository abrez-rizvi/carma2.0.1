import { useState } from 'react';
import { API_BASE_URL } from '../config';
import { MapPanelCard } from './MapPanel';

export function AQIMaps() {
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const handleYearChange = (year: string) => {
        setSelectedYear(year);
        setIsLoading(true);
    };

    const heatmapCaption = 'Clipped grid analysis via Folium & Geomapping.';
    const hotspotsCaption = selectedYear
        ? `Projected AQI based on ${selectedYear} emission forecasts.`
        : 'Live sensor readings from 40+ stations.';

    return (
        <div className='flex gap-4'>
            <MapPanelCard
                title="Delhi AQI Heatmap"
                icon={<span role="img" aria-label="map">🗺️</span>}
                imageSrc={`${API_BASE_URL}/api/aqi-map/heatmap.png`}
                imageAlt="AQI Heatmap"
                interactiveUrl={`${API_BASE_URL}/api/aqi-map/heatmap`}
                caption={heatmapCaption}
                onRefresh={() => {}}
                isLoading={false}
            />
            <MapPanelCard
                title="AQI Hotspots"
                icon={<span role="img" aria-label="target">📍</span>}
                imageSrc={
                    selectedYear
                        ? `${API_BASE_URL}/api/aqi-map/hotspots.png?year=${selectedYear}`
                        : `${API_BASE_URL}/api/aqi-map/hotspots.png`
                }
                imageAlt="AQI Hotspots"
                interactiveUrl={
                    selectedYear
                        ? `${API_BASE_URL}/api/aqi-map/hotspots?year=${selectedYear}`
                        : `${API_BASE_URL}/api/aqi-map/hotspots`
                }
                caption={hotspotsCaption}
                yearSelector={{
                    selectedYear,
                    years: ['2026', '2027', '2028'],
                    onChange: handleYearChange,
                }}
                forecastBadge={selectedYear ? {
                    label: `${selectedYear} Forecast`,
                    colorClass: 'bg-purple-500/30 text-purple-300 border-purple-500/50',
                } : undefined}
                onRefresh={() => handleYearChange(selectedYear)}
                isLoading={isLoading}
                loadingText="Generating forecast..."
            />
        </div>
    );
}
