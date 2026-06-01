/* eslint-disable react-refresh/only-export-components */
import { renderToStaticMarkup } from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value.toString().replace("Z", ""));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

const normalizeSeats = (seats = []) => {
  if (!Array.isArray(seats) || seats.length === 0) return [];
  return seats.map((seat) => {
    if (typeof seat === "string") return seat;
    return `${seat.row ?? ""}${seat.column ?? ""}` || "N/A";
  });
};

const normalizeConcessions = (concessions = []) => {
  if (!Array.isArray(concessions)) return [];
  return concessions
    .map((item) => ({
      id: item.concessionId ?? item.id ?? item.name,
      name: item.name ?? item.concessionName ?? "Bắp nước",
      quantity: Number(item.quantity || 0),
      price: Number(item.price || 0),
    }))
    .filter((item) => item.quantity > 0);
};

const paymentLabel = (method) => {
  if (method === "cash") return "TIỀN MẶT";
  if (method === "card") return "CHUYỂN KHOẢN";
  return "ĐÃ THANH TOÁN";
};

// ── Barcode Generator Component (CSS-Based) ─────────────────────────────────
const Barcode = () => {
  // Pattern of line widths (in pixels): 1=thin, 3=medium, 5=thick
  const pattern = [
    2, 1, 4, 2, 1, 3, 1, 4, 2, 1, 2, 4, 1, 3, 2, 1, 4, 1, 2, 3, 1, 4, 2, 1, 3, 1,
    2, 4, 1, 2, 3, 2, 1, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 4, 2, 1, 2, 4, 1, 3, 2
  ];
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "35px", margin: "10px 0", gap: "1.5px" }}>
      {pattern.map((width, idx) => (
        <div
          key={idx}
          style={{
            width: `${width}px`,
            height: "30px",
            backgroundColor: "#000",
            opacity: idx % 3 === 0 ? 0.85 : 1
          }}
        />
      ))}
    </div>
  );
};

