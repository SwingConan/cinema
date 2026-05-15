import { useMemo } from "react";

export default function SeatMap({
  seats,
  bookedIds,
  lockedIds,
  selectedSeats,
  onSeatSelect,
  onSeatDoubleClick,
}) {
  // Group seats by row
  const seatGrid = useMemo(() => {
    const grid = {};
    seats.forEach((seat) => {
      if (!grid[seat.row]) {
        grid[seat.row] = [];
      }
      grid[seat.row].push(seat);
    });

    // Sort rows alphabetically (A, B, C...)
    const sortedRows = Object.keys(grid).sort();

    // Ensure columns in each row are sorted numerically
    sortedRows.forEach((row) => {
      grid[row].sort((a, b) => a.column - b.column);
    });

    return { grid, sortedRows };
  }, [seats]);

  const getSeatStatus = (seat) => {
    if (seat.status === "maintenance") return "maintenance";
    if (selectedSeats && selectedSeats.some((s) => s.id === seat.id)) return "selected";
    if (bookedIds && bookedIds.includes(seat.id)) return "booked";
    if (lockedIds && lockedIds.includes(seat.id)) return "locked";
    return "available";
  };

  const getSeatColorClass = (type, status) => {
    if (status === "maintenance")
      return "bg-gray-800 cursor-not-allowed border-gray-600 opacity-60 overflow-hidden";
    if (status === "booked" || status === "locked")
      return "bg-[#333] cursor-not-allowed text-[#555] opacity-50 border-[#222]";
    if (status === "selected")
      return "bg-[#E50914] text-white shadow-[0_0_10px_rgba(229,9,20,0.6)] transform scale-105 border-[#ff333a] z-10";

    // Available colors based on type
    switch (type) {
      case "vip":
        return "bg-[#4a1515] border-[#8a2222] text-red-200 hover:bg-[#6a1a1a]";
      case "couple":
        return "bg-[#4a153a] border-[#8a2266] text-pink-200 hover:bg-[#6a1a52]";
      default:
        return "bg-[#2a2a2a] border-[#444] text-gray-300 hover:bg-[#3a3a3a]"; // Regular
    }
  };

  const baseSeatClass =
    "relative w-10 h-10 sm:w-12 sm:h-12 m-1 rounded-t-lg border-2 flex flex-col items-center justify-center text-xs font-bold transition-all duration-200";

  return (
    <div className="w-full max-w-4xl mx-auto p-4 select-none">
      {/* Screen */}
      <div className="mb-12">
        <div className="w-full h-8 bg-gradient-to-b from-[#333] to-transparent flex items-center justify-center rounded-t-full shadow-inner relative overflow-hidden">
          <div className="absolute inset-0 bg-[#E50914] blur-xl opacity-20"></div>
          <span className="text-gray-400 text-sm font-semibold tracking-widest uppercase">
            Màn Hình Chiếu
          </span>
        </div>
      </div>

      {/* Seat Grid */}
      <div className="overflow-x-auto pb-4 scrollbar-hide">
        <div className="min-w-max mx-auto flex flex-col items-center gap-2">
          {seatGrid.sortedRows.map((row) => (
            <div key={row} className="flex items-center">
              <div className="w-8 text-center font-bold text-gray-500 mr-2">
                {row}
              </div>
              <div className="flex justify-center">
                {seatGrid.grid[row].map((seat) => {
                  const status = getSeatStatus(seat);
                  let styleClass = `${baseSeatClass} ${getSeatColorClass(seat.type, status)}`;

                  // Custom styling for couple seats
                  if (
                    seat.type === "couple" &&
                    status !== "selected" &&
                    status !== "booked" &&
                    status !== "locked" &&
                    status !== "maintenance"
                  ) {
                    styleClass = `w-24 h-10 sm:w-28 sm:h-12 m-1 rounded-t-lg border-2 flex items-center justify-center text-xs font-bold transition-all duration-200 bg-[#4a153a] border-[#8a2266] text-pink-200 hover:bg-[#6a1a52]`;
                  } else if (seat.type === "couple") {
                    styleClass = styleClass.replace(
                      "w-10 h-10 sm:w-12 sm:h-12",
                      "w-24 h-10 sm:w-28 sm:h-12",
                    );
                  }

                  return (
                    <button
                      key={seat.id}
                      disabled={status === "booked" || status === "locked" || (!onSeatDoubleClick && status === "maintenance")}
                      onClick={() => onSeatSelect && onSeatSelect(seat)}
                      onDoubleClick={() => onSeatDoubleClick && onSeatDoubleClick(seat)}
                      className={styleClass}
                      title={status === "maintenance" ? "Ghế đang bảo trì" : ""}
                    >
                      {status === "maintenance" && (
                        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <svg viewBox="0 0 20 20" className="w-full h-full opacity-40">
                            <line x1="0" y1="0" x2="20" y2="20" stroke="#ef4444" strokeWidth="2"/>
                            <line x1="20" y1="0" x2="0" y2="20" stroke="#ef4444" strokeWidth="2"/>
                          </svg>
                        </span>
                      )}
                      {status === "selected" ? (
                        <span className="text-white relative z-10">✓</span>
                      ) : (
                        <span className="opacity-80 relative z-10">{seat.column}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="w-8 text-center font-bold text-gray-500 ml-2">
                {row}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-400 bg-[#111] p-4 rounded-xl border border-[#333] shadow-lg">
        <div className="flex items-center">
          <div className="w-6 h-6 rounded border-2 border-[#444] bg-[#2a2a2a] mr-2"></div>{" "}
          Thường
        </div>
        <div className="flex items-center">
          <div className="w-6 h-6 rounded border-2 border-[#8a2222] bg-[#4a1515] mr-2"></div>{" "}
          VIP
        </div>
        <div className="flex items-center">
          <div className="w-12 h-6 rounded border-2 border-[#8a2266] bg-[#4a153a] mr-2"></div>{" "}
          Ghế Đôi (Couple)
        </div>
        <div className="flex items-center">
          <div className="w-6 h-6 rounded bg-[#E50914] shadow-[0_0_8px_rgba(229,9,20,0.5)] border border-[#ff333a] mr-2 text-white flex items-center justify-center text-xs font-bold">
            ✓
          </div>{" "}
          Đang chọn
        </div>
        <div className="flex items-center">
          <div className="w-6 h-6 rounded bg-[#333] border border-[#222] opacity-50 mr-2"></div>{" "}
          Đã bán / Đang giữ
        </div>
      </div>
    </div>
  );
}
