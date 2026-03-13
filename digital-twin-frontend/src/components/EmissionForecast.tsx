import React, { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { ForecastPoint } from '../types';
import { ChartPanel, chartTooltipStyle } from './ChartPanel';

export function EmissionForecast() {
    const [data, setData] = useState<ForecastPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [days, setDays] = useState(30);

    useEffect(() => {
        fetchForecast(days);
    }, [days]);

    const fetchForecast = async (nDays: number) => {
        setLoading(true);
        try {
            const response = await fetch('/api/emission/forecast/days', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ days: nDays })
            });
            const result = await response.json();
            if (result.status === 'success') {
                const history = result.history || [];
                const forecasts = result.forecasts || [];

                const lastHistory = history.length > 0 ? history[history.length - 1] : null;

                const processedHistory = history.map((d: any) => ({
                    ...d,
                    emission_hist: d.emission,
                    emission_pred: null
                }));

                const processedForecast = forecasts.map((d: any) => ({
                    ...d,
                    emission_hist: null,
                    emission_pred: d.emission
                }));

                if (lastHistory) {
                    processedForecast.unshift({
                        ...lastHistory,
                        emission_hist: null,
                        emission_pred: lastHistory.emission,
                        is_connection: true
                    });
                }

                setData([...processedHistory, ...processedForecast]);
            }
        } catch (e) {
            console.error("Forecast error:", e);
        } finally {
            setLoading(false);
        }
    };

    const getTicks = () => {
        if (data.length === 0) return [];
        const emissions = data.map(d => d.emission);
        const min = Math.floor(Math.min(...emissions) / 10) * 10;
        const max = Math.ceil(Math.max(...emissions) / 10) * 10;

        const ticks = [];
        for (let i = min; i <= max; i += 10) {
            ticks.push(i);
        }
        return ticks;
    };

    const headerRight = (
        <div className="relative">
            <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="bg-black/20 text-white text-sm border border-white/10 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary/50 appearance-none pr-8 cursor-pointer hover:bg-white/5 transition-colors"
            >
                <option value={30} className="bg-slate-900">Next 30 Days</option>
                <option value={60} className="bg-slate-900">Next 60 Days</option>
                <option value={90} className="bg-slate-900">Next 90 Days</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/50 text-xs">
                ▼
            </div>
        </div>
    );

    const footer = data.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 text-center">
            {Object.keys(data[0].sectors).map((sector) => (
                <div key={sector} className="bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{sector.replace('_', ' ')}</div>
                    <div className="text-sm font-bold text-white">
                        {Math.round(data[data.length - 1].sectors[sector as keyof ForecastPoint['sectors']])} kt
                    </div>
                </div>
            ))}
        </div>
    ) : undefined;

    return (
        <ChartPanel
            title="Emission Forecast (AI Prediction)"
            icon={<TrendingUp className="w-5 h-5 text-secondary" />}
            loading={loading}
            loadingText="Calculating Emissions Model..."
            headerRight={headerRight}
            footer={footer}
        >
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="rgba(255,255,255,0.4)"
                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                            tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            tickFormatter={(str) => {
                                const date = new Date(str);
                                return `${date.getDate()}/${date.getMonth() + 1}`;
                            }}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.4)"
                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                            tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            domain={['auto', 'auto']}
                            ticks={getTicks()}
                            interval={0}
                        />
                        <Tooltip
                            contentStyle={chartTooltipStyle}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line
                            type="monotone"
                            dataKey="emission_hist"
                            stroke="#fb7185"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2, fill: '#fb7185', stroke: '#fff' }}
                            activeDot={{ r: 6 }}
                            name="Historical CO₂"
                            connectNulls
                        />
                        <Line
                            type="monotone"
                            dataKey="emission_pred"
                            stroke="#00ff9d"
                            strokeWidth={3}
                            dot={(props: any) => {
                                if (props.payload.is_connection) return <></>;
                                if (props.payload.emission_pred === null || props.payload.emission_pred === undefined) return <></>;
                                return <circle cx={props.cx} cy={props.cy} r={4} stroke="#fff" strokeWidth={2} fill="#00ff9d" />;
                            }}
                            activeDot={{ r: 6, fill: '#00ff9d', stroke: '#fff' }}
                            name="Predicted CO₂"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </ChartPanel>
    );
}