export const premiumTicketCss = `
  * { box-sizing: border-box; }
  body {
    background: #000;
    margin: 0;
    padding: 0;
  }
  .ticket-print-page {
    width: 300px;
    margin: 0 auto;
    padding: 10px 0;
    font-family: "Courier New", Courier, monospace;
  }
  .cinema-ticket {
    width: 300px;
    background: linear-gradient(135deg, #fffdf4 0%, #fffbf0 50%, #fff9e6 100%); /* Premium warm ivory ticket paper */
    color: #111;
    border: 3px double #111;
    border-radius: 8px;
    padding: 18px;
    position: relative;
    overflow: visible;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6); /* Deep rich shadow */
    transition: transform 0.3s ease;
  }
  .cinema-ticket:hover {
    transform: translateY(-2px);
  }
  .ticket-brand {
    text-align: center;
    border-bottom: 2px dashed #e50914;
    padding-bottom: 8px;
    margin-bottom: 12px;
  }
  .ticket-brand-title {
    font-size: 22px;
    font-weight: 900;
    color: #e50914; /* Red Brand Logo */
    letter-spacing: 3px;
    text-shadow: 1px 1px 0px rgba(0,0,0,0.05);
  }
  .ticket-branch {
    font-size: 11px;
    font-weight: bold;
    margin-top: 4px;
    text-transform: uppercase;
    color: #333;
  }
  .ticket-address {
    font-size: 9px;
    color: #666;
    margin-top: 2px;
    line-height: 1.2;
  }
  .ticket-movie-banner {
    background: linear-gradient(90deg, #e50914 0%, #b80710 100%); /* Cinematic red gradient banner */
    color: #fff;
    padding: 10px 6px;
    text-align: center;
    margin-bottom: 12px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.15);
    border-radius: 4px;
    border: 1px solid #99050d;
  }
  .ticket-movie-title {
    font-size: 16px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 1px;
    line-height: 1.3;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
  .ticket-label {
    font-size: 9px;
    font-weight: bold;
    text-transform: uppercase;
    color: #666;
  }
  .ticket-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    margin: 6px 0;
    border-bottom: 1px dashed #eee;
    padding-bottom: 4px;
  }
  .ticket-row span {
    color: #666;
    font-weight: bold;
  }
  .ticket-row strong {
    font-weight: 900;
    color: #111;
  }
  .seat-box {
    border: 2px dashed #d97706; /* Gold dashed border */
    border-radius: 8px;
    text-align: center;
    padding: 12px 6px;
    margin: 14px 0;
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); /* Gold premium gradient */
    color: #b45309;
    box-shadow: inset 0 1px 3px rgba(217,119,6,0.1);
  }
  .seat-box .ticket-label {
    margin-bottom: 2px;
    letter-spacing: 1.5px;
    color: #b45309;
    font-weight: bold;
  }
  .seat-names {
    font-size: 26px;
    font-weight: 900;
    letter-spacing: 1.5px;
    text-shadow: 1px 1px 0px rgba(255,255,255,0.8);
  }
  .concession-box {
    border-top: 1px dashed #ccc;
    border-bottom: 1px dashed #ccc;
    padding: 8px 0;
    margin: 12px 0;
  }
  .concession-line {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 11px;
    margin: 4px 0;
  }
  .concession-name {
    font-weight: bold;
    color: #333;
  }
  .concession-dots {
    flex: 1;
    border-bottom: 1px dotted #aaa;
    margin: 0 6px;
    position: relative;
    top: -3px;
  }
  .concession-price {
    font-weight: bold;
    color: #111;
  }
  .ticket-total {
    border: 2px solid #111;
    padding: 8px 12px;
    margin-top: 12px;
    background: #fcfcfc;
    border-radius: 4px;
  }
  .ticket-total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .ticket-total-label {
    font-size: 9px;
    font-weight: bold;
    text-transform: uppercase;
    color: #666;
  }
  .ticket-total-method {
    font-size: 11px;
    font-weight: 900;
    margin-top: 2px;
    color: #e50914;
  }
  .ticket-total-value {
    font-size: 20px;
    font-weight: 900;
    color: #111;
  }
  .ticket-stub {
    border-top: 2px dashed #111;
    margin: 16px -20px 0;
    padding: 16px 20px 0;
    position: relative;
    text-align: center;
  }
  .ticket-stub::before,
  .ticket-stub::after {
    content: "";
    width: 24px;
    height: 24px;
    border: 3px solid #111;
    border-radius: 50%;
    background: #141414; /* Match POS modal dark background for perfect cutout effect */
    position: absolute;
    top: -14px;
  }
  .ticket-stub::before {
    left: -15px;
    clip-path: circle(50% at 100% 50%);
  }
  .ticket-stub::after {
    right: -15px;
    clip-path: circle(50% at 0% 50%);
  }
  .scissor-icon {
    position: absolute;
    top: -9px;
    left: 20px;
    font-size: 12px;
    background: #fffdf6; /* match ticket body */
    padding: 0 4px;
    color: #666;
  }
  .qr-frame {
    display: inline-flex;
    padding: 8px;
    border: 2px solid #111;
    background: #fff;
    margin-top: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    border-radius: 4px;
  }
  .ticket-code {
    font-size: 11px;
    font-weight: 900;
    margin-top: 8px;
  }
  .ticket-note {
    font-size: 8px;
    font-weight: bold;
    margin-top: 4px;
    text-transform: uppercase;
    color: #555;
    letter-spacing: 0.5px;
  }
  .stub-title {
    font-size: 9px;
    font-weight: bold;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #555;
    margin-bottom: 6px;
  }
  @page { size: 80mm auto; margin: 0; }
  @media print {
    body {
      background: #fff !important;
    }
    .ticket-print-page {
      width: 300px;
      padding: 0;
    }
    .cinema-ticket {
      border-radius: 0 !important;
      box-shadow: none !important;
      background: #fff !important;
      border: 3px double #000 !important;
      transform: none !important;
    }
    .ticket-brand-title {
      color: #000 !important;
      text-shadow: none !important;
    }
    .ticket-brand {
      border-bottom: 2px dashed #000 !important;
    }
    .ticket-movie-banner {
      background: #000 !important;
      color: #fff !important;
      box-shadow: none !important;
      border: none !important;
      border-radius: 0 !important;
    }
    .ticket-movie-title {
      text-shadow: none !important;
    }
    .seat-box {
      border: 3px double #000 !important;
      background: #fff !important;
      color: #000 !important;
      box-shadow: none !important;
      border-radius: 0 !important;
    }
    .seat-box .ticket-label {
      color: #000 !important;
    }
    .seat-names {
      text-shadow: none !important;
    }
    .ticket-total {
      background: #fff !important;
      border-radius: 0 !important;
    }
    .ticket-total-method {
      color: #000 !important;
    }
    .ticket-stub::before,
    .ticket-stub::after {
      display: none !important; /* Hide circular bite on physical printout */
    }
    .scissor-icon {
      background: #fff !important;
    }
    .qr-frame {
      box-shadow: none !important;
      border-radius: 0 !important;
    }
  }
`;

