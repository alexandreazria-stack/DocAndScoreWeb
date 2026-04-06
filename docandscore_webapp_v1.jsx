import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════
// DOC&SCORE — Web App Mockup v1
// Design: "Clinical Serenity" — Sky blue + White, warm & trustworthy
// Stack: Vite + React + Supabase (mockup)
// ═══════════════════════════════════════════════════════════════

const COLORS = {
  sky: "#5BA4C9",
  skyLight: "#8DC5E0",
  skyPale: "#E3F1F8",
  skyGhost: "#F0F7FB",
  white: "#FFFFFF",
  offwhite: "#F5F8FA",
  bg: "#EEF2F5",
  text: "#1B2B3A",
  textSecondary: "#5A6D7E",
  textMuted: "#8B9DAD",
  border: "#DAE2EA",
  borderLight: "#EDF1F5",
  success: "#3BBF8F",
  successPale: "#E6F7F0",
  warning: "#E9A84C",
  warningPale: "#FFF5E6",
  error: "#E15B5B",
  errorPale: "#FDECEC",
  pro: "#7C6BDB",
  proPale: "#EEEAFF",
};

// ═══════ QUESTIONNAIRES DATA ═══════
const QUESTIONNAIRES = [
  {
    id: "phq9", acronym: "PHQ-9", name: "Patient Health Questionnaire",
    description: "Évaluation de la dépression", icon: "💭",
    specialties: ["Psychiatrie", "Médecine générale"],
    pathology: "Dépression", duration: "3 min", isPro: false, maxScore: 27,
    scoring: [
      { min: 0, max: 4, label: "Minimal", severity: "normal", color: COLORS.success },
      { min: 5, max: 9, label: "Léger", severity: "mild", color: "#7EC8A0" },
      { min: 10, max: 14, label: "Modéré", severity: "moderate", color: COLORS.warning },
      { min: 15, max: 19, label: "Modérément sévère", severity: "severe", color: "#E08A4C" },
      { min: 20, max: 27, label: "Sévère", severity: "critical", color: COLORS.error },
    ],
    questions: [
      "Peu d'intérêt ou de plaisir à faire les choses",
      "Être triste, déprimé(e) ou désespéré(e)",
      "Difficultés à s'endormir ou à rester endormi(e), ou dormir trop",
      "Se sentir fatigué(e) ou manquer d'énergie",
      "Avoir peu d'appétit ou manger trop",
      "Avoir une mauvaise opinion de soi-même",
      "Difficultés à se concentrer",
      "Bouger ou parler si lentement que les autres l'ont remarqué, ou au contraire être agité(e)",
      "Penser qu'il vaudrait mieux mourir ou penser à se faire du mal",
    ],
  },
  {
    id: "gad7", acronym: "GAD-7", name: "Generalized Anxiety Disorder",
    description: "Évaluation de l'anxiété", icon: "😰",
    specialties: ["Psychiatrie", "Médecine générale"],
    pathology: "Anxiété", duration: "2 min", isPro: false, maxScore: 21,
    scoring: [
      { min: 0, max: 4, label: "Minimal", severity: "normal", color: COLORS.success },
      { min: 5, max: 9, label: "Léger", severity: "mild", color: "#7EC8A0" },
      { min: 10, max: 14, label: "Modéré", severity: "moderate", color: COLORS.warning },
      { min: 15, max: 21, label: "Sévère", severity: "critical", color: COLORS.error },
    ],
    questions: [
      "Sentiment de nervosité, d'anxiété ou de tension",
      "Incapable d'arrêter de s'inquiéter ou de contrôler ses inquiétudes",
      "Inquiétude excessive à propos de différentes choses",
      "Difficulté à se détendre",
      "Agitation, difficulté à rester en place",
      "Devenir facilement contrarié(e) ou irritable",
      "Avoir peur que quelque chose de terrible puisse arriver",
    ],
  },
  {
    id: "eva", acronym: "EVA", name: "Échelle Visuelle Analogique",
    description: "Évaluation de la douleur", icon: "⚡",
    specialties: ["Toutes spécialités"],
    pathology: "Douleur", duration: "30 sec", isPro: false, maxScore: 10,
    scoring: [
      { min: 0, max: 0, label: "Pas de douleur", severity: "normal", color: COLORS.success },
      { min: 1, max: 3, label: "Douleur faible", severity: "mild", color: "#7EC8A0" },
      { min: 4, max: 6, label: "Douleur modérée", severity: "moderate", color: COLORS.warning },
      { min: 7, max: 9, label: "Douleur sévère", severity: "severe", color: "#E08A4C" },
      { min: 10, max: 10, label: "Douleur maximale", severity: "critical", color: COLORS.error },
    ],
    questions: ["Évaluez votre douleur actuelle"],
  },
  {
    id: "mmse", acronym: "MMSE", name: "Mini Mental State Examination",
    description: "Évaluation cognitive", icon: "🧠",
    specialties: ["Neurologie", "Gériatrie"],
    pathology: "Démence / Alzheimer", duration: "10 min", isPro: false, maxScore: 30,
    scoring: [
      { min: 27, max: 30, label: "Normal", severity: "normal", color: COLORS.success },
      { min: 21, max: 26, label: "Trouble léger", severity: "mild", color: "#7EC8A0" },
      { min: 16, max: 20, label: "Trouble modéré", severity: "moderate", color: COLORS.warning },
      { min: 10, max: 15, label: "Trouble modérément sévère", severity: "severe", color: "#E08A4C" },
      { min: 0, max: 9, label: "Trouble sévère", severity: "critical", color: COLORS.error },
    ],
    questions: ["Orientation temporelle", "Orientation spatiale", "Apprentissage", "Attention et calcul", "Rappel", "Langage", "Praxie constructive"],
  },
  {
    id: "epworth", acronym: "Epworth", name: "Échelle de somnolence d'Epworth",
    description: "Évaluation de la somnolence", icon: "😴",
    specialties: ["Pneumologie", "Neurologie"],
    pathology: "Somnolence / Apnée", duration: "2 min", isPro: false, maxScore: 24,
    scoring: [
      { min: 0, max: 10, label: "Normal", severity: "normal", color: COLORS.success },
      { min: 11, max: 14, label: "Somnolence légère", severity: "mild", color: "#7EC8A0" },
      { min: 15, max: 17, label: "Somnolence modérée", severity: "moderate", color: COLORS.warning },
      { min: 18, max: 24, label: "Somnolence sévère", severity: "critical", color: COLORS.error },
    ],
    questions: [
      "Assis en train de lire", "En regardant la télévision", "Assis inactif dans un lieu public",
      "Passager d'une voiture pendant 1h", "Allongé l'après-midi", "Assis en train de parler à quelqu'un",
      "Assis au calme après un repas sans alcool", "Au volant, arrêté quelques minutes dans le trafic",
    ],
  },
  { id: "moca", acronym: "MoCA", name: "Montreal Cognitive Assessment", description: "Évaluation cognitive avancée", icon: "🧩", specialties: ["Neurologie", "Gériatrie"], pathology: "Troubles cognitifs", duration: "10 min", isPro: true, maxScore: 30, scoring: [], questions: [] },
  { id: "nihss", acronym: "NIHSS", name: "NIH Stroke Scale", description: "Évaluation de l'AVC", icon: "🚑", specialties: ["Neurologie", "Urgences"], pathology: "AVC", duration: "6 min", isPro: true, maxScore: 42, scoring: [], questions: [] },
  { id: "gds15", acronym: "GDS-15", name: "Geriatric Depression Scale", description: "Dépression du sujet âgé", icon: "👴", specialties: ["Gériatrie"], pathology: "Dépression gériatrique", duration: "5 min", isPro: true, maxScore: 15, scoring: [], questions: [] },
  { id: "audit", acronym: "AUDIT", name: "Alcohol Use Disorders Test", description: "Évaluation de la consommation d'alcool", icon: "🛡️", specialties: ["Addictologie", "Médecine générale"], pathology: "Trouble de l'usage d'alcool", duration: "3 min", isPro: true, maxScore: 40, scoring: [], questions: [] },
  { id: "dn4", acronym: "DN4", name: "Douleur Neuropathique 4", description: "Diagnostic douleur neuropathique", icon: "⚡", specialties: ["Algologie", "Neurologie"], pathology: "Douleur neuropathique", duration: "2 min", isPro: true, maxScore: 10, scoring: [], questions: [] },
  { id: "hads", acronym: "HADS", name: "Hospital Anxiety & Depression Scale", description: "Anxiété et dépression hospitalière", icon: "🏥", specialties: ["Psychiatrie", "Médecine générale"], pathology: "Anxiété / Dépression", duration: "5 min", isPro: true, maxScore: 42, scoring: [], questions: [] },
  { id: "ipss", acronym: "IPSS", name: "International Prostate Symptom Score", description: "Symptômes prostatiques", icon: "🔬", specialties: ["Urologie"], pathology: "Hypertrophie prostatique", duration: "3 min", isPro: true, maxScore: 35, scoring: [], questions: [] },
];

