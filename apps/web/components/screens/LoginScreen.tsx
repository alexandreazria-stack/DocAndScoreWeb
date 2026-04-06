"use client";
import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { PasswordInput } from "@/components/ui/Input";

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === "signup";
  const passwordsMatch = !isSignUp || password === confirmPassword;
  const passwordLongEnough = password.length >= 8;
  const canSubmit = email.includes("@") && passwordLongEnough && passwordsMatch;

  const handleSubmit = () => {
    setError("");
    if (!canSubmit) return;
    if (isSignUp && !passwordsMatch) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 800);
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "auto", background: "#EAEFF3", zIndex: 9999 }}>
      {/* Decorative orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-ds-sky/[0.07] blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] rounded-full bg-ds-pro/[0.05] blur-[80px] pointer-events-none" />
      <div className="absolute top-[30%] right-[5%] w-[200px] h-[200px] rounded-full bg-ds-success/[0.04] blur-[60px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[400px] px-6">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="mb-4 text-6xl opacity-15 animate-float">🩺</div>
          <Logo size="lg" />
          <p className="text-ds-text-muted text-[15px] mt-3 font-medium tracking-wide">
            Scores cliniques validés
          </p>
        </div>

        {/* Tabs */}
        <div className="flex w-full glass-strong rounded-2xl p-1.5 mb-0 animate-fade-in-up stagger-1">
          {([
            { id: "signin" as const, label: "Connexion" },
            { id: "signup" as const, label: "Créer un compte" },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setMode(tab.id); setError(""); }}
              className={`flex-1 py-3 rounded-[12px] text-sm font-bold transition-all duration-200 ${
                mode === tab.id
                  ? "bg-white text-ds-sky shadow-md"
                  : "bg-transparent text-ds-text-muted hover:text-ds-text-secondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Card */}
        <div className="w-full glass-strong rounded-2xl rounded-t-none p-7 animate-fade-in-up stagger-2">
          <h2 className="text-[22px] font-extrabold mb-1 tracking-tight">
            {isSignUp ? "Créer votre compte" : "Bon retour !"}
          </h2>
          <p className="text-ds-text-muted text-[13px] mb-6 leading-relaxed">
            {isSignUp ? "Rejoignez Doc&Score en quelques secondes" : "Connectez-vous à votre espace médecin"}
          </p>

          {/* Email */}
          <label className="text-[12px] font-bold text-ds-text-secondary/80 uppercase tracking-wider block mb-2">
            Email professionnel
          </label>
          <div className="flex items-center gap-2.5 bg-ds-offwhite/80 rounded-[14px] border border-ds-border/60 px-4 py-3.5 focus-within:border-ds-sky/50 focus-within:bg-white focus-within:glow-sky transition-all duration-200">
            <span className="text-lg opacity-40">✉️</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dr.martin@gmail.com"
              className="flex-1 bg-transparent outline-none text-[15px] font-display text-ds-text placeholder:text-ds-text-muted/60"
            />
          </div>

          {/* Password */}
          <div className="h-4" />
          <label className="text-[12px] font-bold text-ds-text-secondary/80 uppercase tracking-wider block mb-2">
            Mot de passe
          </label>
          <PasswordInput value={password} onChange={setPassword} placeholder="Minimum 8 caractères" />

          {!isSignUp && (
            <div className="text-right mt-2">
              <button className="text-xs text-ds-sky font-semibold hover:text-ds-sky/80 transition-colors">
                Mot de passe oublié ?
              </button>
            </div>
          )}

          {isSignUp && (
            <>
              <div className="h-4" />
              <label className="text-[12px] font-bold text-ds-text-secondary/80 uppercase tracking-wider block mb-2">
                Confirmer le mot de passe
              </label>
              <PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="Retapez votre mot de passe" />
              {confirmPassword && !passwordsMatch && (
                <p className="text-ds-error text-xs mt-2 font-semibold animate-fade-in">
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </>
          )}

          {/* Password strength */}
          {isSignUp && password && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full bg-ds-border-light overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: password.length < 8 ? "30%" : password.length < 12 ? "60%" : "100%",
                    background: password.length < 8
                      ? "linear-gradient(90deg, #D14F4F, #D14F4F)"
                      : password.length < 12
                      ? "linear-gradient(90deg, #D99A3E, #E8B44E)"
                      : "linear-gradient(90deg, #2FAF7E, #4EC99B)",
                  }}
                />
              </div>
              <span
                className="text-[11px] font-bold tracking-wide"
                style={{ color: password.length < 8 ? "#D14F4F" : password.length < 12 ? "#D99A3E" : "#2FAF7E" }}
              >
                {password.length < 8 ? "Trop court" : password.length < 12 ? "Correct" : "Fort"}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 px-4 py-3 rounded-[14px] bg-ds-error-pale/80 text-ds-error text-[13px] font-semibold animate-scale-in border border-ds-error/10">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={(!canSubmit || loading) ? undefined : handleSubmit}
            disabled={!canSubmit || loading}
            className={`
              w-full mt-6 py-4 rounded-[16px] text-[16px] font-bold
              transition-all duration-200
              disabled:opacity-35 disabled:pointer-events-none
              ${loading ? "" : "active:scale-[0.98]"}
              bg-gradient-to-r from-ds-sky to-[#3D8DB5]
              text-white
              shadow-[0_2px_8px_rgba(74,154,191,0.3),0_8px_24px_rgba(74,154,191,0.15)]
              hover:shadow-[0_4px_12px_rgba(74,154,191,0.35),0_12px_32px_rgba(74,154,191,0.2)]
              hover:-translate-y-0.5
            `}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2.5">
                <span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full inline-block animate-spin" />
                {isSignUp ? "Création..." : "Connexion..."}
              </span>
            ) : (
              isSignUp ? "Créer mon compte" : "Se connecter"
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-ds-border to-transparent" />
            <span className="text-[11px] text-ds-text-muted font-medium uppercase tracking-widest">ou</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-ds-border to-transparent" />
          </div>

          {/* Google */}
          <button
            onClick={onLogin}
            className="w-full py-3.5 px-5 rounded-[14px] border border-ds-border/70 bg-white/80 text-sm font-semibold text-ds-text flex items-center justify-center gap-3 hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continuer avec Google
          </button>

          {isSignUp && (
            <p className="text-ds-text-muted text-[11px] text-center mt-5 leading-relaxed">
              En créant un compte, vous acceptez les{" "}
              <span className="text-ds-sky cursor-pointer hover:underline">conditions d&apos;utilisation</span>
              {" "}et la{" "}
              <span className="text-ds-sky cursor-pointer hover:underline">politique de confidentialité</span>
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 animate-fade-in stagger-4">
          <p className="text-ds-text-muted/50 text-[11px] font-medium tracking-wide">
            Données patient 100% locales · Aucun stockage serveur
          </p>
        </div>
      </div>
    </div>
  );
}