export function PremiumTicketStyles() {
  return <style>{premiumTicketCss}</style>;
}

export function buildPremiumTicketData({ booking, branchInfo = null, fallbackShowtime = null, paymentMethod = null }) {
  const showtime = booking?.showtime ?? {};
  const room = showtime.room ?? fallbackShowtime?.room ?? {};
  const branch = showtime.branch ?? branchInfo ?? {};

  return {
    id: booking?.id,
    qrCode: booking?.qrCode ?? booking?.qr_code ?? `BOOKING-${booking?.id ?? ""}`,
    movieTitle: showtime.movie?.title ?? fallbackShowtime?.movie?.title ?? "N/A",
    startTime: showtime.startTime ?? showtime.start_time ?? fallbackShowtime?.startTime ?? fallbackShowtime?.start_time,
    format: showtime.format ?? fallbackShowtime?.format ?? room.type ?? "",
    roomName: room.name ?? "N/A",
    roomType: room.type ?? "",
    branchName: branch.name ?? "Cinema MS",
    branchCity: branch.city ?? "",
    branchAddress: branch.address ?? "",
    seats: normalizeSeats(booking?.seats),
    concessions: normalizeConcessions(booking?.concessions),
    totalAmount: booking?.totalAmount ?? booking?.total_amount ?? 0,
    tierDiscountAmount: booking?.tierDiscountAmount ?? booking?.tier_discount_amount ?? 0,
    discountAmount: booking?.discountAmount ?? booking?.discount_amount ?? 0,
    paymentMethod: booking?.paymentMethod ?? booking?.payment_method ?? paymentMethod,
  };
}