const LIKERT_OPTIONS = [
  { value: 0, label: "Jamais" },
  { value: 1, label: "Plusieurs jours" },
  { value: 2, label: "Plus de la moitié du temps" },
  { value: 3, label: "Presque tous les jours" },
];

const SPECIALTIES = [
  { id: "all", label: "Tous", icon: "📋" },
  { id: "psy", label: "Psychiatrie", icon: "💭" },
  { id: "neuro", label: "Neurologie", icon: "🧠" },
  { id: "geriatrie", label: "Gériatrie", icon: "👴" },
  { id: "urgences", label: "Urgences", icon: "🚑" },
  { id: "pneumo", label: "Pneumologie", icon: "🫁" },
  { id: "douleur", label: "Douleur", icon: "⚡" },
  { id: "addictologie", label: "Addictologie", icon: "🛡️" },
  { id: "uro", label: "Urologie", icon: "🔬" },
];

// ═══════ STYLES ═══════
const styles = {
  app: {
    fontFamily: "'Nunito', 'Segoe UI', system-ui, sans-serif",
    color: COLORS.text,
    background: COLORS.bg,
    minHeight: "100vh",
    maxWidth: 480,
    margin: "0 auto",
    position: "relative",
    overflow: "hidden",
  },
  page: {
    paddingBottom: 80,
    minHeight: "100vh",
  },
};

// ═══════ COMPONENTS ═══════

function Logo({ size = "md" }) {
  const sizes = { sm: 18, md: 26, lg: 36 };
  const s = sizes[size] || sizes.md;
  return (
    <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: s, letterSpacing: -0.5 }}>
      <span style={{ color: COLORS.text }}>Doc</span>
      <span style={{ color: COLORS.sky }}>&</span>
      <span style={{ color: COLORS.text }}>Score</span>
    </span>
  );
}

function Card({ children, style, onClick, hover = false, ...props }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: COLORS.white,
        borderRadius: 16,
        border: `1px solid ${COLORS.borderLight}`,
        padding: 16,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        transform: hover && hovered ? "translateY(-2px)" : "none",
        boxShadow: hover && hovered
          ? "0 8px 24px rgba(91,164,201,0.12)"
          : "0 1px 3px rgba(0,0,0,0.04)",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

function Button({ children, variant = "primary", size = "md", disabled, onClick, style, fullWidth }) {
  const [pressed, setPressed] = useState(false);
  const baseStyle = {
    border: "none",
    borderRadius: 12,
    fontFamily: "inherit",
    fontWeight: 700,
    cursor: disabled ? "default" : "pointer",
    transition: "all 0.15s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    opacity: disabled ? 0.45 : 1,
    width: fullWidth ? "100%" : "auto",
    transform: pressed && !disabled ? "scale(0.97)" : "scale(1)",
  };
  const sizeStyles = {
    sm: { padding: "8px 16px", fontSize: 13 },
    md: { padding: "12px 24px", fontSize: 15 },
    lg: { padding: "16px 32px", fontSize: 17, borderRadius: 14 },
  };
  const variants = {
    primary: { background: COLORS.sky, color: "#fff" },
    secondary: { background: COLORS.skyPale, color: COLORS.sky },
    ghost: { background: "transparent", color: COLORS.textSecondary, padding: "8px 12px" },
    outline: { background: "transparent", color: COLORS.sky, border: `2px solid ${COLORS.sky}` },
    pro: { background: `linear-gradient(135deg, ${COLORS.pro}, #9B8CE8)`, color: "#fff" },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{ ...baseStyle, ...sizeStyles[size], ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

function Badge({ children, color = COLORS.sky, bg }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "3px 10px",
      borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: bg || `${color}18`, color,
      letterSpacing: 0.3,
    }}>
      {children}
    </span>
  );
}

function Input({ value, onChange, placeholder, icon, autoFocus, style: sx }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: COLORS.offwhite, borderRadius: 12,
      border: `1.5px solid ${COLORS.border}`, padding: "12px 16px",
      transition: "border-color 0.2s",
      ...sx,
    }}>
      {icon && <span style={{ fontSize: 18, opacity: 0.5 }}>{icon}</span>}
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          border: "none", outline: "none", background: "transparent",
          flex: 1, fontSize: 15, fontFamily: "inherit", color: COLORS.text,
        }}
      />
      {value && (
        <button onClick={() => onChange("")} style={{
          border: "none", background: "none", cursor: "pointer",
          fontSize: 16, color: COLORS.textMuted, padding: 0,
        }}>✕</button>
      )}
    </div>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      border: "none", borderRadius: 20,
      padding: "8px 16px", fontSize: 13, fontWeight: 600,
      fontFamily: "inherit", cursor: "pointer",
      background: active ? COLORS.sky : COLORS.white,
      color: active ? "#fff" : COLORS.textSecondary,
      transition: "all 0.15s ease",
      whiteSpace: "nowrap",
      boxShadow: active ? `0 2px 8px ${COLORS.sky}40` : "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      {label}
    </button>
  );
}

