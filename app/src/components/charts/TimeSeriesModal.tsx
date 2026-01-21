import { useMemo, useState } from 'react';
import type { ElectionArchive } from '../../lib/dataLoader';
import type { ElectionType } from '../../types/elections';

interface TimeSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  archive: ElectionArchive;
  currentElectionType: ElectionType;
  selectedItem: {
    type: 'party' | 'candidate';
    name: string;
    party?: string;
  } | null;
  sectionId?: number;
  availableSections?: number[];
  onSectionChange?: (sectionId: number) => void;
}

interface TrendDataPoint {
  year: number;
  label: string;
  value: number;
  percentage?: number;
  electionId: string;
  matchedName?: string;
}

type TabType = 'confronto' | 'andamento';

function namesMatch(name1: string, name2: string): boolean {
  const normalize = (s: string) => s.toUpperCase().trim();
  const n1 = normalize(name1);
  const n2 = normalize(name2);

  if (n1 === n2) return true;

  const getWords = (s: string) => s.split(/\s+/).filter(w => w.length > 2);
  const words1 = getWords(n1);
  const words2 = getWords(n2);

  if (words1.length < 2 || words2.length < 2) {
    return n1.includes(n2) || n2.includes(n1);
  }

  const matchCount = words1.filter(w1 =>
    words2.some(w2 => w1 === w2 || w1.includes(w2) || w2.includes(w1))
  ).length;

  return matchCount >= 2;
}

