import { useState, useRef, useEffect } from "react";
import { Lock, Loader2, X, AlertTriangle, ShieldCheck } from "lucide-react";
import api from "../../utils/api";
import toast from "react-hot-toast";

/**
 * PasscodeModal — Modal nhập mã bảo mật 6 số
 * 
 * Props:
 *   isOpen    — boolean hiển thị modal
 *   onClose   — callback đóng modal
 *   onSuccess — callback khi xác thực thành công, nhận (securityToken)
 */
export default function PasscodeModal({ isOpen, onClose, onSuccess }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [locked, setLocked] = useState(false);
  const inputRefs = useRef([]);

  // Auto-focus ô đầu tiên khi mở
  useEffect(() => {
    if (isOpen) {
      setDigits(["", "", "", "", "", ""]);
      setError(null);
      setLocked(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setError(null);

    // Auto-focus ô tiếp theo
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit khi nhập đủ 6 số
    if (value && index === 5) {
      const passcode = newDigits.join("");
      if (passcode.length === 6) {
        handleVerify(passcode);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace: xóa và lùi về ô trước
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newDigits = pasted.split("");
      setDigits(newDigits);
      handleVerify(pasted);
    }
  };

  const handleVerify = async (passcode) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/customer/security/passcode/verify", { passcode });
      toast.success("✅ Xác thực thành công!");
      onSuccess(res.data.token);
    } catch (err) {
      const msg = err.response?.data?.message || "Xác thực thất bại";
      const remaining = err.response?.data?.attemptsRemaining;
      const status = err.response?.status;

      if (status === 423) {
        setLocked(true);
        setError(msg);
      } else {
        setError(msg);
        if (remaining !== undefined) setAttemptsRemaining(remaining);
      }
      // Reset input
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-[420px] max-w-[92vw] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "slideUp 0.2s ease-out" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#E50914] to-[#b20710] px-5 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-white" />
            <h3 className="text-white font-black text-base">Xác thực mã bảo mật</h3>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Description */}
          <p className="text-gray-400 text-sm text-center">
            Nhập mã bảo mật 6 số để xác nhận giao dịch
          </p>

          {/* 6-digit input */}
          <div className="flex justify-center gap-3" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={loading || locked}
                className={`w-12 h-14 text-center text-2xl font-black rounded-xl border-2 
                  bg-[#111] text-white outline-none transition-all
                  ${error ? "border-red-500/70 shake" : "border-[#333] focus:border-[#E50914]"}
                  ${locked ? "opacity-40 cursor-not-allowed" : ""}
                `}
              />
            ))}
          </div>

          {/* Error / Lock message */}
          {error && (
            <div className={`flex items-center gap-2 justify-center text-sm ${locked ? "text-orange-400" : "text-red-400"}`}>
              {locked ? <AlertTriangle className="w-4 h-4" /> : <X className="w-4 h-4" />}
              <span>{error}</span>
            </div>
          )}

          {/* Attempts remaining */}
          {attemptsRemaining !== null && !locked && (
            <p className="text-center text-xs text-yellow-500/80">
              Còn {attemptsRemaining} lần thử trước khi bị khóa
            </p>
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang xác thực...</span>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={async () => {
                try {
                  await api.post("/customer/security/passcode/reset-request");
                  toast.success("📧 Mã OTP đã gửi đến email của bạn!");
                } catch (err) {
                  toast.error(err.response?.data?.message || "Lỗi gửi OTP");
                }
              }}
              className="text-xs text-gray-500 hover:text-[#E50914] transition-colors"
            >
              Quên mã bảo mật?
            </button>

            <div className="flex items-center gap-1 text-xs text-gray-600">
              <ShieldCheck className="w-3 h-3" />
              <span>Hết hạn sau 5 phút</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .shake {
          animation: shake 0.4s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
