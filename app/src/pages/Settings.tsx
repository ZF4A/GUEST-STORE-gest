import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { KeyRound, Eye, EyeOff, CheckCircle2, Shield, AlertCircle } from "lucide-react";

// ── Password strength indicator ──────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const { t } = useLanguage();
  if (!password) return null;

  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const level   = score <= 2 ? t("Weak") : score <= 3 ? t("Medium") : t("Strong");
  const color   = score <= 2 ? "bg-red-400"   : score <= 3 ? "bg-amber-400" : "bg-emerald-400";
  const txtColor = score <= 2 ? "text-red-400" : score <= 3 ? "text-amber-400" : "text-emerald-400";
  const bars    = score <= 2 ? 1 : score <= 3 ? 2 : 3;

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= bars ? color : "bg-white/[0.08]"}`} />
        ))}
      </div>
      <span className={`text-[11px] font-medium ${txtColor}`}>{level}</span>
    </div>
  );
}

// ── Field with show/hide toggle ──────────────────────────────────────────────
function PasswordInput({
  label, value, onChange, show, onToggle, placeholder,
}: {
  label: string; value: string;
  onChange: (v: string) => void;
  show: boolean; onToggle: () => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-white/60 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full h-11 px-4 pr-11 bg-[#0A0A0A] border border-white/[0.12] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C8956C]/60 transition-colors"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function Settings() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [currentPwd, setCurrentPwd]   = useState("");
  const [newPwd, setNewPwd]           = useState("");
  const [confirmPwd, setConfirmPwd]   = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess]         = useState(false);
  const [clientError, setClientError] = useState("");

  const changePassword = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      setClientError("");
      setTimeout(() => setSuccess(false), 5000);
    },
    onError: () => setSuccess(false),
  });

  function validate(): string {
    if (!currentPwd) return t("Current Password") + " " + t("Password too short").toLowerCase();
    if (newPwd.length < 8) return t("Password too short");
    if (newPwd !== confirmPwd) return t("Passwords do not match");
    return "";
  }

  function handleSubmit() {
    const err = validate();
    if (err) { setClientError(err); return; }
    setClientError("");
    changePassword.mutate({ currentPassword: currentPwd, newPassword: newPwd });
  }

  // translate server error
  function serverError(): string {
    const msg = changePassword.error?.message ?? "";
    if (msg.toLowerCase().includes("incorrect") || msg.toLowerCase().includes("invalid")) {
      return t("Wrong current password");
    }
    return msg;
  }

  const displayError = clientError || serverError();
  const canSubmit = currentPwd.length > 0 && newPwd.length >= 8 && newPwd === confirmPwd;

  return (
    <div className="max-w-lg space-y-6">

      {/* ── Change Password ── */}
      <div className="bg-[#141414] border border-white/[0.06] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#C8956C]/10 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-[#C8956C]" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">{t("Change Password")}</h3>
            <p className="text-sm text-white/40">{t("Change Password subtitle")}</p>
          </div>
        </div>

        {/* Success banner */}
        {success && (
          <div className="flex items-center gap-2.5 px-4 py-3 mb-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {t("Password changed success")}
          </div>
        )}

        {/* Error banner */}
        {displayError && !success && (
          <div className="flex items-start gap-2.5 px-4 py-3 mb-5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {displayError}
          </div>
        )}

        <div className="space-y-4">
          <PasswordInput
            label={t("Current Password")}
            value={currentPwd}
            onChange={(v) => { setCurrentPwd(v); setClientError(""); changePassword.reset(); }}
            show={showCurrent}
            onToggle={() => setShowCurrent(!showCurrent)}
          />

          <div>
            <PasswordInput
              label={t("New Password")}
              value={newPwd}
              onChange={(v) => { setNewPwd(v); setClientError(""); }}
              show={showNew}
              onToggle={() => setShowNew(!showNew)}
              placeholder="min. 8 caractères"
            />
            <PasswordStrength password={newPwd} />
          </div>

          <div>
            <PasswordInput
              label={t("Confirm Password")}
              value={confirmPwd}
              onChange={(v) => { setConfirmPwd(v); setClientError(""); }}
              show={showConfirm}
              onToggle={() => setShowConfirm(!showConfirm)}
            />
            {confirmPwd && newPwd !== confirmPwd && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {t("Passwords do not match")}
              </p>
            )}
            {confirmPwd && newPwd === confirmPwd && newPwd.length >= 8 && (
              <p className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {t("Confirm Password")} ✓
              </p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || changePassword.isPending}
            className="w-full h-11 bg-[#C8956C] hover:bg-[#B8855C] text-white font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-1"
          >
            {changePassword.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t("Loading")}
              </span>
            ) : (
              t("Change Password")
            )}
          </button>
        </div>
      </div>

      {/* ── Account Info ── */}
      <div className="bg-[#141414] border border-white/[0.06] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-sky-400/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-sky-400" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">{t("Account Info")}</h3>
            <p className="text-sm text-white/40">{t("Account Info subtitle")}</p>
          </div>
        </div>

        <div className="space-y-0 divide-y divide-white/[0.04]">
          {[
            { label: t("Name"),        value: user?.name },
            { label: t("Employee ID"), value: user?.employeeId, mono: true },
            { label: t("Email"),       value: user?.email },
            { label: t("Role"),        value: user?.role, accent: true },
            {
              label: t("Store"),
              value: user?.storeId === 1 ? "Yaoundé" : user?.storeId === 2 ? "Kribi" : t("All Stores"),
            },
          ].map(({ label, value, mono, accent }) => (
            <div key={label} className="flex justify-between items-center py-3">
              <span className="text-sm text-white/40">{label}</span>
              <span className={`text-sm ${accent ? "text-[#C8956C] font-medium" : "text-white"} ${mono ? "font-mono text-xs tracking-wide" : ""}`}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
