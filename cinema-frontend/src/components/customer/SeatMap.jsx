import { useMemo, useState, useRef, useCallback } from "react";
import {
  ZoomIn, ZoomOut, RotateCcw, Maximize2,
} from "lucide-react";

// ── SVG SEAT SHAPES ─────────────────────────────────────────────────
const SEAT_SIZE    = 36;
const SEAT_GAP     = 6;
const COUPLE_W     = SEAT_SIZE * 2 + SEAT_GAP;
const ROW_LABEL_W  = 28;
const PADDING      = 20;

const SEAT_THEMES = {
  regular: {
    available: { fill: "#2a2a2a", stroke: "#555",    hoverFill: "#3a3a3a" },
    selected:  { fill: "#E50914", stroke: "#ff333a", glow: "rgba(229,9,20,0.5)" },
    booked:    { fill: "#1a1a1a", stroke: "#333" },
    locked:    { fill: "#1a1a1a", stroke: "#333" },
    maintenance: { fill: "#1a1a1a", stroke: "#444" },
  },
  vip: {
    available: { fill: "#4a1515", stroke: "#8a2222", hoverFill: "#6a1a1a" },
    selected:  { fill: "#E50914", stroke: "#ff333a", glow: "rgba(229,9,20,0.5)" },
    booked:    { fill: "#1a1a1a", stroke: "#333" },
    locked:    { fill: "#1a1a1a", stroke: "#333" },
    maintenance: { fill: "#1a1a1a", stroke: "#444" },
  },
  couple: {
    available: { fill: "#4a153a", stroke: "#8a2266", hoverFill: "#6a1a52" },
    selected:  { fill: "#E50914", stroke: "#ff333a", glow: "rgba(229,9,20,0.5)" },
    booked:    { fill: "#1a1a1a", stroke: "#333" },
    locked:    { fill: "#1a1a1a", stroke: "#333" },
    maintenance: { fill: "#1a1a1a", stroke: "#444" },
  },
};

// Single seat SVG shape (rounded top like cinema seats)
function SeatShape({ x, y, w, h, fill, stroke, rx = 6 }) {
  // Top-rounded rectangle: rounded on top, flat on bottom
  const r = Math.min(rx, w / 2, h / 2);
  const d = `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h} Z`;
  return <path d={d} fill={fill} stroke={stroke} strokeWidth={1.5} />;
}