function ProgressBar({ value, max, height = 4 }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ height, borderRadius: height, background: COLORS.borderLight, overflow: "hidden" }}>
      <div style={{
        width: `${pct}%`, height: "100%", borderRadius: height,
        background: `linear-gradient(90deg, ${COLORS.skyLight}, ${COLORS.sky})`,
        transition: "width 0.4s ease",
      }} />
    </div>
  );
}

function ScoreGauge({ score, max, color, label }) {
  const pct = score / max;
  const circumference = Math.PI * 120;
  const offset = circumference * (1 - pct);
  return (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <svg width="160" height="100" viewBox="0 0 160 100">
        <path d="M 10 90 A 70 70 0 0 1 150 90" fill="none" stroke={COLORS.borderLight} strokeWidth="10" strokeLinecap="round" />
        <path d="M 10 90 A 70 70 0 0 1 150 90" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${circumference * 0.5}`}
          strokeDashoffset={`${offset * 0.5}`}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x="80" y="72" textAnchor="middle" style={{ fontSize: 32, fontWeight: 800, fontFamily: "'Nunito', sans-serif", fill: COLORS.text }}>{score}</text>
        <text x="80" y="92" textAnchor="middle" style={{ fontSize: 13, fill: COLORS.textMuted, fontFamily: "'Nunito', sans-serif" }}>/ {max}</text>
      </svg>
      <div style={{
        display: "inline-block", padding: "6px 20px", borderRadius: 20,
        background: `${color}15`, color, fontWeight: 700, fontSize: 14, marginTop: 4,
      }}>
        {label}
      </div>
    </div>
  );
}

function BottomNav({ active, onNavigate }) {
  const items = [
    { id: "dashboard", icon: "🏠", label: "Accueil" },
    { id: "search", icon: "🔍", label: "Recherche" },
    { id: "settings", icon: "⚙️", label: "Réglages" },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 480,
      background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)",
      borderTop: `1px solid ${COLORS.borderLight}`,
      display: "flex", justifyContent: "space-around", padding: "8px 0 20px",
      zIndex: 100,
    }}>
      {items.map(item => (
        <button key={item.id} onClick={() => onNavigate(item.id)} style={{
          border: "none", background: "none", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          padding: "4px 16px", fontFamily: "inherit",
          color: active === item.id ? COLORS.sky : COLORS.textMuted,
          transition: "color 0.2s",
        }}>
          <span style={{ fontSize: 22 }}>{item.icon}</span>
          <span style={{ fontSize: 11, fontWeight: active === item.id ? 700 : 500 }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// ═══════ SCREENS ═══════

function PasswordInput({ value, onChange, placeholder, autoFocus }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: COLORS.offwhite, borderRadius: 12,
      border: `1.5px solid ${COLORS.border}`, padding: "12px 16px",
      transition: "border-color 0.2s",
    }}>
      <span style={{ fontSize: 18, opacity: 0.5 }}>🔒</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        type={show ? "text" : "password"}
        autoFocus={autoFocus}
        style={{
          border: "none", outline: "none", background: "transparent",
          flex: 1, fontSize: 15, fontFamily: "inherit", color: COLORS.text,
        }}
      />
      <button onClick={() => setShow(s => !s)} style={{
        border: "none", background: "none", cursor: "pointer",
        fontSize: 14, color: COLORS.textMuted, padding: 0, fontFamily: "inherit",
      }}>
        {show ? "Masquer" : "Voir"}
      </button>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("signin"); // "signin" or "signup"
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
    if (!passwordLongEnough) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    setLoading(true);
    // Simule l'appel Supabase auth
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 800);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: `linear-gradient(170deg, ${COLORS.skyGhost} 0%, ${COLORS.white} 50%, ${COLORS.skyPale}30 100%)`,
      padding: 24,
    }}>
      <div style={{ marginBottom: 12, opacity: 0.2, fontSize: 64 }}>🩺</div>
      <Logo size="lg" />
      <p style={{ color: COLORS.textMuted, fontSize: 15, marginTop: 8, marginBottom: 36, fontWeight: 500 }}>
        Scores cliniques validés
      </p>

      {/* Tabs Sign In / Sign Up */}
      <div style={{
        display: "flex", width: "100%", maxWidth: 380,
        background: COLORS.offwhite, borderRadius: 14, padding: 4,
        marginBottom: 0,
      }}>
        {[
          { id: "signin", label: "Connexion" },
          { id: "signup", label: "Créer un compte" },
        ].map(tab => (
          <button key={tab.id} onClick={() => { setMode(tab.id); setError(""); }} style={{
            flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
            fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer",
            background: mode === tab.id ? COLORS.white : "transparent",
            color: mode === tab.id ? COLORS.sky : COLORS.textMuted,
            boxShadow: mode === tab.id ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
            transition: "all 0.2s ease",
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <Card style={{ width: "100%", maxWidth: 380, padding: 28, marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>
          {isSignUp ? "Créer votre compte" : "Bon retour !"}
        </h2>
        <p style={{ color: COLORS.textMuted, fontSize: 13, margin: "0 0 22px" }}>
          {isSignUp
            ? "Rejoignez Doc&Score en quelques secondes"
            : "Connectez-vous à votre espace médecin"}
        </p>

        {/* Email */}
        <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>
          Email professionnel
        </label>
        <Input value={email} onChange={setEmail} placeholder="dr.martin@gmail.com" icon="✉️" />

        {/* Password */}
        <div style={{ height: 14 }} />
        <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>
          Mot de passe
        </label>
        <PasswordInput value={password} onChange={setPassword} placeholder="Minimum 8 caractères" />
        {!isSignUp && (
          <div style={{ textAlign: "right", marginTop: 6 }}>
            <button style={{
              border: "none", background: "none", cursor: "pointer",
              fontSize: 12, color: COLORS.sky, fontFamily: "inherit", fontWeight: 600, padding: 0,
            }}>
              Mot de passe oublié ?
            </button>
          </div>
        )}

        {/* Confirm Password (signup only) */}
        {isSignUp && (
          <>
            <div style={{ height: 14 }} />
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>
              Confirmer le mot de passe
            </label>
            <PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="Retapez votre mot de passe" />
            {confirmPassword && !passwordsMatch && (
              <p style={{ color: COLORS.error, fontSize: 12, margin: "6px 0 0", fontWeight: 500 }}>
                ⚠ Les mots de passe ne correspondent pas
              </p>
            )}
          </>
        )}

        {/* Password strength indicator (signup only) */}
        {isSignUp && password && (
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: COLORS.borderLight, overflow: "hidden" }}>
              <div style={{
                width: password.length < 8 ? "30%" : password.length < 12 ? "60%" : "100%",
                height: "100%", borderRadius: 2,
                background: password.length < 8 ? COLORS.error : password.length < 12 ? COLORS.warning : COLORS.success,
                transition: "all 0.3s",
              }} />
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: password.length < 8 ? COLORS.error : password.length < 12 ? COLORS.warning : COLORS.success,
            }}>
              {password.length < 8 ? "Trop court" : password.length < 12 ? "Correct" : "Fort"}
            </span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{
            marginTop: 14, padding: "10px 14px", borderRadius: 10,
            background: COLORS.errorPale, color: COLORS.error,
            fontSize: 13, fontWeight: 500,
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Submit button */}
        <Button fullWidth variant="primary" size="lg"
          style={{ marginTop: 20 }}
          disabled={!canSubmit || loading}
          onClick={handleSubmit}
        >
          {loading ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{
                width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff", borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.6s linear infinite",
              }} />
              {isSignUp ? "Création..." : "Connexion..."}
            </span>
          ) : (
            isSignUp ? "Créer mon compte" : "Se connecter"
          )}
        </Button>

        {/* Separator */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, margin: "20px 0",
        }}>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
          <span style={{ fontSize: 12, color: COLORS.textMuted }}>ou</span>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
        </div>

        {/* Google OAuth button */}
        <button onClick={onLogin} style={{
          width: "100%", padding: "12px 20px", borderRadius: 12,
          border: `1.5px solid ${COLORS.border}`, background: COLORS.white,
          fontFamily: "inherit", fontSize: 14, fontWeight: 600,
          color: COLORS.text, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          transition: "all 0.15s",
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continuer avec Google
        </button>

        {/* Terms (signup only) */}
        {isSignUp && (
          <p style={{ color: COLORS.textMuted, fontSize: 11, textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
            En créant un compte, vous acceptez les{" "}
            <span style={{ color: COLORS.sky, cursor: "pointer" }}>conditions d'utilisation</span>
            {" "}et la{" "}
            <span style={{ color: COLORS.sky, cursor: "pointer" }}>politique de confidentialité</span>
          </p>
        )}
      </Card>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("Dr.");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [rpps, setRpps] = useState("");
  const [specialty, setSpecialty] = useState("");
  const titles = ["Dr.", "Pr.", "M.", "Mme"];
  const specs = [
    { id: "general", label: "Médecine générale", icon: "🩺" },
    { id: "neuro", label: "Neurologie", icon: "🧠" },
    { id: "psy", label: "Psychiatrie", icon: "💭" },
    { id: "geriatrie", label: "Gériatrie", icon: "👴" },
    { id: "orl", label: "ORL", icon: "👂" },
    { id: "urgences", label: "Urgences", icon: "🚑" },
    { id: "algologie", label: "Douleur", icon: "⚡" },
    { id: "pneumo", label: "Pneumologie", icon: "🫁" },
    { id: "uro", label: "Urologie", icon: "🔬" },
    { id: "addictologie", label: "Addictologie", icon: "🛡️" },
    { id: "cardio", label: "Cardiologie", icon: "❤️" },
    { id: "dermato", label: "Dermatologie", icon: "🧴" },
    { id: "rhumato", label: "Rhumatologie", icon: "🦴" },
    { id: "autre", label: "Autre", icon: "📋" },
  ];
  const canContinue = [
    lastName && firstName,
    true,
    specialty,
  ][step];

  return (
    <div style={{
      minHeight: "100vh", background: COLORS.offwhite,
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "40px 20px",
    }}>
      <Logo size="sm" />
      <p style={{ color: COLORS.textMuted, fontSize: 14, margin: "8px 0 32px" }}>
        Configurez votre profil en 30 secondes
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: i === step ? 24 : 8, height: 8, borderRadius: 4,
            background: i <= step ? COLORS.sky : COLORS.border,
            transition: "all 0.3s ease",
          }} />
        ))}
      </div>
      <Card style={{ width: "100%", maxWidth: 420, padding: 28 }}>
        {step === 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 22 }}>🩺</span>
              <h3 style={{ margin: 0, fontSize: 18 }}>Votre identité</h3>
            </div>
            <p style={{ color: COLORS.textMuted, fontSize: 13, margin: "0 0 20px" }}>Étape 1/3</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {titles.map(t => (
                <button key={t} onClick={() => setTitle(t)} style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                  fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  background: title === t ? COLORS.skyPale : COLORS.offwhite,
                  color: title === t ? COLORS.sky : COLORS.textSecondary,
                  outline: title === t ? `2px solid ${COLORS.sky}` : "none",
                  transition: "all 0.15s",
                }}>
                  {t}
                </button>
              ))}
            </div>
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>Nom *</label>
            <Input value={lastName} onChange={setLastName} placeholder="Martin" />
            <div style={{ height: 14 }} />
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>Prénom *</label>
            <Input value={firstName} onChange={setFirstName} placeholder="Jean" />
          </>
        )}
        {step === 1 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 22 }}>📧</span>
              <h3 style={{ margin: 0, fontSize: 18 }}>Vos coordonnées</h3>
            </div>
            <p style={{ color: COLORS.textMuted, fontSize: 13, margin: "0 0 20px" }}>Étape 2/3</p>
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>
              Téléphone <span style={{ color: COLORS.textMuted, fontWeight: 400 }}>(optionnel)</span>
            </label>
            <Input value={phone} onChange={setPhone} placeholder="06 12 34 56 78" />
            <div style={{ height: 14 }} />
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>
              N° RPPS <span style={{ color: COLORS.textMuted, fontWeight: 400 }}>(optionnel)</span>
            </label>
            <Input value={rpps} onChange={setRpps} placeholder="12345678901" />
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginTop: 20,
              padding: "12px 16px", borderRadius: 12, background: COLORS.skyPale,
              fontSize: 12, color: COLORS.sky, fontWeight: 500,
            }}>
              🔒 Données stockées de manière sécurisée
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 22 }}>🏥</span>
              <h3 style={{ margin: 0, fontSize: 18 }}>Votre spécialité</h3>
            </div>
            <p style={{ color: COLORS.textMuted, fontSize: 13, margin: "0 0 16px" }}>Étape 3/3 — Personnalise vos tests recommandés</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxHeight: 320, overflowY: "auto" }}>
              {specs.map(s => (
                <button key={s.id} onClick={() => setSpecialty(s.id)} style={{
                  padding: "14px 12px", borderRadius: 12, border: "none",
                  fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  background: specialty === s.id ? COLORS.skyPale : COLORS.offwhite,
                  outline: specialty === s.id ? `2px solid ${COLORS.sky}` : "none",
                  color: specialty === s.id ? COLORS.sky : COLORS.textSecondary,
                  transition: "all 0.15s",
                  transform: specialty === s.id ? "scale(1.03)" : "scale(1)",
                }}>
                  <span style={{ fontSize: 24 }}>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </>
        )}
      </Card>
      <div style={{ display: "flex", gap: 12, marginTop: 24, width: "100%", maxWidth: 420 }}>
        {step > 0 && (
          <Button variant="ghost" onClick={() => setStep(s => s - 1)}>← Retour</Button>
        )}
        <Button
          variant="primary" size="lg" fullWidth
          disabled={!canContinue}
          onClick={() => {
            if (step < 2) setStep(s => s + 1);
            else onComplete({ title, lastName, firstName, specialty });
          }}
        >
          {step === 2 ? "Commencer ✓" : "Continuer →"}
        </Button>
      </div>
    </div>
  );
}

function DashboardScreen({ doctor, onNavigate, onSelectTest, onSelectQR }) {
  const freeTests = QUESTIONNAIRES.filter(q => !q.isPro);
  const proTests = QUESTIONNAIRES.filter(q => q.isPro);
  return (
    <div style={{ ...styles.page, padding: "20px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <Logo size="md" />
        <Badge color={COLORS.success} bg={COLORS.successPale}>FREE</Badge>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "16px 0 4px" }}>
        Bonjour {doctor.title} {doctor.lastName} 👋
      </h1>
      <p style={{ color: COLORS.textMuted, fontSize: 14, margin: "0 0 20px" }}>
        {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
      </p>
      <div style={{
        padding: "10px 16px", borderRadius: 12, background: COLORS.proPale,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20, cursor: "pointer",
      }}>
        <span style={{ fontSize: 13, color: COLORS.pro, fontWeight: 600 }}>
          ⭐ Version gratuite — 5 tests disponibles
        </span>
        <span style={{ fontSize: 12, color: COLORS.pro, fontWeight: 700 }}>Passer à Pro →</span>
      </div>
      <Card hover onClick={() => onNavigate("search")} style={{
        display: "flex", alignItems: "center", gap: 12, marginBottom: 24,
        background: COLORS.offwhite, cursor: "pointer",
      }}>
        <span style={{ fontSize: 20, opacity: 0.4 }}>🔍</span>
        <span style={{ color: COLORS.textMuted, fontSize: 15 }}>Rechercher un test...</span>
      </Card>
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px", color: COLORS.textSecondary }}>
        Tests disponibles
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {freeTests.map((test, i) => (
          <Card key={test.id} hover style={{ animationDelay: `${i * 60}ms` }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: COLORS.skyPale,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                flexShrink: 0,
              }}>
                {test.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: COLORS.sky, fontSize: 14 }}>
                    {test.acronym}
                  </span>
                  <span style={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: 500 }}>{test.name}</span>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.textMuted }}>
                  {test.pathology} · {test.duration}
                </p>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <Button size="sm" variant="primary" onClick={() => onSelectTest(test)}>📋 Médecin</Button>
                  <Button size="sm" variant="secondary" onClick={() => onSelectQR(test)}>📱 QR Patient</Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: "24px 0 12px", color: COLORS.textSecondary }}>
        Tests Pro <Badge color={COLORS.pro}>PRO</Badge>
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {proTests.map(test => (
          <Card key={test.id} hover style={{ opacity: 0.7 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: COLORS.proPale,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                flexShrink: 0,
              }}>
                {test.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: COLORS.pro, fontSize: 14 }}>
                    {test.acronym}
                  </span>
                  <Badge color={COLORS.pro}>PRO</Badge>
                </div>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: COLORS.textMuted }}>{test.pathology}</p>
              </div>
              <span style={{ fontSize: 18, color: COLORS.textMuted }}>🔒</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SearchScreen({ onBack, onSelectTest, onSelectQR }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const filtered = QUESTIONNAIRES.filter(q => {
    const matchQuery = !query ||
      q.acronym.toLowerCase().includes(query.toLowerCase()) ||
      q.name.toLowerCase().includes(query.toLowerCase()) ||
      q.pathology.toLowerCase().includes(query.toLowerCase()) ||
      q.description.toLowerCase().includes(query.toLowerCase());
    const matchFilter = filter === "all" ||
      q.specialties.some(s => s.toLowerCase().includes(filter));
    return matchQuery && matchFilter;
  });
  return (
    <div style={{ ...styles.page, padding: "0 16px 16px" }}>
      <div style={{
        position: "sticky", top: 0, background: COLORS.bg, zIndex: 10,
        padding: "16px 0 12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <button onClick={onBack} style={{
            border: "none", background: "none", cursor: "pointer",
            fontSize: 22, color: COLORS.textSecondary, padding: 0,
          }}>←</button>
          <Input value={query} onChange={setQuery} placeholder="Rechercher par nom, pathologie..."
            icon="🔍" autoFocus style={{ flex: 1 }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {SPECIALTIES.map(s => (
            <Chip key={s.id} label={s.label} active={filter === s.id}
              onClick={() => setFilter(s.id)} />
          ))}
        </div>
      </div>
      <p style={{
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: COLORS.textMuted,
        margin: "12px 0",
      }}>
        {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(test => (
          <Card key={test.id} hover>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: test.isPro ? COLORS.proPale : COLORS.skyPale,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                flexShrink: 0,
              }}>{test.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700,
                    color: test.isPro ? COLORS.pro : COLORS.sky, fontSize: 14,
                  }}>{test.acronym}</span>
                  <span style={{ fontSize: 13, color: COLORS.text, fontWeight: 500 }}>{test.name}</span>
                  {test.isPro && <Badge color={COLORS.pro}>PRO</Badge>}
                </div>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: COLORS.textMuted }}>
                  {test.specialties.join(", ")} · {test.pathology} · {test.duration}
                </p>
                {!test.isPro && (
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <Button size="sm" variant="primary" onClick={() => onSelectTest(test)}>📋 Médecin</Button>
                    <Button size="sm" variant="secondary" onClick={() => onSelectQR(test)}>📱 QR Patient</Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>🔍</div>
            <p style={{ color: COLORS.textMuted, fontSize: 15 }}>
              Aucun test trouvé pour "{query}"
            </p>
            <p style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 4 }}>
              Essayez : dépression, douleur, mémoire, anxiété
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TestScreen({ test, onBack, onResult }) {
  const [answers, setAnswers] = useState({});
  const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
  const answered = Object.keys(answers).length;
  const total = test.questions.length;
  const allAnswered = answered === total;
  const isEVA = test.id === "eva";
  const [evaValue, setEvaValue] = useState(5);

  const getScoring = (score) => {
    const bracket = test.scoring.find(b => score >= b.min && score <= b.max);
    return bracket || test.scoring[test.scoring.length - 1];
  };

  const handleSubmit = () => {
    const score = isEVA ? evaValue : totalScore;
    onResult({
      test, answers: isEVA ? { 0: evaValue } : answers,
      totalScore: score, scoring: getScoring(score),
    });
  };

  return (
    <div style={{ ...styles.page, padding: 0 }}>
      <div style={{
        position: "sticky", top: 0, zIndex: 10, background: COLORS.white,
        borderBottom: `1px solid ${COLORS.borderLight}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={onBack} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, color: COLORS.textSecondary, padding: 0 }}>←</button>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: COLORS.sky, fontSize: 16 }}>{test.acronym}</span>
            <Badge color={COLORS.sky}>MÉDECIN</Badge>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: COLORS.sky }}>
              {isEVA ? evaValue : totalScore}
            </span>
            <span style={{ fontSize: 14, color: COLORS.textMuted }}> / {test.maxScore}</span>
          </div>
        </div>
        <ProgressBar value={isEVA ? 1 : answered} max={total} />
      </div>

      <div style={{ padding: "20px 16px" }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 4px" }}>{test.name}</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 13, margin: "0 0 24px" }}>
          {test.description} · {test.duration}
        </p>

        {isEVA ? (
          <Card style={{ padding: 24, textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 24 }}>
              {test.questions[0]}
            </p>
            <div style={{ fontSize: 56, fontWeight: 800, color: evaValue <= 3 ? COLORS.success : evaValue <= 6 ? COLORS.warning : COLORS.error, marginBottom: 16 }}>
              {evaValue}
            </div>
            <input
              type="range" min="0" max="10" value={evaValue}
              onChange={e => setEvaValue(Number(e.target.value))}
              style={{ width: "100%", accentColor: COLORS.sky }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: COLORS.textMuted, marginTop: 8 }}>
              <span>Aucune douleur</span>
              <span>Douleur maximale</span>
            </div>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {test.questions.map((q, idx) => (
              <Card key={idx} style={{
                border: answers[idx] !== undefined ? `2px solid ${COLORS.skyLight}` : `1px solid ${COLORS.borderLight}`,
                background: answers[idx] !== undefined ? COLORS.skyGhost : COLORS.white,
              }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
                    color: COLORS.sky, fontWeight: 700,
                  }}>Q{String(idx + 1).padStart(2, "0")}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>{q}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {LIKERT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setAnswers(a => ({ ...a, [idx]: opt.value }))}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px", borderRadius: 10, border: "none",
                        fontFamily: "inherit", fontSize: 14, cursor: "pointer",
                        background: answers[idx] === opt.value ? COLORS.skyPale : COLORS.offwhite,
                        color: answers[idx] === opt.value ? COLORS.sky : COLORS.textSecondary,
                        fontWeight: answers[idx] === opt.value ? 700 : 400,
                        outline: answers[idx] === opt.value ? `2px solid ${COLORS.sky}` : "none",
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{
                        width: 24, height: 24, borderRadius: 12, fontSize: 11,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: answers[idx] === opt.value ? COLORS.sky : COLORS.border,
                        color: answers[idx] === opt.value ? "#fff" : COLORS.textMuted,
                        fontWeight: 700,
                      }}>{opt.value}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div style={{
        position: "sticky", bottom: 0, padding: "12px 16px 24px",
        background: "linear-gradient(transparent, white 30%)",
      }}>
        <Button
          fullWidth variant="primary" size="lg"
          disabled={!isEVA && !allAnswered}
          onClick={handleSubmit}
        >
          {allAnswered || isEVA
            ? "Voir les résultats →"
            : `${answered}/${total} questions répondues`}
        </Button>
      </div>
    </div>
  );
}

function ResultScreen({ result, doctor, onBack, onHome }) {
  const { test, totalScore, scoring, answers } = result;
  const [patientName, setPatientName] = useState("");
  const [patientFirstName, setPatientFirstName] = useState("");
  const [patientDob, setPatientDob] = useState("");
  const [showPdf, setShowPdf] = useState(false);
  const [copied, setCopied] = useState(false);

  const clipText = `${test.acronym} — ${patientName.toUpperCase()} ${patientFirstName} (${patientDob})\nScore : ${totalScore}/${test.maxScore} — ${scoring.label}\nDate : ${new Date().toLocaleDateString("fr-FR")} — ${doctor.title} ${doctor.lastName}`;

  return (
    <div style={{ ...styles.page, padding: "0 16px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 0" }}>
        <button onClick={onBack} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, color: COLORS.textSecondary, padding: 0 }}>←</button>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: COLORS.sky, fontSize: 16 }}>{test.acronym}</span>
        <span style={{ fontSize: 14, color: COLORS.textMuted }}>Résultats</span>
      </div>

      <Card style={{ padding: 24, marginBottom: 16 }}>
        <ScoreGauge score={totalScore} max={test.maxScore} color={scoring.color} label={scoring.label} />
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 18 }}>👤</span>
          <h3 style={{ margin: 0, fontSize: 16 }}>Identité du patient</h3>
          <Badge color={COLORS.sky}>LOCAL UNIQUEMENT</Badge>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Input value={patientName} onChange={setPatientName} placeholder="Nom" />
          <Input value={patientFirstName} onChange={setPatientFirstName} placeholder="Prénom" />
          <Input value={patientDob} onChange={setPatientDob} placeholder="Date de naissance (JJ/MM/AAAA)" />
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginTop: 14,
          padding: "10px 14px", borderRadius: 10, background: COLORS.skyPale,
          fontSize: 11, color: COLORS.sky, fontWeight: 500,
        }}>
          🔒 Ces données restent sur votre appareil. Elles ne sont jamais envoyées au serveur.
        </div>
      </Card>

      {!showPdf ? (
        <Button fullWidth variant="primary" size="lg" disabled={!patientName}
          onClick={() => setShowPdf(true)}>
          📄 Générer le PDF
        </Button>
      ) : (
        <>
          <Card style={{ marginBottom: 16, background: COLORS.offwhite }}>
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: COLORS.textMuted }}>APERÇU DU PDF</span>
            </div>
            <div style={{
              background: COLORS.white, borderRadius: 8, padding: 20,
              border: `1px solid ${COLORS.border}`, fontSize: 13, lineHeight: 1.8,
            }}>
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <Logo size="sm" />
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>Compte-rendu de score clinique</div>
                <div style={{ height: 1, background: COLORS.skyLight, margin: "8px 0" }} />
              </div>
              <div style={{ color: COLORS.textSecondary }}>
                <strong>Patient :</strong> {patientName.toUpperCase()} {patientFirstName}<br />
                <strong>Né(e) le :</strong> {patientDob || "—"}<br />
                <strong>Date :</strong> {new Date().toLocaleDateString("fr-FR")} à {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}<br />
                <strong>Praticien :</strong> {doctor.title} {doctor.lastName}
              </div>
              <div style={{
                margin: "12px 0", padding: 12, borderRadius: 8,
                background: `${scoring.color}10`, border: `1px solid ${scoring.color}30`,
                textAlign: "center",
              }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: COLORS.sky }}>{test.acronym} — {test.name}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: scoring.color, margin: "6px 0" }}>
                  {totalScore} / {test.maxScore}
                </div>
                <div style={{ fontWeight: 700, color: scoring.color }}>{scoring.label}</div>
              </div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, textAlign: "center", marginTop: 12 }}>
                Généré par Doc&Score — docandscore.app<br />
                Aucune donnée patient stockée sur nos serveurs.
              </div>
            </div>
          </Card>
          <div style={{ display: "flex", gap: 10 }}>
            <Button fullWidth variant="primary" onClick={() => {}}>
              📄 Télécharger
            </Button>
            <Button fullWidth variant="secondary" onClick={() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}>
              {copied ? "✓ Copié !" : "📋 Copier"}
            </Button>
            <Button fullWidth variant="outline" onClick={() => {}}>
              📤 Partager
            </Button>
          </div>
        </>
      )}

      <div style={{ marginTop: 24, textAlign: "center" }}>
        <Button variant="ghost" onClick={onHome}>← Retour à l'accueil</Button>
      </div>
    </div>
  );
}

