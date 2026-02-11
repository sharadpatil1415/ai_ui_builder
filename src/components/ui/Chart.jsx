import React from 'react';

const CHART_COLORS = [
    'var(--color-primary-500)',
    'var(--color-success)',
    'var(--color-warning)',
    'var(--color-danger)',
    'var(--color-info)',
    'var(--color-primary-300)',
    '#a78bfa',
    '#f472b6',
];

const BarChart = ({ data, height = 200 }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="ui-chart__container" style={{ height }}>
            {data.map((item, i) => (
                <div key={i} className="ui-chart__bar-group" style={{ height: '100%' }}>
                    <span className="ui-chart__bar-value">{item.value}</span>
                    <div
                        className="ui-chart__bar"
                        style={{ height: `${(item.value / max) * 100}%` }}
                    />
                    <span className="ui-chart__bar-label">{item.label}</span>
                </div>
            ))}
        </div>
    );
};

const PieChart = ({ data }) => {
    const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
    let cumulative = 0;
    const segments = data.map((d, i) => {
        const start = cumulative;
        cumulative += (d.value / total) * 360;
        return { ...d, start, end: cumulative, color: CHART_COLORS[i % CHART_COLORS.length] };
    });

    const gradient = segments
        .map(s => `${s.color} ${s.start}deg ${s.end}deg`)
        .join(', ');

    return (
        <div className="ui-chart__pie-container">
            <div
                className="ui-chart__pie"
                style={{ background: `conic-gradient(${gradient})` }}
            />
            <div className="ui-chart__legend">
                {segments.map((s, i) => (
                    <div key={i} className="ui-chart__legend-item">
                        <div className="ui-chart__legend-dot" style={{ background: s.color }} />
                        <span>{s.label}: {s.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LineChart = ({ data, height = 200 }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    const padding = 20;
    const w = 400;
    const h = height;

    const points = data.map((d, i) => ({
        x: padding + (i / (data.length - 1 || 1)) * (w - padding * 2),
        y: h - padding - ((d.value / max) * (h - padding * 2)),
    }));

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${h - padding} L ${points[0].x} ${h - padding} Z`;

    return (
        <div className="ui-chart__line-container">
            <svg className="ui-chart__line-svg" viewBox={`0 0 ${w} ${h}`} style={{ height }}>
                <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary-500)" />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                </defs>
                <path className="ui-chart__line-area" d={areaD} />
                <path className="ui-chart__line-path" d={pathD} />
                {points.map((p, i) => (
                    <circle key={i} className="ui-chart__line-dot" cx={p.x} cy={p.y} r={4} />
                ))}
            </svg>
            <div className="ui-chart__line-labels">
                {data.map((d, i) => (
                    <span key={i} className="ui-chart__line-label">{d.label}</span>
                ))}
            </div>
        </div>
    );
};

const Chart = ({ type = 'bar', data = [], title, height = 200 }) => {
    return (
        <div className="ui-chart">
            {title && <div className="ui-chart__title">{title}</div>}
            {type === 'bar' && <BarChart data={data} height={height} />}
            {type === 'pie' && <PieChart data={data} />}
            {type === 'line' && <LineChart data={data} height={height} />}
        </div>
    );
};

export default Chart;
