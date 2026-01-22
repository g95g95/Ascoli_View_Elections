import type { ReactElement } from 'react';
import type { ChartData } from '../../types/chat';

interface DynamicChartProps {
  data: ChartData;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function DynamicChart({ data }: DynamicChartProps) {
  // Handle grouped-bar chart first (uses groupedData instead of data)
  if (data?.type === 'grouped-bar' && data.groupedData && data.groups) {
    const validGroupedData = data.groupedData.filter(d => d != null);
    if (validGroupedData.length === 0) {
      return (
        <div className="bg-white/90 backdrop-blur rounded-lg p-4 mt-3">
          <p className="text-sm text-gray-500">Nessun dato disponibile per il grafico</p>
        </div>
      );
    }

    const allValues = validGroupedData.flatMap(d => (d?.values ?? []).map(v => v ?? 0));
    const groupedMax = Math.max(...allValues, 1);

    return (
      <div className="bg-white/90 backdrop-blur rounded-lg p-4 mt-3">
        <h4 className="text-sm font-semibold mb-3 text-gray-800">{data.title}</h4>
        <div className="flex gap-2 mb-3">
          {data.groups.map((group, idx) => (
            <div key={group} className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
              <span>{group}</span>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {validGroupedData.map((item, itemIdx) => (
            <div key={item?.name || itemIdx}>
              <div className="text-xs mb-1 truncate" title={item?.name}>{item?.name || 'N/A'}</div>
              <div className="flex gap-1">
                {(item?.values ?? []).map((value, idx) => {
                  const safeValue = value ?? 0;
                  const percentage = (safeValue / groupedMax) * 100;
                  const color = item?.colors?.[idx] || COLORS[idx % COLORS.length];
                  return (
                    <div key={idx} className="flex-1">
                      <div className="h-5 bg-gray-200 rounded overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-500 flex items-center justify-end pr-1"
                          style={{ width: `${percentage}%`, backgroundColor: color }}
                        >
                          <span className="text-[9px] text-white font-medium">
                            {safeValue > 0 ? safeValue.toLocaleString('it-IT') : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Safety check for other chart types: ensure data.data exists and has valid values
  if (!data?.data || data.data.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur rounded-lg p-4 mt-3">
        <p className="text-sm text-gray-500">Nessun dato disponibile per il grafico</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.data.map(d => d?.value ?? 0), 1);
  const totalValue = data.data.reduce((sum, d) => sum + (d?.value ?? 0), 0);

  if (data.type === 'pie') {
    return (
      <div className="bg-white/90 backdrop-blur rounded-lg p-4 mt-3">
        <h4 className="text-sm font-semibold mb-3 text-gray-800">{data.title}</h4>
        <div className="space-y-2">
          {data.data.map((item, idx) => {
            const safeValue = item?.value ?? 0;
            const percentage = totalValue > 0 ? ((safeValue / totalValue) * 100).toFixed(1) : '0';
            const color = item?.color || COLORS[idx % COLORS.length];
            return (
              <div key={item?.name || idx} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="flex-1 text-sm truncate">{item?.name || 'N/A'}</span>
                <span className="text-sm font-medium">{percentage}%</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex justify-center">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {data.data.reduce((acc, item, idx) => {
                const safeValue = item?.value ?? 0;
                const percentage = totalValue > 0 ? (safeValue / totalValue) * 100 : 0;
                const color = item?.color || COLORS[idx % COLORS.length];
                const prevOffset = acc.offset;
                const circumference = 2 * Math.PI * 40;
                const dashLength = (percentage / 100) * circumference;

                acc.elements.push(
                  <circle
                    key={item?.name || idx}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={color}
                    strokeWidth="20"
                    strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                    strokeDashoffset={-prevOffset}
                  />
                );
                acc.offset += dashLength;
                return acc;
              }, { elements: [] as ReactElement[], offset: 0 }).elements}
            </svg>
          </div>
        </div>
      </div>
    );
  }

  if (data.type === 'line') {
    const width = 280;
    const height = 150;
    const padding = 30;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data.data.map((item, idx) => ({
      x: padding + (idx / Math.max(data.data.length - 1, 1)) * chartWidth,
      y: height - padding - ((item?.value ?? 0) / maxValue) * chartHeight
    }));

    const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

    return (
      <div className="bg-white/90 backdrop-blur rounded-lg p-4 mt-3">
        <h4 className="text-sm font-semibold mb-3 text-gray-800">{data.title}</h4>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e7eb" strokeWidth="1" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e5e7eb" strokeWidth="1" />
          <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" />
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="4" fill="#3b82f6" />
              <text x={p.x} y={height - 10} textAnchor="middle" className="text-[8px] fill-gray-500">
                {(data.data[idx]?.name || '').substring(0, 5)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur rounded-lg p-4 mt-3">
      <h4 className="text-sm font-semibold mb-3 text-gray-800">{data.title}</h4>
      <div className="space-y-2">
        {data.data.map((item, idx) => {
          const safeValue = item?.value ?? 0;
          const percentage = (safeValue / maxValue) * 100;
          const color = item?.color || COLORS[idx % COLORS.length];
          return (
            <div key={item?.name || idx}>
              <div className="flex justify-between text-xs mb-1">
                <span className="truncate max-w-[150px]" title={item?.name}>{item?.name || 'N/A'}</span>
                <span className="font-medium">{safeValue.toLocaleString('it-IT')}</span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {data.yAxisLabel && (
        <p className="text-xs text-gray-500 mt-2 text-right">{data.yAxisLabel}</p>
      )}
    </div>
  );
}