function QRScreen({ test, doctor, onBack, onResult }) {
  const [status, setStatus] = useState("waiting");
  const [progress, setProgress] = useState({ answered: 0, total: test.questions.length });
  const code = "A7K2M9";
  const url = `docandscore.app/session/${code}`;

  useEffect(() => {
    const t1 = setTimeout(() => setStatus("connected"), 3000);
    const t2 = setTimeout(() => { setStatus("progress"); setProgress({ answered: 3, total: test.questions.length }); }, 5000);
    const t3 = setTimeout(() => setProgress({ answered: 6, total: test.questions.length }), 7000);
    const t4 = setTimeout(() => {
      setStatus("completed");
      const score = Math.floor(Math.random() * test.maxScore);
      const bracket = test.scoring.find(b => score >= b.min && score <= b.max) || test.scoring[0];
      setTimeout(() => onResult({
        test,
        answers: Object.fromEntries(test.questions.map((_, i) => [i, Math.floor(Math.random() * 4)])),
        totalScore: score,
        scoring: bracket,
      }), 1500);
    }, 9000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  const statusConfig = {
    waiting: { icon: "⏳", label: "En attente du patient...", color: COLORS.textMuted, pulse: true },
    connected: { icon: "📱", label: "Patient connecté", color: COLORS.sky, pulse: true },
    progress: { icon: "✍️", label: `En cours — ${progress.answered}/${progress.total}`, color: COLORS.sky, pulse: false },
    completed: { icon: "✅", label: "Terminé !", color: COLORS.success, pulse: false },
  };
  const s = statusConfig[status];

  return (
    <div style={{ ...styles.page, padding: "0 16px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 0" }}>
        <button onClick={onBack} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, color: COLORS.textSecondary, padding: 0 }}>←</button>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: COLORS.sky }}>{test.acronym}</span>
        <Badge color={COLORS.sky}>QR PATIENT</Badge>
      </div>
      <Card style={{ padding: 28, textAlign: "center", marginBottom: 16 }}>
        <p style={{ color: COLORS.textMuted, fontSize: 14, margin: "0 0 20px" }}>
          Demandez au patient de scanner ce code
        </p>
        <div style={{
          width: 220, height: 220, margin: "0 auto 16px",
          background: COLORS.white, borderRadius: 16,
          border: `3px solid ${COLORS.sky}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(11, 1fr)", gap: 2,
            width: 160, height: 160,
          }}>
            {Array.from({ length: 121 }, (_, i) => (
              <div key={i} style={{
                background: Math.random() > 0.55 ? COLORS.text : "transparent",
                borderRadius: 1,
              }} />
            ))}
          </div>
        </div>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 28,
          fontWeight: 800, color: COLORS.sky, letterSpacing: 6,
          margin: "8px 0 4px",
        }}>{code}</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 16 }}>{url}</div>
        <Button variant="secondary" size="sm">📋 Copier le lien</Button>
      </Card>
      <Card style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: status === "progress" ? 12 : 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 18,
            background: `${s.color}15`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
            animation: s.pulse ? "pulse 2s infinite" : "none",
          }}>
            {s.icon}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: s.color }}>{s.label}</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>
              {status === "waiting" ? "Le QR code expire dans 28:42" : "Session en cours"}
            </div>
          </div>
        </div>
        {status === "progress" && (
          <ProgressBar value={progress.answered} max={progress.total} height={6} />
        )}
      </Card>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}

function PatientScreen({ test, doctor, onComplete }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const total = test.questions.length;

  if (submitted) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: COLORS.white, padding: 32, textAlign: "center",
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 40, background: COLORS.successPale,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36, marginBottom: 20,
        }}>✓</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>Envoyé avec succès</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 15, margin: "0 0 32px" }}>
          Vos réponses ont été transmises au {doctor.title} {doctor.lastName}.<br />
          Vous pouvez fermer cette page.
        </p>
        <Button variant="ghost" onClick={onComplete}>← Retour à la démo</Button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: COLORS.white, padding: 0,
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.borderLight}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Logo size="sm" />
          <span style={{ fontSize: 12, color: COLORS.textMuted }}>
            Prescrit par {doctor.title} {doctor.lastName}
          </span>
        </div>
        <ProgressBar value={currentQ + (answers[currentQ] !== undefined ? 1 : 0)} max={total} height={5} />
        <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 6, fontWeight: 600 }}>
          Question {currentQ + 1} / {total}
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "28px 20px" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.5, marginBottom: 28 }}>
          {test.questions[currentQ]}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {LIKERT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                setAnswers(a => ({ ...a, [currentQ]: opt.value }));
                setTimeout(() => {
                  if (currentQ < total - 1) setCurrentQ(c => c + 1);
                }, 300);
              }}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "16px 20px", borderRadius: 14, border: "none",
                fontFamily: "inherit", fontSize: 16, cursor: "pointer",
                background: answers[currentQ] === opt.value ? COLORS.skyPale : COLORS.offwhite,
                color: answers[currentQ] === opt.value ? COLORS.sky : COLORS.text,
                fontWeight: answers[currentQ] === opt.value ? 700 : 400,
                outline: answers[currentQ] === opt.value ? `2.5px solid ${COLORS.sky}` : "none",
                transition: "all 0.15s",
                minHeight: 56,
              }}
            >
              <span style={{
                width: 32, height: 32, borderRadius: 16, fontSize: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: answers[currentQ] === opt.value ? COLORS.sky : COLORS.border,
                color: answers[currentQ] === opt.value ? "#fff" : COLORS.textMuted,
                fontWeight: 700, flexShrink: 0,
              }}>{opt.value}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{
        padding: "12px 20px 28px",
        display: "flex", gap: 10,
        background: "linear-gradient(transparent, white 30%)",
      }}>
        {currentQ > 0 && (
          <Button variant="ghost" onClick={() => setCurrentQ(c => c - 1)}>← Précédent</Button>
        )}
        <div style={{ flex: 1 }} />
        {currentQ === total - 1 && Object.keys(answers).length === total ? (
          <Button variant="primary" size="lg" onClick={() => setSubmitted(true)}>
            Envoyer au {doctor.title} {doctor.lastName} →
          </Button>
        ) : (
          currentQ < total - 1 && answers[currentQ] !== undefined && (
            <Button variant="primary" onClick={() => setCurrentQ(c => c + 1)}>Suivant →</Button>
          )
        )}
      </div>
      <div style={{
        padding: "10px 20px 20px", borderTop: `1px solid ${COLORS.borderLight}`,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        background: COLORS.offwhite,
      }}>
        <span style={{ fontSize: 14 }}>📱</span>
        <span style={{ fontSize: 12, color: COLORS.textMuted }}>
          Installer Doc&Score sur votre téléphone
        </span>
        <Button variant="secondary" size="sm" style={{ padding: "4px 12px", fontSize: 11 }}>
          Installer
        </Button>
      </div>
    </div>
  );
}

function SettingsScreen({ doctor }) {
  return (
    <div style={{ ...styles.page, padding: "20px 16px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 24px" }}>Réglages</h1>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 26, background: COLORS.skyPale,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 700, color: COLORS.sky,
          }}>
            {doctor.firstName?.[0]}{doctor.lastName?.[0]}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {doctor.title} {doctor.firstName} {doctor.lastName}
            </div>
            <div style={{ color: COLORS.textMuted, fontSize: 13 }}>dr.martin@gmail.com</div>
            <Badge color={COLORS.success} bg={COLORS.successPale}>Plan gratuit</Badge>
          </div>
        </div>
      </Card>
      {[
        { icon: "👤", label: "Modifier mon profil" },
        { icon: "🏥", label: "Changer de spécialité" },
        { icon: "⭐", label: "Passer à Pro", badge: true },
        { icon: "🔒", label: "Confidentialité" },
        { icon: "❓", label: "Aide & support" },
        { icon: "📄", label: "Mentions légales" },
      ].map((item, i) => (
        <Card key={i} hover style={{ marginBottom: 8, padding: "14px 16px", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 500 }}>{item.label}</span>
            </div>
            {item.badge ? <Badge color={COLORS.pro}>PRO</Badge> : <span style={{ color: COLORS.textMuted }}>›</span>}
          </div>
        </Card>
      ))}
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <p style={{ fontSize: 12, color: COLORS.textMuted }}>Doc&Score v1.0.0</p>
        <p style={{ fontSize: 11, color: COLORS.textMuted }}>Vite + React + Supabase</p>
      </div>
    </div>
  );
}

// ═══════ APP ═══════
export default function App() {
  const [screen, setScreen] = useState("login");
  const [doctor, setDoctor] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedTest, setSelectedTest] = useState(null);
  const [result, setResult] = useState(null);
  const [showPatientDemo, setShowPatientDemo] = useState(false);

  const handleLogin = () => setScreen("onboarding");
  const handleOnboarding = (profile) => {
    setDoctor(profile);
    setScreen("app");
  };
  const handleSelectTest = (test) => { setSelectedTest(test); setScreen("test"); };
  const handleSelectQR = (test) => { setSelectedTest(test); setScreen("qr"); };
  const handleResult = (res) => { setResult(res); setScreen("result"); };
  const handleHome = () => { setScreen("app"); setActiveTab("dashboard"); setSelectedTest(null); setResult(null); };
  const handleNavigate = (tab) => { setActiveTab(tab); setScreen("app"); };

  if (screen === "login") return <div style={styles.app}><LoginScreen onLogin={handleLogin} /></div>;
  if (screen === "onboarding") return <div style={styles.app}><OnboardingScreen onComplete={handleOnboarding} /></div>;

  if (showPatientDemo && selectedTest) {
    return (
      <div style={styles.app}>
        <PatientScreen test={selectedTest} doctor={doctor} onComplete={() => { setShowPatientDemo(false); handleHome(); }} />
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;700&display=swap" rel="stylesheet" />

      {screen === "app" && activeTab === "dashboard" && (
        <DashboardScreen doctor={doctor} onNavigate={handleNavigate}
          onSelectTest={handleSelectTest}
          onSelectQR={handleSelectQR}
        />
      )}
      {screen === "app" && activeTab === "search" && (
        <SearchScreen onBack={() => setActiveTab("dashboard")}
          onSelectTest={handleSelectTest}
          onSelectQR={handleSelectQR}
        />
      )}
      {screen === "app" && activeTab === "settings" && (
        <SettingsScreen doctor={doctor} />
      )}
      {screen === "test" && selectedTest && (
        <TestScreen test={selectedTest} onBack={handleHome} onResult={handleResult} />
      )}
      {screen === "result" && result && (
        <ResultScreen result={result} doctor={doctor} onBack={() => setScreen("test")} onHome={handleHome} />
      )}
      {screen === "qr" && selectedTest && (
        <>
          <QRScreen test={selectedTest} doctor={doctor} onBack={handleHome} onResult={handleResult} />
          <div style={{ padding: "0 16px 24px" }}>
            <Button fullWidth variant="outline" onClick={() => setShowPatientDemo(true)}>
              👁️ Simuler la vue patient
            </Button>
          </div>
        </>
      )}

      {screen === "app" && (
        <BottomNav active={activeTab} onNavigate={handleNavigate} />
      )}
    </div>
  );
}