export function TicketPaper({ ticket, id }) {
  if (!ticket) return null;

  const seatText = ticket.seats.length > 0 ? ticket.seats.join(", ") : "N/A";
  const roomText = [ticket.roomName, ticket.roomType].filter(Boolean).join(" - ");
  const branchText = [ticket.branchName, ticket.branchCity].filter(Boolean).join(" - ");

  return (
    <div className="ticket-print-page" id={id}>
      <div className="cinema-ticket">
        {/* Ticket Header */}
        <div className="ticket-brand">
          <div className="ticket-brand-title">★ CINEMA MS ★</div>
          <div className="ticket-branch">{branchText}</div>
          {ticket.branchAddress && <div className="ticket-address">{ticket.branchAddress}</div>}
        </div>

        {/* Movie Title Banner */}
        <div className="ticket-movie-banner">
          <div className="ticket-movie-title">{ticket.movieTitle}</div>
        </div>

        <div className="ticket-row">
          <span>SUẤT CHIẾU</span>
          <strong>{formatDateTime(ticket.startTime)}</strong>
        </div>
        <div className="ticket-row">
          <span>PHÒNG CHIẾU</span>
          <strong>{roomText}</strong>
        </div>
        <div className="ticket-row">
          <span>ĐỊNH DẠNG</span>
          <strong>{ticket.format || "2D"}</strong>
        </div>

        {/* Highlighted Seat Box */}
        <div className="seat-box">
          <div className="ticket-label">Ghế ngồi</div>
          <div className="seat-names">{seatText}</div>
        </div>

        {/* Popcorn and Drinks with Dotted Leaders */}
        {ticket.concessions.length > 0 && (
          <div className="concession-box">
            <div className="ticket-label" style={{ marginBottom: "6px" }}>Bắp nước kèm theo</div>
            {ticket.concessions.map((item) => (
              <div className="concession-line" key={`${item.id}-${item.name}`}>
                <span className="concession-name">{item.quantity}x {item.name}</span>
                <span className="concession-dots"></span>
                <strong className="concession-price">{formatCurrency(item.price * item.quantity)}</strong>
              </div>
            ))}
          </div>
        )}

        {/* Discount Details if any */}
        {(Number(ticket.tierDiscountAmount) > 0 || Number(ticket.discountAmount) > 0) && (
          <div style={{ borderTop: "1px dashed #ccc", paddingTop: "8px", margin: "12px 0 6px 0", fontSize: "11px", color: "#333", display: "flex", flexDirection: "column", gap: "4px" }}>
            {Number(ticket.discountAmount) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Khuyến mãi Voucher:</span>
                <strong>-{formatCurrency(ticket.discountAmount)}</strong>
              </div>
            )}
            {Number(ticket.tierDiscountAmount) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Giảm giá Hạng TV:</span>
                <strong>-{formatCurrency(ticket.tierDiscountAmount)}</strong>
              </div>
            )}
          </div>
        )}

        {/* Total details */}
        <div className="ticket-total">
          <div className="ticket-total-row">
            <div>
              <div className="ticket-total-label">Thanh toán</div>
              <div className="ticket-total-method font-bold">{paymentLabel(ticket.paymentMethod)}</div>
            </div>
            <div className="ticket-total-value">{formatCurrency(ticket.totalAmount)}</div>
          </div>
        </div>

        {/* Ticket Stub (Cuống vé) */}
        <div className="ticket-stub">
          <span className="scissor-icon">✂----------------</span>
          <div className="stub-title">Cuống vé · Control Stub</div>
          
          <div className="qr-frame">
            <QRCodeSVG value={ticket.qrCode || `BOOKING-${ticket.id}`} size={120} level="M" />
          </div>
          
          <div className="ticket-code">MÃ VÉ: #{ticket.id ?? "N/A"}</div>
          <div className="ticket-note">Vui lòng giữ cuống vé để kiểm soát vào rạp</div>

          {/* Artistic CSS Barcode at the very bottom */}
          <div style={{ marginTop: "12px", borderTop: "1px solid #eee", paddingTop: "8px" }}>
            <Barcode />
          </div>
        </div>
      </div>
    </div>
  );
}

export function printPremiumTicket(ticket, title = "Cinema Ticket") {
  const printWin = window.open("", "_blank");
  if (!printWin) return false;

  const markup = renderToStaticMarkup(<TicketPaper ticket={ticket} />);
  const scriptClose = "</" + "script>";
  printWin.document.write(
    `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>body { margin: 0; background: #fff; color: #111; } ${premiumTicketCss}</style>
      </head>
      <body>
        ${markup}
        <script>
          setTimeout(function () {
            window.print();
            window.close();
          }, 300);
        ${scriptClose}
      </body>
    </html>`
  );
  printWin.document.close();
  return true;
}
