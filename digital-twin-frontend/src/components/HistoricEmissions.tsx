import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { History } from 'lucide-react';
import type { MonthlyData } from '../types';
import { ChartPanel, chartTooltipStyle } from './ChartPanel';

export function HistoricEmissions() {
    const [data, setData] = useState<MonthlyData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistoricData();
    }, []);

    const fetchHistoricData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/emission/history/monthly`);
            const result = await response.json();
            if (result.status === 'success') {
                setData(result.data);
            }
        } catch (e) {
            console.error("Historic data error:", e);
        } finally {
            setLoading(false);
        }
    };

    const formatMonth = (month: string) => {
        const [year, m] = month.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[parseInt(m) - 1]} ${year.slice(2)}`;
    };

    const getEmissionTicks = () => {
        if (data.length === 0) return [];
        const emissions = data.map(d => d.total_emissions);
        const min = Math.floor(Math.min(...emissions) / 5) * 5;
        const max = Math.ceil(Math.max(...emissions) / 5) * 5;
        const ticks = [];
        for (let i = min; i <= max; i += 5) {
            ticks.push(i);
        }
        return ticks;
    };

    const getAqiTicks = () => {
        if (data.length === 0) return [];
        const aqiValues = data.map(d => d.aqi);
        const min = Math.floor(Math.min(...aqiValues) / 50) * 50;
        const max = Math.ceil(Math.max(...aqiValues) / 50) * 50;
        const ticks = [];
        for (let i = min; i <= max; i += 50) {
            ticks.push(i);
        }
        return ticks;
    };

    const historicTooltipStyle: React.CSSProperties = {
        ...chartTooltipStyle,
        borderRadius: '8px',
        fontSize: '12px',
    };

    const statsFooter = data.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Data Range</div>
                <div className="text-sm font-bold text-white">
                    {formatMonth(data[0].month)} - {formatMonth(data[data.length - 1].month)}
                </div>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Avg Emissions</div>
                <div className="text-sm font-bold text-rose-400">
                    {(data.reduce((sum, d) => sum + d.total_emissions, 0) / data.length).toFixed(1)} kt
                </div>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Avg AQI</div>
                <div className="text-sm font-bold text-purple-400">
                    {Math.round(data.reduce((sum, d) => sum + d.aqi, 0) / data.length)}
                </div>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Total Months</div>
                <div className="text-sm font-bold text-white">{data.length}</div>
            </div>
        </div>
    ) : undefined;

    return (
        <ChartPanel
            title="Historic Monthly Trends (2019-2025)"
            icon={<History className="w-5 h-5 text-amber-400" />}
            loading={loading}
            loadingText="Loading Historic Data..."
            footer={statsFooter}
            className="mt-6"
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* CO2 Emissions Chart */}
                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-rose-300 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                            CO₂ Emissions
                            <span className="ml-2 opacity-50 text-xs">kt</span>
                        </h4>
                    </div>
                    <div className="h-[250px] w-full bg-white/[0.02] rounded-xl border border-white/5 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    stroke="rgba(255,255,255,0.2)"
                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={formatMonth}
                                    interval={Math.floor(data.length / 6)}
                                />
                                <YAxis
                                    stroke="rgba(255,255,255,0.2)"
                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={['auto', 'auto']}
                                    ticks={getEmissionTicks()}
                                />
                                <Tooltip
                                    contentStyle={historicTooltipStyle}
                                    itemStyle={{ color: '#fff' }}
                                    labelFormatter={(label) => formatMonth(label)}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="total_emissions"
                                    stroke="#fb7185"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 4, fill: '#fb7185', stroke: '#fff', strokeWidth: 2 }}
                                    name="CO₂"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AQI Chart */}
                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                            Air Quality Index (AQI)
                        </h4>
                    </div>
                    <div className="h-[250px] w-full bg-white/[0.02] rounded-xl border border-white/5 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    stroke="rgba(255,255,255,0.2)"
                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={formatMonth}
                                    interval={Math.floor(data.length / 6)}
                                />
                                <YAxis
                                    stroke="rgba(255,255,255,0.2)"
                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={['auto', 'auto']}
                                    ticks={getAqiTicks()}
                                />
                                <Tooltip
                                    contentStyle={historicTooltipStyle}
                                    itemStyle={{ color: '#fff' }}
                                    labelFormatter={(label) => formatMonth(label)}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="aqi"
                                    stroke="#a855f7"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 4, fill: '#a855f7', stroke: '#fff', strokeWidth: 2 }}
                                    name="AQI"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </ChartPanel>
    );
}