// Simple SVG Line Chart Component
function LineChart({ data, maxValue }: { data: TrendDataPoint[]; maxValue: number }) {
  if (data.length < 2) return null;

  const width = 500;
  const height = 250;
  const padding = { top: 30, right: 30, bottom: 50, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minYear = Math.min(...data.map(d => d.year));
  const maxYear = Math.max(...data.map(d => d.year));
  const yearRange = maxYear - minYear || 1;

  const getX = (year: number) => padding.left + ((year - minYear) / yearRange) * chartWidth;
  const getY = (value: number) => padding.top + chartHeight - (value / maxValue) * chartHeight;

  const linePath = data.map((point, idx) => {
    const x = getX(point.year);
    const y = getY(point.value);
    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const areaPath = `${linePath} L ${getX(data[data.length - 1].year)} ${padding.top + chartHeight} L ${getX(data[0].year)} ${padding.top + chartHeight} Z`;

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(pct => Math.round(maxValue * pct));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {/* Grid lines */}
      {yTicks.map((tick, idx) => (
        <g key={idx}>
          <line
            x1={padding.left}
            y1={getY(tick)}
            x2={width - padding.right}
            y2={getY(tick)}
            stroke="#e5e7eb"
            strokeDasharray="4,4"
          />
          <text
            x={padding.left - 10}
            y={getY(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            className="fill-gray-500 text-xs"
          >
            {tick.toLocaleString('it-IT')}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path
        d={areaPath}
        fill="url(#areaGradient)"
        opacity="0.3"
      />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {data.map((point, idx) => {
        const x = getX(point.year);
        const y = getY(point.value);
        const isLast = idx === data.length - 1;

        return (
          <g key={point.electionId}>
            {/* Outer circle (glow effect) */}
            <circle
              cx={x}
              cy={y}
              r={isLast ? 10 : 8}
              fill={isLast ? '#3b82f6' : '#6b7280'}
              opacity="0.2"
            />
            {/* Inner circle */}
            <circle
              cx={x}
              cy={y}
              r={isLast ? 6 : 5}
              fill={isLast ? '#3b82f6' : '#6b7280'}
              stroke="white"
              strokeWidth="2"
            />
            {/* Year label */}
            <text
              x={x}
              y={height - 15}
              textAnchor="middle"
              className="fill-gray-700 text-xs font-medium"
            >
              {point.year}
            </text>
            {/* Value label */}
            <text
              x={x}
              y={y - 15}
              textAnchor="middle"
              className={`text-xs font-bold ${isLast ? 'fill-blue-600' : 'fill-gray-600'}`}
            >
              {point.value.toLocaleString('it-IT')}
            </text>
          </g>
        );
      })}

      {/* Gradient definition */}
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function TimeSeriesModal({
  isOpen,
  onClose,
  archive,
  currentElectionType,
  selectedItem,
  sectionId,
  availableSections,
  onSectionChange,
}: TimeSeriesModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('confronto');

  const currentSectionIndex = availableSections?.findIndex(s =>
    (sectionId === undefined && s === 0) || s === sectionId
  ) ?? -1;

  const canGoPrev = availableSections && currentSectionIndex > 0;
  const canGoNext = availableSections && currentSectionIndex < availableSections.length - 1;

  const handlePrevSection = () => {
    if (canGoPrev && onSectionChange && availableSections) {
      onSectionChange(availableSections[currentSectionIndex - 1]);
    }
  };

  const handleNextSection = () => {
    if (canGoNext && onSectionChange && availableSections) {
      onSectionChange(availableSections[currentSectionIndex + 1]);
    }
  };

  const getSectionLabel = (secId: number | undefined) => {
    if (secId === undefined || secId === 0) return 'Globale';
    if (secId === 53) return 'Sez. 53 (Centro)';
    return `Sezione ${secId}`;
  };

  const trendData = useMemo(() => {
    if (!selectedItem || !archive) return [];

    const data: TrendDataPoint[] = [];
    const normalizedName = selectedItem.name.toUpperCase().trim();

    const sameTypeElections = Object.values(archive.elections).filter(
      (e) => e.config.type === currentElectionType
    );

    for (const election of sameTypeElections) {
      let value = 0;
      let percentage: number | undefined;
      let found = false;
      let matchedCandidateName = '';

      if (selectedItem.type === 'party') {
        if (election.liste?.liste) {
          const party = election.liste.liste.find((l) => {
            const partyName = l.nome.toUpperCase().trim();
            return (
              partyName === normalizedName ||
              partyName.includes(normalizedName) ||
              normalizedName.includes(partyName)
            );
          });

          if (party) {
            if (sectionId) {
              // Section-specific mode: only use section data if available
              if (party.sezioni && party.sezioni[sectionId.toString()] !== undefined) {
                value = party.sezioni[sectionId.toString()] || 0;
                const totalSection = election.liste.liste.reduce(
                  (s, l) => s + (l.sezioni?.[sectionId.toString()] || 0),
                  0
                );
                percentage = totalSection > 0 ? (value / totalSection) * 100 : 0;
                found = true;
              }
              // If section data not available, skip this election (don't fall back to totals)
            } else {
              // No section filter: use totals
              value = party.totale;
              const total = election.liste.liste.reduce((s, l) => s + l.totale, 0);
              percentage = total > 0 ? (party.totale / total) * 100 : 0;
              found = true;
            }
          }
        }

        if (!found && election.liste?.sezioni) {
          const firstSection = Object.values(election.liste.sezioni)[0];
          if (firstSection?.voti?.[normalizedName] !== undefined) {
            if (sectionId) {
              // Section-specific mode
              const sectionData = election.liste.sezioni[sectionId.toString()];
              if (sectionData && sectionData.voti[normalizedName] !== undefined) {
                value = sectionData.voti[normalizedName] || 0;
                const totalSection = Object.values(sectionData.voti).reduce((s, v) => s + v, 0);
                percentage = totalSection > 0 ? (value / totalSection) * 100 : 0;
                found = true;
              }
              // If section data not available, skip this election
            } else {
              // No section filter: aggregate all sections
              value = Object.values(election.liste.sezioni).reduce(
                (s, sec) => s + (sec.voti[normalizedName] || 0),
                0
              );
              found = true;
            }
          }
        }

        if (!found && election.preferenze?.liste) {
          const party = election.preferenze.liste.find((l) => {
            const partyName = l.nome.toUpperCase().trim();
            return (
              partyName === normalizedName ||
              partyName.includes(normalizedName) ||
              normalizedName.includes(partyName)
            );
          });

          if (party) {
            if (sectionId) {
              // Section-specific mode: check if any candidate has section data
              const hasSectionData = party.candidati.some(
                (c) => c.sezioni && c.sezioni[sectionId.toString()] !== undefined
              );
              if (hasSectionData) {
                value = party.candidati.reduce(
                  (s, c) => s + (c.sezioni?.[sectionId.toString()] || 0),
                  0
                );
                found = true;
              }
              // If section data not available, skip this election
            } else {
              value = party.candidati.reduce((s, c) => s + c.totale, 0);
              found = true;
            }
          }
        }

        if (!found && election.coalizioni?.liste) {
          const party = election.coalizioni.liste.find((l) => {
            const partyName = l.nome.toUpperCase().trim();
            return (
              partyName === normalizedName ||
              partyName.includes(normalizedName) ||
              normalizedName.includes(partyName)
            );
          });

          if (party) {
            if (sectionId) {
              // Section-specific mode: only use if section data exists
              if (party.sezioni && party.sezioni[sectionId.toString()] !== undefined) {
                value = party.sezioni[sectionId.toString()] || 0;
                found = true;
              }
              // If section data not available, skip this election
            } else {
              value = party.totale;
              found = true;
            }
          }
        }
      } else {
        if (election.preferenze?.liste) {
          for (const party of election.preferenze.liste) {
            const candidate = party.candidati.find((c) => namesMatch(c.nome, selectedItem.name));

            if (candidate) {
              matchedCandidateName = candidate.nome;
              if (sectionId) {
                // Section-specific mode: only use if section data exists
                if (candidate.sezioni && candidate.sezioni[sectionId.toString()] !== undefined) {
                  value = candidate.sezioni[sectionId.toString()] || 0;
                  found = true;
                }
                // If section data not available, skip this election
              } else {
                value = candidate.totale;
                found = true;
              }
              break;
            }
          }
        }

        if (!found && election.nominali?.candidati) {
          const candidate = election.nominali.candidati.find((c) => namesMatch(c.nome, selectedItem.name));
          if (candidate) {
            matchedCandidateName = candidate.nome;
            if (sectionId) {
              // Section-specific mode: only use if section data exists
              if (candidate.sezioni && candidate.sezioni[sectionId.toString()] !== undefined) {
                value = candidate.sezioni[sectionId.toString()] || 0;
                found = true;
              }
              // If section data not available, skip this election
            } else {
              value = candidate.totale;
              found = true;
            }
          }
        }

        if (!found && election.primoTurno?.candidati) {
          const candidate = election.primoTurno.candidati.find((c) => namesMatch(c.nome, selectedItem.name));
          if (candidate) {
            matchedCandidateName = candidate.nome;
            if (sectionId) {
              // Section-specific mode: only use if section data exists
              if (candidate.sezioni && candidate.sezioni[sectionId.toString()] !== undefined) {
                value = candidate.sezioni[sectionId.toString()] || 0;
                found = true;
              }
              // If section data not available, skip this election
            } else {
              value = candidate.totale;
              found = true;
            }
          }
        }

        if (!found && election.ballottaggio?.candidati) {
          const candidate = election.ballottaggio.candidati.find((c) => namesMatch(c.nome, selectedItem.name));
          if (candidate) {
            matchedCandidateName = candidate.nome;
            if (sectionId) {
              // Section-specific mode: only use if section data exists
              if (candidate.sezioni && candidate.sezioni[sectionId.toString()] !== undefined) {
                value = candidate.sezioni[sectionId.toString()] || 0;
                found = true;
              }
              // If section data not available, skip this election
            } else {
              value = candidate.totale;
              found = true;
            }
          }
        }
      }

      if (found && value > 0) {
        data.push({
          year: election.config.year,
          label: election.config.label,
          value,
          percentage,
          electionId: election.config.id,
          matchedName: matchedCandidateName || undefined,
        });
      }
    }

    return data.sort((a, b) => a.year - b.year);
  }, [archive, currentElectionType, selectedItem, sectionId]);

  if (!isOpen || !selectedItem) return null;

  const maxValue = Math.max(...trendData.map((d) => d.value), 1);

  const getElectionTypeLabel = (type: ElectionType) => {
    switch (type) {
      case 'comunali':
        return 'Comunali';
      case 'europee':
        return 'Europee';
      case 'regionali':
        return 'Regionali';
      case 'politiche':
        return 'Politiche';
      default:
        return type;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
          <div>
            <h2 className="text-lg font-bold text-white">
              {selectedItem.type === 'party' ? '📊 Trend Lista' : '👤 Trend Candidato'}
            </h2>
            <p className="text-blue-100 text-sm mt-0.5">
              {selectedItem.name}
              {selectedItem.party && ` (${selectedItem.party})`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Info badge with section navigation */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">ℹ️</span>
                <span>
                  Confronto tra elezioni <strong>{getElectionTypeLabel(currentElectionType)}</strong>
                  <span className="ml-1">
                    - <strong>{getSectionLabel(sectionId)}</strong>
                  </span>
                </span>
              </div>
              {availableSections && onSectionChange && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevSection}
                    disabled={!canGoPrev}
                    className={`p-1.5 rounded-lg transition-colors ${
                      canGoPrev
                        ? 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    title="Sezione precedente"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="px-2 text-xs font-medium text-blue-600 min-w-[60px] text-center">
                    {currentSectionIndex + 1}/{availableSections.length}
                  </span>
                  <button
                    onClick={handleNextSection}
                    disabled={!canGoNext}
                    className={`p-1.5 rounded-lg transition-colors ${
                      canGoNext
                        ? 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    title="Sezione successiva"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {trendData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-medium">Nessun dato trovato</p>
              <p className="text-sm mt-1">
                {selectedItem.name} non è presente in altre elezioni{' '}
                {getElectionTypeLabel(currentElectionType)}
              </p>
            </div>
          ) : trendData.length === 1 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📍</div>
              <p className="font-medium text-gray-700">Solo 1 elezione disponibile</p>
              <div className="mt-4 p-4 bg-gray-50 rounded-xl inline-block">
                <div className="text-2xl font-bold text-blue-600">
                  {trendData[0].value.toLocaleString('it-IT')}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {trendData[0].label}
                  {trendData[0].percentage !== undefined && (
                    <span className="ml-2 text-blue-500">
                      ({trendData[0].percentage.toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Navigation */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab('confronto')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'confronto'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📊 Confronto
                </button>
                <button
                  onClick={() => setActiveTab('andamento')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'andamento'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📈 Andamento
                </button>
              </div>

              {/* Bar Chart (Confronto) */}
              {activeTab === 'confronto' && (
                <div className="space-y-3">
                  {trendData.map((point, idx) => {
                    const barWidth = (point.value / maxValue) * 100;
                    const prevValue = idx > 0 ? trendData[idx - 1].value : null;
                    const change = prevValue !== null ? point.value - prevValue : null;
                    const changePercent = prevValue && prevValue > 0
                      ? ((point.value - prevValue) / prevValue) * 100
                      : null;

                    return (
                      <div key={point.electionId} className="group">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{point.year}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">
                              {point.value.toLocaleString('it-IT')} voti
                            </span>
                            {point.percentage !== undefined && (
                              <span className="text-blue-600 text-xs">
                                ({point.percentage.toFixed(1)}%)
                              </span>
                            )}
                            {change !== null && (
                              <span
                                className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                  change > 0
                                    ? 'bg-green-100 text-green-700'
                                    : change < 0
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {change > 0 ? '+' : ''}
                                {change.toLocaleString('it-IT')}
                                {changePercent !== null && (
                                  <span className="ml-1">
                                    ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%)
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                          <div
                            className={`h-full rounded-lg transition-all duration-500 ${
                              idx === trendData.length - 1
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                : 'bg-gradient-to-r from-gray-400 to-gray-500'
                            }`}
                            style={{ width: `${barWidth}%` }}
                          />
                          <div className="absolute inset-0 flex items-center px-3">
                            <span className="text-xs text-white font-medium drop-shadow">
                              {point.label}
                              {point.matchedName && point.matchedName.toUpperCase() !== selectedItem.name.toUpperCase() && (
                                <span className="ml-2 opacity-80">({point.matchedName})</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Line Chart (Andamento) */}
              {activeTab === 'andamento' && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <LineChart data={trendData} maxValue={maxValue * 1.1} />
                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap gap-3 justify-center text-xs">
                    {trendData.map((point, idx) => (
                      <div key={point.electionId} className="flex items-center gap-1.5">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            idx === trendData.length - 1 ? 'bg-blue-500' : 'bg-gray-400'
                          }`}
                        />
                        <span className="text-gray-600">
                          {point.year}: <strong>{point.value.toLocaleString('it-IT')}</strong>
                          {point.matchedName && point.matchedName.toUpperCase() !== selectedItem.name.toUpperCase() && (
                            <span className="text-gray-400 ml-1">({point.matchedName})</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary Stats */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl text-center">
                  <div className="text-xs text-gray-500 mb-1">Media</div>
                  <div className="font-bold text-gray-900">
                    {Math.round(
                      trendData.reduce((s, d) => s + d.value, 0) / trendData.length
                    ).toLocaleString('it-IT')}
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-xl text-center">
                  <div className="text-xs text-green-600 mb-1">Max</div>
                  <div className="font-bold text-green-700">
                    {Math.max(...trendData.map((d) => d.value)).toLocaleString('it-IT')}
                    <span className="text-xs font-normal ml-1">
                      ({trendData.find((d) => d.value === Math.max(...trendData.map((x) => x.value)))?.year})
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-red-50 rounded-xl text-center">
                  <div className="text-xs text-red-600 mb-1">Min</div>
                  <div className="font-bold text-red-700">
                    {Math.min(...trendData.map((d) => d.value)).toLocaleString('it-IT')}
                    <span className="text-xs font-normal ml-1">
                      ({trendData.find((d) => d.value === Math.min(...trendData.map((x) => x.value)))?.year})
                    </span>
                  </div>
                </div>
              </div>

              {/* Overall trend indicator */}
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Variazione {trendData[0].year} → {trendData[trendData.length - 1].year}
                  </span>
                  {(() => {
                    const first = trendData[0].value;
                    const last = trendData[trendData.length - 1].value;
                    const totalChange = last - first;
                    const totalChangePercent = first > 0 ? ((last - first) / first) * 100 : 0;
                    const isPositive = totalChange > 0;

                    return (
                      <span
                        className={`font-bold ${
                          isPositive ? 'text-green-600' : totalChange < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}
                      >
                        {isPositive ? '📈 +' : totalChange < 0 ? '📉 ' : ''}
                        {totalChange.toLocaleString('it-IT')} voti
                        <span className="text-sm font-normal ml-1">
                          ({totalChangePercent > 0 ? '+' : ''}{totalChangePercent.toFixed(1)}%)
                        </span>
                      </span>
                    );
                  })()}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors font-medium"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