// ── MAIN COMPONENT ──────────────────────────────────────────────────
export default function SeatMap({
  seats,
  bookedIds = [],
  lockedIds = [],
  selectedSeats = [],
  onSeatSelect,
  onSeatDoubleClick,
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);
  const containerRef = useRef(null);

  // ── Build seat grid ────────────────────────────────────────────
  const { grid, sortedRows, maxCols, svgW, svgH } = useMemo(() => {
    const g = {};
    let maxC = 0;
    seats.forEach(seat => {
      if (!g[seat.row]) g[seat.row] = [];
      g[seat.row].push(seat);
    });
    const sorted = Object.keys(g).sort();
    sorted.forEach(row => {
      g[row].sort((a, b) => a.column - b.column);
      maxC = Math.max(maxC, g[row].length);
      // Count effective columns (couple = 2 columns wide)
    });

    // Calculate SVG dimensions
    const colWidth = SEAT_SIZE + SEAT_GAP;
    const rowHeight = SEAT_SIZE + SEAT_GAP;
    const contentW = maxC * colWidth + ROW_LABEL_W * 2 + PADDING * 2;
    const contentH = sorted.length * rowHeight + PADDING * 2 + 60; // +60 for screen

    return { grid: g, sortedRows: sorted, maxCols: maxC, svgW: contentW, svgH: contentH };
  }, [seats]);

  // ── Seat status ────────────────────────────────────────────────
  const getSeatStatus = useCallback((seat) => {
    if (seat.status === "maintenance") return "maintenance";
    if (selectedSeats.some(s => s.id === seat.id)) return "selected";
    if (bookedIds.includes(seat.id)) return "booked";
    if (lockedIds.includes(seat.id)) return "locked";
    return "available";
  }, [selectedSeats, bookedIds, lockedIds]);

  // ── Zoom/Pan handlers ──────────────────────────────────────────
  const handleZoomIn  = () => setZoom(z => Math.min(z + 0.2, 2.0));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.4));
  const handleReset   = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  const handleFit     = () => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const fitZoom = Math.min(cw / svgW, 1.2);
    setZoom(fitZoom);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom(z => Math.min(Math.max(z - e.deltaY * 0.001, 0.4), 2.0));
    }
  };

  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    // Only pan on background click (not seats)
    if (e.target.closest('[data-seat]')) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e) => {
    if (!isPanning || !panStart) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };
  const handlePointerUp = () => {
    setIsPanning(false);
    setPanStart(null);
  };

  // ── Render ─────────────────────────────────────────────────────
  const colWidth = SEAT_SIZE + SEAT_GAP;
  const rowHeight = SEAT_SIZE + SEAT_GAP;
  const screenY = PADDING;
  const seatsStartY = screenY + 60;

  return (
    <div className="w-full max-w-4xl mx-auto select-none">
      {/* Zoom Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <button onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-[#222] border border-[#333] text-gray-400 hover:text-white hover:bg-[#333] transition-colors"
            title="Thu nhỏ">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-500 font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-[#222] border border-[#333] text-gray-400 hover:text-white hover:bg-[#333] transition-colors"
            title="Phóng to">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={handleFit}
            className="p-1.5 rounded-lg bg-[#222] border border-[#333] text-gray-400 hover:text-white hover:bg-[#333] transition-colors ml-1"
            title="Vừa khung">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button onClick={handleReset}
            className="p-1.5 rounded-lg bg-[#222] border border-[#333] text-gray-400 hover:text-white hover:bg-[#333] transition-colors"
            title="Đặt lại">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        <span className="text-[10px] text-gray-600 hidden sm:inline">Ctrl+Scroll để zoom • Kéo để di chuyển</span>
        <span className="text-[10px] text-gray-600 sm:hidden">Chạm để chọn • Kéo để di chuyển</span>
      </div>

      {/* SVG Container */}
      <div
        ref={containerRef}
        className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#111]"
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: "center top",
            transition: isPanning ? "none" : "transform 0.2s ease-out",
          }}
        >
          <defs>
            {/* Glow filter for selected seats */}
            <filter id="seatGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
              <feColorMatrix values="0 0 0 0 0.9  0 0 0 0 0.04  0 0 0 0 0.08  0 0 0 0.6 0" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Gradient for screen */}
            <linearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E50914" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#E50914" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* ── SCREEN ──────────────────────────────────────── */}
          <g>
            {/* Screen curve */}
            <path
              d={`M${ROW_LABEL_W + PADDING},${screenY + 30} Q${svgW / 2},${screenY} ${svgW - ROW_LABEL_W - PADDING},${screenY + 30}`}
              fill="none" stroke="#555" strokeWidth="3" strokeLinecap="round"
            />
            {/* Screen glow */}
            <path
              d={`M${ROW_LABEL_W + PADDING},${screenY + 30} Q${svgW / 2},${screenY} ${svgW - ROW_LABEL_W - PADDING},${screenY + 30} L${svgW - ROW_LABEL_W - PADDING},${screenY + 50} Q${svgW / 2},${screenY + 20} ${ROW_LABEL_W + PADDING},${screenY + 50} Z`}
              fill="url(#screenGrad)"
            />
            <text x={svgW / 2} y={screenY + 46} textAnchor="middle"
              fill="#666" fontSize="10" fontWeight="600" letterSpacing="3">
              MÀN HÌNH CHIẾU
            </text>
          </g>

          {/* ── SEAT ROWS ───────────────────────────────────── */}
          {sortedRows.map((row, rowIdx) => {
            const rowSeats = grid[row];
            const rowY = seatsStartY + rowIdx * rowHeight;
            // Center the row
            const totalRowWidth = rowSeats.reduce((sum, s) => {
              return sum + (s.type === "couple" ? COUPLE_W + SEAT_GAP : colWidth);
            }, 0);
            const startX = (svgW - totalRowWidth) / 2;

            let curX = startX;
            return (
              <g key={row}>
                {/* Row label left */}
                <text x={startX - 14} y={rowY + SEAT_SIZE / 2 + 4}
                  textAnchor="middle" fill="#555" fontSize="11" fontWeight="700">
                  {row}
                </text>

                {/* Seats */}
                {rowSeats.map(seat => {
                  const status = getSeatStatus(seat);
                  const theme = SEAT_THEMES[seat.type] || SEAT_THEMES.regular;
                  const colors = theme[status] || theme.available;
                  const isHovered = hoveredId === seat.id;
                  const isCouple = seat.type === "couple";
                  const seatW = isCouple ? COUPLE_W : SEAT_SIZE;
                  const x = curX;
                  curX += seatW + SEAT_GAP;

                  const isClickable = status === "available" || status === "selected";
                  const fill = (isHovered && status === "available")
                    ? (colors.hoverFill || colors.fill)
                    : colors.fill;

                  return (
                    <g
                      key={seat.id}
                      data-seat={seat.id}
                      style={{
                        cursor: isClickable ? "pointer" : "not-allowed",
                        opacity: (status === "booked" || status === "locked") ? 0.35 : 1,
                      }}
                      filter={status === "selected" ? "url(#seatGlow)" : undefined}
                      onMouseEnter={() => setHoveredId(seat.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => isClickable && onSeatSelect?.(seat)}
                      onDoubleClick={() => onSeatDoubleClick?.(seat)}
                    >
                      {/* Seat body */}
                      <SeatShape
                        x={x} y={rowY}
                        w={seatW} h={SEAT_SIZE}
                        fill={fill} stroke={colors.stroke}
                        rx={isCouple ? 8 : 6}
                      />

                      {/* Armrests for VIP */}
                      {seat.type === "vip" && status !== "booked" && status !== "locked" && (
                        <>
                          <rect x={x - 2} y={rowY + SEAT_SIZE * 0.4} width={3} height={SEAT_SIZE * 0.5}
                            rx={1.5} fill={colors.stroke} opacity={0.6} />
                          <rect x={x + SEAT_SIZE - 1} y={rowY + SEAT_SIZE * 0.4} width={3} height={SEAT_SIZE * 0.5}
                            rx={1.5} fill={colors.stroke} opacity={0.6} />
                        </>
                      )}

                      {/* Heart icon for couple seats */}
                      {isCouple && status === "available" && (
                        <text x={x + seatW / 2} y={rowY + 14} textAnchor="middle" fontSize="10" fill={colors.stroke} opacity={0.6}>
                          ♥
                        </text>
                      )}

                      {/* Maintenance X */}
                      {status === "maintenance" && (
                        <g opacity={0.5}>
                          <line x1={x + 8} y1={rowY + 8} x2={x + seatW - 8} y2={rowY + SEAT_SIZE - 8}
                            stroke="#ef4444" strokeWidth={2} />
                          <line x1={x + seatW - 8} y1={rowY + 8} x2={x + 8} y2={rowY + SEAT_SIZE - 8}
                            stroke="#ef4444" strokeWidth={2} />
                        </g>
                      )}

                      {/* Label */}
                      <text
                        x={x + seatW / 2}
                        y={rowY + SEAT_SIZE / 2 + (isCouple && status === "available" ? 4 : 1)}
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize={status === "selected" ? "13" : "11"}
                        fontWeight="700"
                        fill={status === "selected" ? "#fff"
                          : (status === "booked" || status === "locked") ? "#444"
                          : "#aaa"}
                      >
                        {status === "selected" ? "✓" : seat.column}
                      </text>

                      {/* Hover tooltip */}
                      {isHovered && isClickable && (
                        <g>
                          <rect x={x + seatW / 2 - 30} y={rowY - 24} width={60} height={18}
                            rx={4} fill="#000" opacity={0.85} />
                          <text x={x + seatW / 2} y={rowY - 12} textAnchor="middle"
                            fill="#fff" fontSize="9" fontWeight="600">
                            {row}{seat.column} · {seat.type === "vip" ? "VIP" : seat.type === "couple" ? "Đôi" : "Thường"}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Row label right */}
                <text x={curX + 8} y={rowY + SEAT_SIZE / 2 + 4}
                  textAnchor="middle" fill="#555" fontSize="11" fontWeight="700">
                  {row}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── LEGEND ──────────────────────────────────────────────── */}
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-gray-400 bg-[#111] p-3 rounded-xl border border-[#2a2a2a]">
        {[
          { label: "Thường", w: 18, h: 16, fill: "#2a2a2a", stroke: "#555" },
          { label: "VIP",    w: 18, h: 16, fill: "#4a1515", stroke: "#8a2222" },
          { label: "Đôi",   w: 30, h: 16, fill: "#4a153a", stroke: "#8a2266" },
          { label: "Đang chọn", w: 18, h: 16, fill: "#E50914", stroke: "#ff333a", glow: true },
          { label: "Đã bán", w: 18, h: 16, fill: "#1a1a1a", stroke: "#333", dim: true },
        ].map(({ label, w, h, fill, stroke, glow, dim }) => (
          <div key={label} className="flex items-center gap-1.5">
            <svg width={w + 4} height={h + 4} viewBox={`0 0 ${w + 4} ${h + 4}`}>
              <SeatShape x={2} y={2} w={w} h={h} fill={fill} stroke={stroke} rx={3} />
              {glow && <SeatShape x={2} y={2} w={w} h={h} fill="none" stroke={stroke} rx={3} />}
            </svg>
            <span className={dim ? "opacity-50" : ""}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
