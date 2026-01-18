import { useEffect, useState, useRef } from 'react';
import { CONSOLIDATED_SECTION_ID, CONSOLIDATED_SECTIONS } from '../../types/elections';

interface SectionMapping {
  id: number;
  sede: string;
  indirizzo: string;
  consolidata?: boolean;
}

interface DensityData {
  sectionId: number;
  value: number;
  percentage: number;
}

interface SectionMapProps {
  selectedSection?: number;
  onSectionClick?: (sectionId: number) => void;
  highlightedSections?: number[];
  densityData?: DensityData[];
  densityColor?: string; // Base color for density (hex)
  showLegend?: boolean;
  legendLabel?: string;
  maxPercentage?: number; // Max percentage for normalization (if not provided, uses 100)
}

function hexToHsl(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [220, 70, 50];

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function getDensityColor(normalizedValue: number, baseColor: string): string {
  const [h, s] = hexToHsl(baseColor);
  // Map normalized value 0-1 to lightness 90-30 (lighter for lower, darker for higher)
  const l = 90 - (normalizedValue * 60);
  return `hsl(${h}, ${s}%, ${Math.max(30, Math.min(90, l))}%)`;
}

export function SectionMap({
  selectedSection,
  onSectionClick,
  highlightedSections = [],
  densityData,
  densityColor = '#3b82f6',
  showLegend = false,
  legendLabel = 'Percentuale',
  maxPercentage,
}: SectionMapProps) {
  // Calculate max percentage from data if not provided
  const effectiveMax = maxPercentage ?? (densityData && densityData.length > 0
    ? Math.max(...densityData.map(d => d.percentage))
    : 100);
  const [svgContent, setSvgContent] = useState<string>('');
  const [sectionMapping, setSectionMapping] = useState<SectionMapping[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.max(0.5, Math.min(3, z + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start panning if clicking on the background, not on sections
    const target = e.target as HTMLElement;
    if (zoom > 1 && !target.classList.contains('sezione')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  useEffect(() => {
    fetch('/ascoli-sections.svg')
      .then((res) => res.text())
      .then((text) => setSvgContent(text))
      .catch(console.error);

    fetch('/data/section_mapping.json')
      .then((res) => res.json())
      .then((data) => setSectionMapping(data.sezioni))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!svgContent || !containerRef.current) return;

    const container = containerRef.current;
    const paths = container.querySelectorAll('path.sezione, polygon.sezione');

    paths.forEach((path) => {
      const sectionAttr = path.getAttribute('data-sezione');
      if (!sectionAttr) return;
      const sectionId = parseInt(sectionAttr, 10);
      const elem = path as SVGElement;

      // Reset styles
      elem.style.fill = '';
      elem.classList.remove('selected', 'highlighted');

      // Apply density coloring with normalization
      if (densityData && densityData.length > 0) {
        const data = densityData.find((d) => d.sectionId === sectionId);
        if (data) {
          const normalizedValue = effectiveMax > 0 ? data.percentage / effectiveMax : 0;
          elem.style.fill = getDensityColor(normalizedValue, densityColor);
        } else {
          elem.style.fill = '#e5e7eb';
        }
      }

      // Apply selection state
      if (sectionId === selectedSection) {
        elem.classList.add('selected');
        elem.style.stroke = '#1f2937';
        elem.style.strokeWidth = '3';
      } else {
        elem.style.stroke = '';
        elem.style.strokeWidth = '';
      }

      // Apply highlighted state (for consolidated sections)
      if (highlightedSections.includes(sectionId)) {
        elem.classList.add('highlighted');
        elem.style.stroke = '#f59e0b';
        elem.style.strokeWidth = '2';
      }

      // Remove old listeners and add new one
      const newPath = elem.cloneNode(true) as SVGElement;
      newPath.addEventListener('click', () => {
        if (onSectionClick) {
          onSectionClick(sectionId);
        }
      });
      elem.parentNode?.replaceChild(newPath, elem);
    });
  }, [svgContent, selectedSection, densityData, densityColor, highlightedSections, onSectionClick, effectiveMax]);

  const selectedSectionInfo = selectedSection
    ? sectionMapping.find((s) => s.id === selectedSection)
    : null;

  // For consolidated section 53, show special info
  const isConsolidated = selectedSection === CONSOLIDATED_SECTION_ID;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Mappa Sezioni Elettorali</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold"
            title="Zoom out"
          >
            −
          </button>
          <button
            onClick={handleResetZoom}
            className="px-2 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs"
            title="Reset zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold"
            title="Zoom in"
          >
            +
          </button>
        </div>
      </div>

      {showLegend && densityData && densityData.length > 0 && (
        <div className="mb-3 flex items-center gap-2 text-xs">
          <span className="text-gray-500">{legendLabel}:</span>
          <div className="flex items-center">
            <div
              className="w-16 h-3 rounded"
              style={{
                background: `linear-gradient(to right, ${getDensityColor(0, densityColor)}, ${getDensityColor(0.5, densityColor)}, ${getDensityColor(1, densityColor)})`
              }}
            />
          </div>
          <span className="text-gray-400">0%</span>
          <span className="text-gray-400">→</span>
          <span className="text-gray-600 font-medium">{effectiveMax.toFixed(1)}%</span>
        </div>
      )}

      <div
        className="w-full overflow-hidden max-h-[400px] border border-gray-100 rounded-lg"
        style={{ minHeight: '250px', cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          ref={containerRef}
          className="w-full h-full"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
          }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>

      {selectedSection && (
        <div className={`mt-3 p-3 rounded-lg text-sm ${isConsolidated ? 'bg-amber-50' : 'bg-blue-50'}`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="font-medium">Sezione </span>
              <span className={`font-bold ${isConsolidated ? 'text-amber-700' : 'text-blue-700'}`}>
                {selectedSection}
                {isConsolidated && ' (Consolidata)'}
              </span>
            </div>
          </div>
          {selectedSectionInfo && (
            <div className="mt-1 text-gray-600">
              <div className="font-medium">{selectedSectionInfo.sede}</div>
              <div className="text-xs">{selectedSectionInfo.indirizzo}</div>
            </div>
          )}
          {isConsolidated && (
            <div className="mt-1 text-xs text-amber-700">
              Include sezioni: {CONSOLIDATED_SECTIONS.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
