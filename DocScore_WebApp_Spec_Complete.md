# Doc&Score — Spécification Technique Complète
## Web App → Capacitor (iOS/Android)
### v4.0 — Avril 2026

---

# TABLE DES MATIÈRES

1. [Architecture & Stack](#1-architecture--stack)
2. [Arborescence du projet](#2-arborescence-du-projet)
3. [Phase 1 — Setup & Infra](#3-phase-1--setup--infra)
4. [Phase 2 — Auth & Onboarding](#4-phase-2--auth--onboarding)
5. [Phase 3 — Base de questionnaires](#5-phase-3--base-de-questionnaires)
6. [Phase 4 — Interface médecin](#6-phase-4--interface-médecin)
7. [Phase 5 — Flux QR patient](#7-phase-5--flux-qr-patient)
8. [Phase 6 — Temps réel (WebSocket)](#8-phase-6--temps-réel-websocket)
9. [Phase 7 — Génération PDF locale](#9-phase-7--génération-pdf-locale)
10. [Phase 8 — Monétisation & Paywall](#10-phase-8--monétisation--paywall)
11. [Phase 9 — PWA patient](#11-phase-9--pwa-patient)
12. [Phase 10 — Sécurité & RGPD](#12-phase-10--sécurité--rgpd)
13. [Phase 11 — Capacitor (stores)](#13-phase-11--capacitor-stores)
14. [Annexe A — Les 20 questionnaires de lancement](#14-annexe-a--les-20-questionnaires-de-lancement)
15. [Annexe B — Modèle économique](#15-annexe-b--modèle-économique)

---

# 1. ARCHITECTURE & STACK

## Concept

Doc&Score est un outil pour médecins permettant d'administrer des questionnaires de scores cliniques validés (PHQ-9, MMSE, EVA, etc.), avec deux modes : le médecin remplit lui-même, ou il génère un QR code que le patient scanne pour répondre sur son propre téléphone. Le patient ne voit jamais les résultats. Le médecin reçoit le score en temps réel + génère un PDF local avec l'identité patient (qui ne quitte jamais son appareil).

## Décision d'architecture : Pourquoi Web App

On part sur une web app unique (Next.js) plutôt qu'une app React Native, pour ces raisons :
- Dev et debug dans le navigateur (Chrome DevTools, responsive)
- POC partageable par URL instantanément
- Une seule codebase pour médecin + patient
- Wrap Capacitor en fin de projet pour les stores
- La biométrie (Face ID / Touch ID) est disponible via le plugin Capacitor

## Stack technique

```
FRONTEND (une seule app Next.js)
├── Framework      : Next.js 14+ (App Router)
├── Langage        : TypeScript strict
├── Style          : Tailwind CSS 3
├── State          : Zustand (persist avec localStorage)
├── Temps réel     : Socket.IO client
├── QR Code        : qrcode.react
├── PDF            : jsPDF (génération 100% client)
├── Auth           : Supabase Auth (magic link + OAuth Google)
├── Hébergement    : Vercel (frontend)
└── Wrap natif     : Capacitor (fin de projet)

BACKEND (API séparée)
├── Runtime        : Node.js 20+
├── Framework      : Fastify
├── WebSocket      : Socket.IO
├── Validation     : Zod
├── Hébergement    : Railway
└── Base de données : Supabase (PostgreSQL)

BASE DE DONNÉES (Supabase)
├── Auth           : comptes médecins (magic link)
├── Profils        : spécialité, RPPS, plan (free/pro)
├── Sessions QR    : table éphémère avec TTL
├── Questionnaires : statiques, en code (pas en BDD)
└── Abonnements    : tracking du plan actif
```

## Pourquoi Supabase plutôt que Redis seul

On avait initialement prévu un serveur de transit pur avec Redis. Mais avec la web app, on a besoin de :
- Auth persistante (le médecin se connecte une fois, reste connecté)
- Profil médecin (nom, spécialité, plan) — avant c'était sur le téléphone
- Tracking des abonnements (freemium)
- Historique optionnel des scores (sans identité patient, juste les scores pour le médecin)

Supabase donne tout ça gratuitement (jusqu'à 50 000 utilisateurs, 500 MB de stockage). Et c'est du PostgreSQL standard, donc pas de vendor lock-in.

## Ce qui reste en transit pur (JAMAIS stocké)

- Les réponses brutes du patient → transitent par WebSocket, purgées
- L'identité patient (nom, prénom, DDN) → JAMAIS envoyée au serveur, saisie localement par le médecin dans le navigateur, stockée uniquement en mémoire JS le temps de générer le PDF
- Le PDF → généré côté client avec jsPDF, jamais uploadé

## Schéma d'architecture

```
┌─────────────┐     HTTPS      ┌──────────────┐     PostgreSQL    ┌──────────┐
│  Vercel     │◄──────────────►│  Railway      │◄────────────────►│ Supabase │
│  (Next.js)  │     WSS        │  (Fastify +   │                  │ (PgSQL)  │
│  Frontend   │◄══════════════►│  Socket.IO)   │                  │ + Auth   │
└─────────────┘                └──────────────┘                  └──────────┘
      │                              │
      │  HTTPS                       │ WSS
      ▼                              ▼
┌─────────────┐              ┌──────────────┐
│  Médecin    │              │  Patient     │
│  (navigateur│              │  (navigateur │
│  ou Capacitor)             │  mobile)     │
└─────────────┘              └──────────────┘
```

---

# 2. ARBORESCENCE DU PROJET

```
docandscore/
├── apps/
│   └── web/                          # Next.js app (Vercel)
│       ├── app/
│       │   ├── layout.tsx            # Root layout + providers
│       │   ├── page.tsx              # Landing / redirect
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx    # Magic link login
│       │   │   └── onboarding/page.tsx
│       │   ├── (doctor)/             # Routes médecin (auth required)
│       │   │   ├── layout.tsx        # Sidebar + bottom nav
│       │   │   ├── dashboard/page.tsx
│       │   │   ├── search/page.tsx
│       │   │   ├── test/[testId]/page.tsx      # Passation médecin
│       │   │   ├── qr/[testId]/page.tsx        # QR + monitoring
│       │   │   ├── result/[sessionId]/page.tsx # Résultat + PDF
│       │   │   └── settings/page.tsx
│       │   └── (patient)/            # Routes patient (pas d'auth)
│       │       └── session/[code]/page.tsx     # Questionnaire patient
│       ├── components/
│       │   ├── ui/                   # Design system
│       │   │   ├── Button.tsx
│       │   │   ├── Card.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Badge.tsx
│       │   │   ├── Chip.tsx
│       │   │   ├── ProgressBar.tsx
│       │   │   ├── ScoreGauge.tsx    # SVG circulaire animé
│       │   │   ├── Modal.tsx
│       │   │   └── BottomNav.tsx
│       │   ├── questionnaire/
│       │   │   ├── ScoreButtons.tsx
│       │   │   ├── LikertScale.tsx
│       │   │   ├── PainSlider.tsx
│       │   │   ├── YesNoButtons.tsx
│       │   │   └── QuestionRenderer.tsx
│       │   └── results/
│       │       ├── ResultCard.tsx
│       │       ├── PatientIdentity.tsx  # Champs locaux
│       │       └── PdfPreview.tsx
│       ├── lib/
│       │   ├── types.ts
│       │   ├── questionnaires/       # 1 fichier par test
│       │   │   ├── index.ts          # Export centralisé
│       │   │   ├── phq9.ts
│       │   │   ├── gad7.ts
│       │   │   ├── mmse.ts
│       │   │   └── ...
│       │   ├── scoring.ts            # Moteur de scoring
│       │   ├── search.ts             # Recherche full-text
│       │   ├── specialties.ts        # 14 spécialités
│       │   ├── socket.ts             # Client Socket.IO
│       │   ├── pdf.ts                # Génération jsPDF
│       │   ├── supabase.ts           # Client Supabase
│       │   └── constants.ts
│       ├── stores/
│       │   └── useAppStore.ts        # Zustand
│       ├── middleware.ts             # Auth guard
│       ├── tailwind.config.ts
│       ├── next.config.js
│       └── capacitor.config.ts       # Ajouté en phase 11
│
├── apps/
│   └── api/                          # Fastify server (Railway)
│       ├── src/
│       │   ├── index.ts              # Point d'entrée
│       │   ├── routes/
│       │   │   ├── session.ts        # CRUD sessions QR
│       │   │   └── health.ts
│       │   ├── ws/
│       │   │   └── handler.ts        # Socket.IO events
│       │   ├── services/
│       │   │   ├── scoring.ts        # Calcul serveur (double vérif)
│       │   │   └── session.ts        # Logique session
│       │   └── validation.ts         # Schémas Zod
│       ├── Dockerfile
│       └── package.json
│
├── supabase/
│   └── migrations/
│       ├── 001_profiles.sql
│       ├── 002_sessions.sql
│       └── 003_rls_policies.sql
│
├── package.json                      # Workspace root
├── turbo.json                        # Turborepo config
└── README.md
```

---

# 3. PHASE 1 — SETUP & INFRA

## Prompt 1.1 : Initialisation du monorepo

```
Crée un monorepo pour Doc&Score avec Turborepo.

Workspace structure :
- apps/web : Next.js 14 (App Router) + TypeScript + Tailwind CSS 3
- apps/api : Node.js + Fastify + TypeScript

Root package.json avec les scripts :
  "dev": "turbo dev"
  "build": "turbo build"
  "dev:web": "cd apps/web && next dev"
  "dev:api": "cd apps/api && tsx watch src/index.ts"

apps/web :
  Dépendances : next, react, react-dom, tailwindcss, @supabase/supabase-js,
  zustand, socket.io-client, qrcode.react, jspdf, framer-motion, zod
  
  tailwind.config.ts — palette Doc&Score :
    colors: {
      ds: {
        sky: '#7EC8E3',        // Bleu ciel principal
        skyLight: '#B8E2F2',   // Bleu ciel clair (hover, badges)
        skyPale: '#E8F4F8',    // Fond des cartes actives
        white: '#FFFFFF',      // Fond principal
        offwhite: '#F6F9FC',   // Fond page
        text: '#1A2B3C',       // Texte principal
        textMuted: '#6B7C8D',  // Texte secondaire
        border: '#E2E8F0',     // Bordures
        success: '#34D399',    // Vert validation
        warning: '#FBBF24',    // Orange attention
        error: '#F87171',      // Rouge erreur
        pro: '#8B5CF6',        // Violet badge Pro
      }
    }
    fontFamily: {
      display: ['Outfit', 'sans-serif'],
      mono: ['IBM Plex Mono', 'monospace'],
      body: ['Inter', 'sans-serif'],
    }

apps/api :
  Dépendances : fastify, @fastify/cors, @fastify/rate-limit,
  @fastify/helmet, socket.io, zod, @supabase/supabase-js
  
  src/index.ts minimal : Fastify qui écoute sur PORT,
  avec un GET /health qui retourne { status: 'ok', timestamp }

Ajoute un .env.example à la racine :
  # Supabase
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  
  # API
  API_URL=http://localhost:3001
  NEXT_PUBLIC_API_URL=http://localhost:3001
  PORT=3001
  
  # App
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  CORS_ORIGIN=http://localhost:3000
```

## Prompt 1.2 : Setup Supabase

```
Configure Supabase pour Doc&Score.

1. Crée un projet Supabase "docandscore"

2. Active l'auth avec :
   - Email + Password (signup avec confirmation email)
   - Google OAuth (pour connexion rapide)
   - Password recovery (reset par email)
   - Minimum password length : 8 caractères
   - Désactive la confirmation email pour le dev (activer en prod)

3. Crée les tables SQL :

-- Table profiles (extend auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  title TEXT CHECK (title IN ('Dr.', 'Pr.', 'M.', 'Mme')) DEFAULT 'Dr.',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  rpps TEXT,                    -- N° RPPS (11 chiffres)
  specialty TEXT NOT NULL,       -- ID de la spécialité
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  plan_expires_at TIMESTAMPTZ,
  onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table sessions (QR patient, éphémère)
CREATE TABLE public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,     -- Code 6 chars (affiché dans le QR)
  test_id TEXT NOT NULL,
  doctor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_name TEXT NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 minutes')
);

-- Index pour lookup rapide par code
CREATE INDEX idx_sessions_code ON public.sessions(code);

-- Auto-delete des sessions expirées (cron Supabase)
-- Via pg_cron ou Supabase Edge Function scheduled
SELECT cron.schedule(
  'cleanup-expired-sessions',
  '*/5 * * * *',  -- toutes les 5 minutes
  $$DELETE FROM public.sessions WHERE expires_at < now()$$
);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Profiles : chaque user ne voit que son profil
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Sessions : le médecin ne voit que ses sessions
CREATE POLICY "Doctors can manage own sessions"
  ON public.sessions FOR ALL
  USING (auth.uid() = doctor_id);

-- Sessions : le patient peut lire par code (pas besoin d'auth)
CREATE POLICY "Anyone can read session by code"
  ON public.sessions FOR SELECT
  USING (true);  -- Le patient accède via le code, pas d'auth

-- Trigger pour créer un profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, specialty)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'general'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

4. Récupère les clés :
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY (pour le serveur API uniquement)
```

## Prompt 1.3 : Déploiement Vercel + Railway

```
Configure le déploiement pour Doc&Score.

VERCEL (frontend) :
1. Connecte le repo GitHub
2. Root directory : apps/web
3. Build command : next build
4. Variables d'environnement :
   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
   NEXT_PUBLIC_API_URL (l'URL Railway)
5. Domaine custom : docandscore.app (ou .fr)

RAILWAY (backend API) :
1. Nouveau service dans ton projet Railway existant (celui d'AudioFlow)
2. Nom : docandscore-api
3. Root directory : apps/api
4. Dockerfile deploy
5. Variables d'environnement :
   PORT=3001
   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
   CORS_ORIGIN=https://docandscore.app
   NODE_ENV=production
6. Domaine custom : api.docandscore.app

Le Dockerfile pour apps/api :

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["node", "dist/index.js"]

railway.toml :
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

---

# 4. PHASE 2 — AUTH & ONBOARDING

## Prompt 2.1 : Pages Sign In / Sign Up

```
Pour Doc&Score (apps/web), crée app/(auth)/login/page.tsx.

Design "Clinical Serenity" — bleu ciel + blanc, aéré, rassurant.

Layout centré verticalement :
- Logo Doc&Score en haut : "Doc" en texte sombre, "&" en bleu ciel,
  "Score" en texte sombre. Font Outfit bold 2rem.
- Sous-titre : "Scores cliniques validés" en text-muted

TABS en haut de la carte :
- Deux onglets : "Connexion" / "Créer un compte"
- Onglet actif : fond blanc + shadow, texte ds-sky
- Onglet inactif : fond transparent, texte ds-textMuted
- Fond des tabs : ds-offwhite, border-radius 14px, padding 4px

Carte blanche centrée (max-w-md, shadow-lg, rounded-2xl, p-8) :

MODE SIGN IN :
- Titre : "Bon retour !" en h2
- Sous-titre : "Connectez-vous à votre espace médecin"
- Champ "Email professionnel" (placeholder : dr.martin@gmail.com)
- Champ "Mot de passe" avec bouton Voir/Masquer intégré
- Lien "Mot de passe oublié ?" aligné à droite (ds-sky)
- Bouton "Se connecter" (bg-ds-sky, w-full, h-12)

MODE SIGN UP :
- Titre : "Créer votre compte" en h2
- Sous-titre : "Rejoignez Doc&Score en quelques secondes"
- Champ "Email professionnel"
- Champ "Mot de passe" avec bouton Voir/Masquer
- Barre de force du mot de passe (rouge/orange/vert) :
  < 8 chars = "Trop court" rouge
  8-11 chars = "Correct" orange
  >= 12 chars = "Fort" vert
- Champ "Confirmer le mot de passe"
  Si mismatch : message d'erreur "Les mots de passe ne correspondent pas"
- Bouton "Créer mon compte" (bg-ds-sky, w-full, h-12)
  Grisé si : email invalide OU mdp < 8 chars OU mismatch
- Mentions légales : "En créant un compte, vous acceptez les
  conditions d'utilisation et la politique de confidentialité"

SÉPARATEUR "ou" entre le bouton principal et le bouton Google

BOUTON GOOGLE OAUTH :
- Bouton outline avec logo Google SVG
- "Continuer avec Google"
- supabase.auth.signInWithOAuth({ provider: 'google' })

SPINNER DE CHARGEMENT :
- Au clic sur le bouton, afficher un spinner + texte "Connexion..."
  ou "Création..." selon le mode

GESTION D'ERREURS :
- Email déjà pris (signup) → "Un compte existe déjà avec cet email"
- Mauvais mot de passe (signin) → "Email ou mot de passe incorrect"
- Erreur réseau → "Erreur de connexion, réessayez"
- Affichage dans un bandeau rouge pâle avec icône ⚠

Au submit :
- Sign In : supabase.auth.signInWithPassword({ email, password })
- Sign Up : supabase.auth.signUp({ email, password })
- Redirect vers /onboarding (si premier login) ou /dashboard

MOT DE PASSE OUBLIÉ :
- Au clic sur "Mot de passe oublié ?" :
  supabase.auth.resetPasswordForEmail(email)
- Afficher "Un email de réinitialisation a été envoyé"

Responsive :
- Mobile : plein écran, carte sans shadow, padding réduit
- Desktop : fond ds-offwhite, carte centrée avec shadow

Le client Supabase est initialisé dans lib/supabase.ts :
import { createBrowserClient } from '@supabase/ssr'
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

## Prompt 2.2 : Onboarding médecin

```
Pour Doc&Score, crée app/(auth)/onboarding/page.tsx.

L'onboarding apparaît au premier login uniquement.
Si le profil Supabase a onboarded === true, redirect vers /dashboard.

Design : fond ds-offwhite, carte blanche centrée.

3 étapes avec ProgressDots en haut :

ÉTAPE 1 — IDENTITÉ :
- Titre : "Votre identité" avec icône stéthoscope
- 4 boutons en ligne pour le titre : Dr. / Pr. / M. / Mme
  Sélection : fond ds-skyPale + bordure ds-sky
- Champ "Nom" (obligatoire)
- Champ "Prénom" (obligatoire)
- Bouton "Continuer" grisé tant que les champs sont vides

ÉTAPE 2 — COORDONNÉES :
- Champ "Téléphone" (optionnel, label "(optionnel)" en gris)
- Champ "N° RPPS" (optionnel, 11 chiffres)
  Info-bulle : "Numéro d'identification professionnel"
- Bandeau ds-skyPale : icône cadenas +
  "Données stockées de manière sécurisée"

ÉTAPE 3 — SPÉCIALITÉ :
- Grille 2 colonnes de cartes spécialité (14 spécialités)
  Chaque carte : emoji + nom. Sélection : fond ds-skyPale
  + bordure ds-sky + scale-105 transition
- Bouton "Commencer →"

Au submit :
1. UPDATE le profil Supabase (title, first_name, last_name,
   phone, rpps, specialty, onboarded = true)
2. Redirect vers /dashboard

Les 14 spécialités :
general: "Médecine générale" 🩺
neuro: "Neurologie" 🧠
psy: "Psychiatrie" 💭
geriatrie: "Gériatrie" 👴
orl: "ORL" 👂
urgences: "Urgences" 🚑
algologie: "Douleur" ⚡
pneumo: "Pneumologie" 🫁
uro: "Urologie" 🔬
addictologie: "Addictologie" 🛡️
cardio: "Cardiologie" ❤️
dermato: "Dermatologie" 🧴
rhumato: "Rhumatologie" 🦴
autre: "Autre" 📋

Animation : transition slide entre les étapes (framer-motion).
Responsive : mobile = full width, desktop = carte centrée max-w-lg.
```

---

# 5. PHASE 3 — BASE DE QUESTIONNAIRES

## Prompt 3.1 : Types et structure

```
Pour Doc&Score, crée lib/types.ts avec tous les types du projet.

// --- Questionnaire ---

type QuestionType = 'likert' | 'score' | 'slider' | 'yesno' | 'thi' | 'select';

interface QuestionOption {
  value: number;
  label: string;
}

interface Question {
  id: number;
  text: string;
  type: QuestionType;
  options?: QuestionOption[];
  min?: number;        // Pour slider
  max?: number;        // Pour slider
  minLabel?: string;   // "Aucune douleur"
  maxLabel?: string;   // "Douleur maximale"
}

interface ScoringBracket {
  min: number;
  max: number;
  label: string;
  severity: 'normal' | 'mild' | 'moderate' | 'severe' | 'critical';
  description?: string;
  color: string;       // Couleur CSS pour l'affichage
}

interface Questionnaire {
  id: string;
  acronym: string;
  name: string;
  fullName?: string;
  description: string;
  specialties: string[];       // IDs des spécialités
  pathologies: string[];       // Mots-clés pathologie
  searchKeywords: string[];    // Synonymes pour la recherche
  icon: string;                // Emoji
  questions: Question[];
  maxScore: number;
  scoring: ScoringBracket[];
  source?: string;             // Référence bibliographique
  duration?: string;           // "2-3 min"
  isPro: boolean;              // Réservé aux abonnés Pro
}

// --- Session ---

interface Session {
  id: string;
  code: string;          // 6 chars
  testId: string;
  doctorId: string;
  doctorName: string;
  status: 'waiting' | 'active' | 'completed' | 'expired';
  createdAt: string;
  expiresAt: string;
}

// --- Profile ---

interface DoctorProfile {
  id: string;
  title: 'Dr.' | 'Pr.' | 'M.' | 'Mme';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  rpps?: string;
  specialty: string;
  plan: 'free' | 'pro' | 'team';
  planExpiresAt?: string;
  onboarded: boolean;
}

// --- Résultats ---

interface TestResult {
  testId: string;
  answers: Record<number, number>;
  totalScore: number;
  maxScore: number;
  scoring: ScoringBracket;     // Le bracket actif
  completedAt: string;
  doctorName: string;
}
```

## Prompt 3.2 : Les 5 premiers questionnaires (gratuits)

```
Pour Doc&Score, crée les 5 questionnaires du plan gratuit.
Chaque fichier dans lib/questionnaires/

1. lib/questionnaires/phq9.ts — Patient Health Questionnaire-9
   9 questions, type likert (0-3), max 27
   Brackets : Minimal (0-4), Léger (5-9), Modéré (10-14),
   Modérément sévère (15-19), Sévère (20-27)
   Spécialités : general, psy, neuro
   Pathologies : dépression, humeur, tristesse
   Keywords : déprime, moral, PHQ, PHQ9, PHQ-9
   isPro: false

2. lib/questionnaires/gad7.ts — Generalized Anxiety Disorder-7
   7 questions, type likert (0-3), max 21
   Brackets : Minimal (0-4), Léger (5-9), Modéré (10-14), Sévère (15-21)
   Spécialités : general, psy
   Pathologies : anxiété, angoisse, stress
   Keywords : anxieux, panique, GAD, GAD7, GAD-7
   isPro: false

3. lib/questionnaires/eva.ts — Échelle Visuelle Analogique
   1 question, type slider (0-10)
   Brackets : Pas de douleur (0), Faible (1-3), Modérée (4-6), Sévère (7-9), Maximale (10)
   Spécialités : toutes
   Pathologies : douleur
   Keywords : douleur, EVA, VAS, échelle visuelle
   isPro: false

4. lib/questionnaires/mmse.ts — Mini Mental State Examination
   30 items groupés en sections (orientation, rappel, attention, langage, praxie)
   Type score (0 ou 1 pour chaque item, sauf attention 0-5)
   Max 30
   Brackets : Normal (27-30), Léger (21-26), Modéré (16-20),
   Modérément sévère (10-15), Sévère (0-9)
   Spécialités : neuro, geriatrie, general
   Pathologies : démence, Alzheimer, trouble cognitif
   Keywords : MMSE, mini mental, cognition, mémoire, démence
   isPro: false

5. lib/questionnaires/epworth.ts — Échelle de somnolence d'Epworth
   8 questions, type score (0-3)
   Max 24
   Brackets : Normal (0-10), Somnolence légère (11-14),
   Somnolence modérée (15-17), Somnolence sévère (18-24)
   Spécialités : pneumo, neuro, general
   Pathologies : somnolence, apnée du sommeil, fatigue
   Keywords : Epworth, somnolence, sommeil, endormissement, apnée
   isPro: false

IMPORTANT pour CHAQUE questionnaire :
- Les textes des questions doivent être les textes EXACTS
  des questionnaires validés (ce sont des instruments scientifiques,
  pas des paraphrases).
- Inclure la source bibliographique dans le champ source.
- Le champ duration est une estimation.
- searchKeywords inclut les synonymes courants que les médecins
  pourraient taper.

Crée aussi lib/questionnaires/index.ts qui exporte un objet
questionnaires: Record<string, Questionnaire> avec tous les tests.
```

## Prompt 3.3 : Les 15 questionnaires Pro

```
Pour Doc&Score, crée les 15 questionnaires réservés au plan Pro.
Même structure que les 5 gratuits, avec isPro: true.

6. moca.ts — Montreal Cognitive Assessment (30 items, neuro/geriatrie)
7. nihss.ts — NIH Stroke Scale (15 items, neuro/urgences)
8. gds15.ts — Geriatric Depression Scale 15 items (gériatrie)
9. dn4.ts — Douleur Neuropathique 4 (10 items oui/non, algologie)
10. audit.ts — Alcohol Use Disorders Identification Test (10 items, addictologie)
11. ipss.ts — International Prostate Symptom Score (7 items, urologie)
12. thi.ts — Tinnitus Handicap Inventory (25 items oui/parfois/non, ORL)
13. fagerstrom.ts — Test de Fagerström (dépendance tabac, 6 items, addictologie)
14. mna.ts — Mini Nutritional Assessment (18 items, gériatrie)
15. cat.ts — COPD Assessment Test (8 items, pneumologie)
16. dlqi.ts — Dermatology Life Quality Index (10 items, dermatologie)
17. hads.ts — Hospital Anxiety and Depression Scale (14 items, general/psy)
18. madrs.ts — Montgomery-Åsberg Depression Rating Scale (10 items, psy)
19. ybocs.ts — Yale-Brown Obsessive Compulsive Scale (10 items, psy)
20. panss.ts — Positive and Negative Syndrome Scale (30 items, psy)

Pour chaque test : questions exactes, brackets de scoring validés,
source biblio, keywords et synonymes, spécialités, durée estimée.
```

## Prompt 3.4 : Moteur de recherche

```
Pour Doc&Score, crée lib/search.ts.

Fonction searchTests(query: string, filters?: { specialty?: string }):
  Questionnaire[]

Algorithme de recherche pondéré :
1. Match exact sur l'acronyme (poids 100) : "PHQ-9" → PHQ-9
2. Match sur le nom (poids 80) : "patient health" → PHQ-9
3. Match sur les pathologies (poids 60) : "dépression" → PHQ-9, GDS-15
4. Match sur les mots-clés (poids 40) : "déprime" → PHQ-9
5. Match sur la spécialité (poids 20) : "neurologie" → MMSE, MoCA, NIHSS

La recherche est insensible aux accents et à la casse.
Normaliser les entrées (é→e, è→e, ê→e, etc.).

Si un filtre spécialité est actif, ne retourner que les tests
dont le tableau specialties contient cette spécialité.

Trier par score de pertinence décroissant.

La recherche est purement locale (pas d'API), instantanée.
```

---

# 6. PHASE 4 — INTERFACE MÉDECIN

## Prompt 4.1 : Layout médecin (responsive)

```
Pour Doc&Score, crée app/(doctor)/layout.tsx.

Ce layout wraps toutes les pages médecin. Il vérifie l'auth
et redirige vers /login si non connecté.

MOBILE (< 768px) :
- Bottom navigation bar fixe avec 3 onglets :
  🏠 Accueil | 🔍 Recherche | ⚙️ Réglages
- Onglet actif : icône + texte en ds-sky, les autres en ds-textMuted
- Barre : bg-white, border-top 1px ds-border, h-16, safe-area-bottom
- Le contenu scrolle au-dessus

DESKTOP (>= 768px) :
- Sidebar gauche fixe (w-64, bg-white, border-right)
  - Logo Doc&Score en haut
  - Navigation verticale : Dashboard, Recherche, Réglages
  - En bas : nom du médecin + badge plan (Free/Pro)
- Contenu à droite (flex-1, bg-ds-offwhite, p-6, max-w-4xl mx-auto)

Le layout fetch le profil Supabase et le met dans le Zustand store.
Si onboarded === false, redirect vers /onboarding.

Utilise next/navigation pour la navigation.
```

## Prompt 4.2 : Dashboard

```
Pour Doc&Score, crée app/(doctor)/dashboard/page.tsx.

L'écran principal du médecin.

HEADER :
- "Bonjour Dr. {lastName}" en h1 font-display
- Date du jour en ds-textMuted
- Si plan === 'free', bandeau discret en haut :
  "Version gratuite — 5 tests disponibles" + lien "Passer à Pro →"

BARRE DE RECHERCHE :
- Card cliquable avec icône loupe + "Rechercher un test..."
- Au clic → navigate vers /search
- Raccourci clavier Cmd+K sur desktop

SECTION "Tests recommandés" :
- Basé sur la spécialité du médecin (depuis specialties.ts)
- Grille de TestCard (2 colonnes mobile, 3 desktop) :
  Chaque carte :
  - Icône emoji dans un cercle ds-skyPale (48x48)
  - Acronyme en font-mono text-ds-sky
  - Nom complet
  - Badge "PRO" violet si isPro et plan === 'free'
  - Deux boutons au bottom :
    "📋 Médecin" → /test/[testId]
    "📱 QR Patient" → /qr/[testId]
  - Si isPro et plan === 'free', le tap ouvre le paywall modal

SECTION "Tous les tests" :
- Liste compacte scrollable de tous les tests
- Chaque item : emoji + acronyme + nom + flèche
- Séparés par spécialité avec des headers gris

Animation d'entrée : stagger fadeIn sur les cartes (framer-motion).

Responsive :
- Mobile : 1 colonne pour la section recommandée, liste compacte en dessous
- Tablet : 2 colonnes
- Desktop : 3 colonnes + sidebar
```

## Prompt 4.3 : Recherche

```
Pour Doc&Score, crée app/(doctor)/search/page.tsx.

HEADER :
- Champ de recherche Input avec autofocus
  Placeholder : "Rechercher par nom, pathologie, spécialité..."
- Icône loupe à gauche, bouton clear (×) à droite si texte

FILTRES :
- Rangée horizontale de Chip scrollable :
  Tous | Neurologie | Psychiatrie | Douleur | Gériatrie | ORL |
  Urgences | Urologie | Pneumologie | Addictologie | Dermatologie | Rhumatologie
- Chip actif : bg-ds-sky text-white
- Chip inactif : bg-ds-skyPale text-ds-text

COMPTEUR :
- "{n} résultats" en font-mono text-ds-textMuted

RÉSULTATS :
- searchTests() appelé à chaque frappe (instant, pas de debounce)
- Chaque résultat = Card avec :
  - Icône emoji + acronyme (font-mono, ds-sky) + nom complet
  - Spécialité + pathologie en text-sm text-ds-textMuted
  - Durée estimée (badge)
  - Badge "PRO" si isPro
  - Deux boutons : "📋 Médecin" et "📱 QR Patient"

ÉTAT VIDE :
- Si aucun résultat : illustration + "Aucun test trouvé pour '{query}'"
  + suggestion "Essayez : dépression, douleur, mémoire"

Responsive : la liste est identique mobile et desktop,
le champ de recherche prend toute la largeur.
```

## Prompt 4.4 : Passation médecin (le cœur de l'app)

```
Pour Doc&Score, crée app/(doctor)/test/[testId]/page.tsx.

C'est la page la plus importante. Le médecin remplit le
questionnaire pour un patient et voit le score en direct.

HEADER STICKY (bg-white, shadow-sm, z-50) :
- Bouton retour (←)
- Acronyme en font-mono text-ds-sky + nom du test
- Badge "MÉDECIN" en ds-skyPale
- Score live à droite : gros chiffre ds-sky / max en gris
  Le score se met à jour en temps réel à chaque réponse.

BARRE DE PROGRESSION :
- ProgressBar sous le header
- Se remplit proportionnellement aux questions répondues
- Couleur ds-sky, height 4px, rounded, transition smooth

QUESTIONS :
- Affichées toutes en scroll vertical (pas une par une,
  c'est plus rapide pour un médecin qui connaît le test)
- Chaque question : numéro + texte + composant de réponse
- Espacement généreux entre les questions (gap-6)

Composants par type :

type "likert" → LikertScale :
  4 boutons empilés verticalement, chacun = Card légère
  Cercle numéroté à gauche (0,1,2,3) + label
  Sélectionné : bg-ds-skyPale border-ds-sky
  Labels standards PHQ/GAD :
    0 = "Jamais"
    1 = "Plusieurs jours"
    2 = "Plus de la moitié du temps"
    3 = "Presque tous les jours"

type "score" → ScoreButtons :
  Rangée horizontale de boutons numérotés (0 à max)
  Sélectionné : bg-ds-sky text-white
  Non sélectionné : bg-white border-ds-border

type "slider" → PainSlider :
  Slider natif (input range) avec la valeur en gros au centre
  Labels aux extrémités : minLabel / maxLabel
  Couleur du thumb : interpolation de vert (0) à rouge (max)
  
type "yesno" → YesNoButtons :
  2 boutons côte à côte : "Oui" (valeur 1) / "Non" (valeur 0)
  Sélectionné : bg-ds-sky text-white

type "thi" → THIButtons :
  3 boutons : "Oui" (4) / "Parfois" (2) / "Non" (0)

BOUTON FINAL :
- Sticky en bas de page
- "Voir les résultats →" (bg-ds-sky, w-full, rounded-xl, h-14)
- Grisé tant que toutes les questions ne sont pas répondues
- Compteur : "8/9 questions répondues"

Au clic : navigate vers /result/local avec les données en query params
ou via Zustand store (plus propre).

RESPONSIVE :
- Mobile : pleine largeur, questions empilées
- Desktop : max-w-2xl centré, plus d'espace
```

## Prompt 4.5 : Écran de résultat

```
Pour Doc&Score, crée app/(doctor)/result/[sessionId]/page.tsx.

Cet écran affiche les résultats d'un questionnaire.
Il est utilisé pour les deux flux :
- Résultat local (médecin a rempli) : sessionId = "local"
- Résultat temps réel (patient via QR) : sessionId = l'ID de session

Les données viennent du Zustand store (result) ou du WebSocket.

SCORE PRINCIPAL :
- ScoreGauge : SVG circulaire animé (180° arc)
  Score au centre en gros (font-display, 3rem)
  Sous-score : "/ {maxScore}"
  Couleur de l'arc = couleur du bracket de scoring
  Animation d'entrée : le cercle se remplit progressivement (1s)

INTERPRÉTATION :
- Card avec le label du bracket ("Dépression modérée")
  Couleur de fond = bracket.color en version très pâle
  Icône de sévérité à gauche
- Description du bracket si disponible

DÉTAIL DES RÉPONSES :
- Section dépliable "Détail des réponses"
- Tableau : N° question | Texte (tronqué) | Réponse | Score
- Total en bas en gras

SECTION IDENTITÉ PATIENT (locale) :
- Titre : "Identité du patient" avec badge "LOCAL UNIQUEMENT" (ds-sky)
- 3 champs : Nom, Prénom, Date de naissance
- Bandeau info : icône cadenas + "Ces données restent sur votre
  appareil. Elles ne sont jamais envoyées au serveur."
- Bouton "Générer le PDF" grisé tant que Nom n'est pas rempli

SECTION PDF :
- Le PDF est généré côté client avec jsPDF
- Aperçu du PDF dans un iframe ou canvas
- 3 boutons d'action :
  "📄 Télécharger" → download le fichier
  "📋 Copier le résumé" → copie texte formaté dans le presse-papier
  "📤 Partager" → Web Share API (natif sur mobile)
  
Format du texte copié :
"PHQ-9 — DUPONT Jean (15/03/1952)
Score : 14/27 — Dépression modérée
Date : 06/04/2026 — Dr. Martin"

RESPONSIVE :
- Mobile : tout empilé, ScoreGauge centré
- Desktop : ScoreGauge à gauche, détails à droite (grid 2 cols)
```

---

# 7. PHASE 5 — FLUX QR PATIENT

## Prompt 5.1 : Génération QR (écran médecin)

```
Pour Doc&Score, crée app/(doctor)/qr/[testId]/page.tsx.

Quand le médecin veut déléguer un test au patient.

1. Au montage :
   - POST vers l'API /api/session/create
     Body : { testId, doctorName: "{title} {lastName}" }
   - L'API crée une session en BDD Supabase et retourne { code, sessionId }
   - Connexion WebSocket : join room session:{sessionId}

2. AFFICHAGE DU QR :
   - Grand QR code centré (qrcode.react, taille 280px)
   - URL encodée : https://docandscore.app/session/{code}
   - Code affiché en gros sous le QR en font-mono (ex: "A7K2M9")
   - Texte : "Demandez au patient de scanner ce code"
   - Timer : "Expire dans 28:42" (countdown depuis 30 min)
   - Bouton "Copier le lien" en dessous

3. MONITORING TEMPS RÉEL (sous le QR) :
   - StatusBadge : état de la session
     "⏳ En attente du patient" (gris, pulsing dot)
     "📱 Patient connecté" (bleu, animation pulse)
     "✍️ En cours — 5/9 réponses" (bleu, progress bar)
     "✅ Terminé" (vert, check animé)

4. À la réception de l'événement WebSocket "result" :
   - Stocker le résultat dans le Zustand store
   - Naviguer automatiquement vers /result/{sessionId}
   - Feedback : vibration si Capacitor (sinon rien en web)

RESPONSIVE :
- Mobile : QR centré, monitoring en dessous
- Desktop : QR à gauche dans une carte, monitoring à droite
```

## Prompt 5.2 : Interface patient (web, pas d'auth)

```
Pour Doc&Score, crée app/(patient)/session/[code]/page.tsx.

C'est la page que le patient voit quand il scanne le QR code.
PAS D'AUTH. Le patient n'a pas de compte.

Design DIFFÉRENT du médecin : 
- Fond blanc pur, texte très lisible (font-size 18px min)
- Pas de barre de navigation
- Pensé pour des patients âgés (gros boutons, contraste fort)

1. AU MONTAGE :
   - GET /api/session/{code}
   - Si la session n'existe pas ou est expirée → écran d'erreur
     "Ce lien n'est plus valide. Demandez un nouveau code à votre médecin."
   - Si la session est valide → afficher le questionnaire
   - Émettre WebSocket "patient_connected"

2. HEADER :
   - Logo Doc&Score petit
   - "Prescrit par {doctorName}" en sous-titre
   - Nom du test : "{test.name}"
   - "Répondez à chaque question honnêtement.
     Vos réponses seront envoyées directement à votre médecin."

3. QUESTIONS :
   - UNE QUESTION À LA FOIS (swipe ou boutons Précédent/Suivant)
   - Gros texte pour la question (text-xl font-medium)
   - Gros boutons de réponse (h-16 text-lg)
   - Progress bar en haut : "Question 3/9"
   - Animation slide entre les questions (framer-motion)
   - Émettre WebSocket "patient_progress" à chaque réponse

4. ÉCRAN FINAL :
   - PAS DE SCORE AFFICHÉ. Le patient ne voit JAMAIS le résultat.
   - Gros bouton : "Envoyer au {doctorName}" (bg-ds-sky, h-16, w-full)
   - Au clic :
     a. POST /api/session/{code}/submit { answers }
     b. Le serveur calcule le score
     c. Le serveur émet "result" au médecin via WebSocket
     d. Le serveur supprime la session de la BDD
     e. Côté patient : écran "Envoyé avec succès ✓"
        Illustration check animée
        "Vous pouvez fermer cette page"
        PAS de lien vers l'app, PAS de données en cache
   - Nettoyer : ne stocker rien en localStorage, sessionStorage, rien.

5. BANDEAU INSTALLATION (en bas, discret) :
   - "Installer Doc&Score sur votre téléphone"
   - Seulement sur mobile, si beforeinstallprompt est disponible
   - Bouton "Installer" + bouton "×" pour dismiss
   - Sur iOS : instructions manuelles "Appuyez sur Partager → Sur l'écran d'accueil"

RESPONSIVE : 
- Cette page est conçue MOBILE-FIRST
- Desktop : conteneur max-w-md centré, sinon identique
- Accessibilité : WCAG AA, zones tactiles 48x48 min
```

---

# 8. PHASE 6 — TEMPS RÉEL (WebSocket)

## Prompt 6.1 : Serveur Socket.IO

```
Pour Doc&Score (apps/api), implémente le serveur WebSocket
avec Socket.IO sur Fastify.

src/index.ts :
- Crée le serveur Fastify
- Attache Socket.IO avec CORS configuré

src/ws/handler.ts :

Événements côté serveur :

"join" (de: médecin)
  Payload : { sessionId }
  Action : ajouter le socket à la room `session:${sessionId}`
  Vérifier que la session existe et appartient au médecin (via auth token)

"patient_connected" (de: patient)
  Payload : { code }
  Action : trouver la session par code, émettre "patient_connected"
  dans la room, mettre à jour le status en BDD → 'active'

"patient_progress" (de: patient)
  Payload : { code, answered, total }
  Action : émettre "patient_progress" dans la room

"submit" est géré par la route HTTP POST, pas par WebSocket.
Après le calcul du score, la route émet "result" dans la room,
puis supprime la session.

src/routes/session.ts :

POST /api/session/create
  Auth : Bearer token Supabase (vérifier avec supabase.auth.getUser)
  Body : { testId: string }
  Validation Zod
  → Créer la session en BDD Supabase
  → Générer un code unique 6 chars (A-Z0-9, sans ambiguïtés O/0/I/1)
  → Retourner { code, sessionId, expiresAt }

GET /api/session/:code
  Pas d'auth (c'est le patient)
  → Retourner { testId, doctorName, status }
  → Ne JAMAIS retourner le doctorId ou des infos sensibles

POST /api/session/:code/submit
  Pas d'auth
  Body : { answers: Record<number, number> }
  Validation Zod stricte :
    - Chaque clé doit être un entier correspondant à un ID de question du test
    - Chaque valeur doit être dans les bornes autorisées
  → Charger le questionnaire correspondant
  → Calculer le score CÔTÉ SERVEUR (ne jamais faire confiance au client)
  → Émettre "result" via Socket.IO dans la room
  → Supprimer la session de la BDD
  → Retourner au patient : { success: true }
  → NE PAS retourner le score au patient

GET /health
  → { status: 'ok', timestamp, version }

SÉCURITÉ :
- CORS : uniquement CORS_ORIGIN (docandscore.app)
- Rate limit : 20 req/min/IP (@fastify/rate-limit)
- Helmet pour les headers
- Validation Zod sur TOUS les payloads
- Le code de session est généré avec crypto.randomBytes
  Alphabet : ABCDEFGHJKLMNPQRSTUVWXYZ23456789 (sans 0OI1)
```

## Prompt 6.2 : Client Socket.IO

```
Pour Doc&Score (apps/web), crée lib/socket.ts.

Client Socket.IO avec reconnexion automatique.

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (socket?.connected) return socket;
  
  socket = io(process.env.NEXT_PUBLIC_API_URL!, {
    transports: ['websocket'],  // Pas de long-polling
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  
  return socket;
}

export function joinSession(sessionId: string) {
  const s = connectSocket();
  s.emit('join', { sessionId });
}

export function emitPatientConnected(code: string) {
  const s = connectSocket();
  s.emit('patient_connected', { code });
}

export function emitPatientProgress(code: string, answered: number, total: number) {
  const s = connectSocket();
  s.emit('patient_progress', { code, answered, total });
}

// Hooks React

export function useSessionEvents(sessionId: string, callbacks: {
  onPatientConnected?: () => void;
  onPatientProgress?: (data: { answered: number; total: number }) => void;
  onResult?: (data: TestResult) => void;
}) {
  useEffect(() => {
    const s = connectSocket();
    joinSession(sessionId);
    
    if (callbacks.onPatientConnected)
      s.on('patient_connected', callbacks.onPatientConnected);
    if (callbacks.onPatientProgress)
      s.on('patient_progress', callbacks.onPatientProgress);
    if (callbacks.onResult)
      s.on('result', callbacks.onResult);
    
    return () => {
      s.off('patient_connected');
      s.off('patient_progress');
      s.off('result');
      s.disconnect();
    };
  }, [sessionId]);
}
```

---

# 9. PHASE 7 — GÉNÉRATION PDF LOCALE

## Prompt 7.1 : Module PDF avec jsPDF

```
Pour Doc&Score, crée lib/pdf.ts.

Utilise jsPDF pour générer le PDF 100% côté navigateur.
L'identité du patient NE QUITTE JAMAIS le navigateur.

import jsPDF from 'jspdf';

interface PdfParams {
  test: Questionnaire;
  answers: Record<number, number>;
  totalScore: number;
  scoring: ScoringBracket;
  patient: { nom: string; prenom: string; ddn: string };
  doctorName: string;
}

export function generatePdf(params: PdfParams): jsPDF {
  const doc = new jsPDF();
  
  // EN-TÊTE
  // "Doc&Score" en bleu ciel (#7EC8E3), 20pt, bold
  // Ligne fine bleu ciel sous le titre
  // "Compte-rendu de score clinique" en 12pt gris
  
  // IDENTITÉ
  // Patient : NOM Prénom
  // Né(e) le : DD/MM/YYYY
  // Date de l'examen : DD/MM/YYYY à HH:MM
  // Praticien : Dr. NOM
  
  // SCORE
  // Encadré arrondi avec fond couleur bracket (très pâle)
  // Acronyme + nom du test
  // Score : XX / YY
  // Résultat : Label (min-max)
  
  // DÉTAIL
  // Tableau : Q01 | texte question | score
  // Alternance de couleur de fond pour lisibilité
  
  // PIED DE PAGE
  // "Généré par Doc&Score — docandscore.app"
  // "Aucune donnée patient n'est stockée sur nos serveurs."
  // Date et heure de génération
  
  return doc;
}

export function downloadPdf(doc: jsPDF, filename: string) {
  doc.save(filename);
}

export function generateClipboardText(params: PdfParams): string {
  const { test, totalScore, scoring, patient, doctorName } = params;
  return [
    `${test.acronym} — ${patient.nom.toUpperCase()} ${patient.prenom} (${patient.ddn})`,
    `Score : ${totalScore}/${test.maxScore} — ${scoring.label}`,
    `Date : ${new Date().toLocaleDateString('fr-FR')} — ${doctorName}`,
  ].join('\n');
}
```

---

# 10. PHASE 8 — MONÉTISATION & PAYWALL

## Prompt 8.1 : Paywall modal

```
Pour Doc&Score, crée un composant PaywallModal.tsx.

Ce modal apparaît quand un utilisateur gratuit tente :
- D'ouvrir un questionnaire Pro (isPro === true)
- D'utiliser le mode QR Patient
- De générer un PDF

Design :
- Modal plein écran mobile, centré desktop (max-w-lg)
- Fond blanc, rounded-2xl, shadow-2xl

Contenu :
- Icône étoile animée en haut
- "Passez à Doc&Score Pro" en h2 font-display
- "Débloquez tous les tests et fonctionnalités" en sous-titre

3 cartes de plan côte à côte (colonne sur mobile) :

GRATUIT (plan actif, grisé) :
- 5 tests de base
- Mode médecin uniquement
- Pas de QR ni PDF

PRO — 2,99€/mois :
- Tous les tests (20+)
- Mode QR Patient temps réel
- Génération PDF
- Copier/Partager
- Badge "POPULAIRE" en violet

PRO ANNUEL — 24,99€/an :
- Même que Pro mensuel
- Badge "ÉCONOMISEZ 30%" en vert
- Mis en avant visuellement (bordure ds-sky, scale-105)
- Mention "Déductible en frais professionnels"

Bouton principal sur l'offre annuelle.
Bouton secondaire "Peut-être plus tard" en bas.

NOTE : pour le MVP, le paiement sera géré par Stripe (web)
et RevenueCat (Capacitor/stores). Pour l'instant, un simple
bouton qui update le plan dans Supabase suffit pour le dev.
En production :
- Web : Stripe Checkout → webhook → update plan Supabase
- iOS : RevenueCat + StoreKit 2
- Android : RevenueCat + Google Play Billing

Crée aussi un hook usePlan() qui :
- Lit le plan depuis le Zustand store (hydraté depuis Supabase)
- Expose : isPro, isFree, plan, checkAccess(testId)
- checkAccess retourne true si le test est gratuit OU si le plan est pro/team
```

---

# 11. PHASE 9 — PWA PATIENT

## Prompt 9.1 : Configuration PWA

```
Pour Doc&Score, configure la PWA pour l'interface patient.

next.config.js : intégrer next-pwa (ou serwist)

public/manifest.json :
{
  "name": "Doc&Score",
  "short_name": "Doc&Score",
  "description": "Scores cliniques validés",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#7EC8E3",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}

Service worker :
- Cache les assets statiques (CSS, JS, fonts)
- Network-first pour les appels API
- Fallback offline : page "Connexion requise pour utiliser Doc&Score"

Le bandeau d'installation est affiché sur la page patient
(session/[code]) en bas de l'écran, discret.
```

---

# 12. PHASE 10 — SÉCURITÉ & RGPD

## Prompt 10.1 : Sécurité

```
Pour Doc&Score, implémente les mesures de sécurité.

FRONTEND :
1. Middleware Next.js (middleware.ts) :
   - Routes /(doctor)/* : vérifier le token Supabase
   - Routes /(patient)/* : pas d'auth
   - Routes /(auth)/* : pas d'auth
   - Redirect si non authentifié → /login

2. CSP headers dans next.config.js :
   default-src 'self'; script-src 'self'; connect-src 'self' {API_URL} {SUPABASE_URL}

3. Variables sensibles : jamais dans le code, toujours en .env

BACKEND :
1. CORS strict : uniquement CORS_ORIGIN
2. Rate limiting : 20/min/IP (toutes routes), 5/min/IP (create session)
3. Helmet pour les headers de sécurité
4. Validation Zod sur tous les payloads entrants
5. Le code de session utilise crypto.randomBytes (pas Math.random)
6. Les sessions expirent en 30 min (TTL en BDD + cron cleanup)

SUPABASE :
1. RLS activé sur toutes les tables
2. Service role key UNIQUEMENT côté serveur (jamais dans le frontend)
3. Anon key pour le frontend (accès limité par RLS)

DONNÉES PATIENT :
1. L'identité (nom, prénom, DDN) n'est JAMAIS envoyée au serveur
2. Elle est saisie dans le navigateur du médecin
3. Elle existe uniquement en mémoire JavaScript
4. Elle est utilisée pour générer le PDF côté client
5. Après génération, les champs sont vidés
6. Pas de localStorage, pas de sessionStorage, pas de cookies
   pour les données patient
7. La page patient (session/[code]) ne stocke rien après envoi

RGPD :
- Créer une page /privacy avec la politique de confidentialité
- Expliquer clairement le flux de données
- Mentionner que les données patient ne quittent pas l'appareil
- Base légale : intérêt légitime (outil professionnel)
- Pas besoin de consentement cookies (pas de tracking)
- DPO non requis (pas de traitement à grande échelle de données sensibles)
```

---

# 13. PHASE 11 — CAPACITOR (STORES)

## Prompt 11.1 : Wrap Capacitor

```
Pour Doc&Score, ajoute Capacitor pour wrapper la web app
en app native iOS et Android.

1. Dans apps/web :
   npx cap init "Doc&Score" "app.docandscore" --web-dir=out
   npm install @capacitor/core @capacitor/cli
   npm install @capacitor/ios @capacitor/android
   npm install @capacitor/haptics @capacitor/share
   npm install @capacitor/splash-screen @capacitor/status-bar
   npm install @aparajita/capacitor-biometric-auth

2. capacitor.config.ts :
   {
     appId: 'app.docandscore',
     appName: 'Doc&Score',
     webDir: 'out',
     server: {
       // En dev, pointer vers le serveur Next.js local
       url: 'http://localhost:3000',
       cleartext: true // Seulement en dev
     },
     plugins: {
       SplashScreen: {
         launchAutoHide: false,
         backgroundColor: '#FFFFFF',
       },
       StatusBar: {
         style: 'LIGHT',
         backgroundColor: '#FFFFFF',
       }
     }
   }

3. next.config.js : ajouter output: 'export' pour le build statique
   (Capacitor a besoin de fichiers statiques, pas de SSR)
   
   ATTENTION : ça signifie que les routes API Next.js ne marchent pas.
   C'est OK car notre API est séparée sur Railway.
   Il faudra peut-être adapter certaines pages qui utilisent
   des Server Components → les convertir en Client Components.

4. Ajouter les plateformes :
   npx cap add ios
   npx cap add android

5. Build et sync :
   next build && npx cap sync

6. Biométrie :
   Utiliser @aparajita/capacitor-biometric-auth pour le login :
   - Au premier login (magic link), proposer d'activer Face ID / Touch ID
   - Aux connexions suivantes, l'auth biométrique remplace le magic link
   - Stocker le token Supabase dans le Keychain iOS / Keystore Android
     via @capacitor/preferences (chiffré nativement)

7. Haptics :
   Utiliser @capacitor/haptics pour le feedback tactile
   sur les boutons de score et les transitions.

8. Share :
   Utiliser @capacitor/share au lieu de Web Share API
   pour le partage du PDF (meilleur support AirDrop, WhatsApp, etc.)

9. Build pour les stores :
   iOS : ouvrir ios/App/App.xcworkspace dans Xcode
   Android : ouvrir android/ dans Android Studio
```

## Prompt 11.2 : Assets et soumission stores

```
Prépare les assets pour la soumission sur les stores.

APP STORE (iOS) :
- Icône 1024x1024 (fond blanc, logo Doc&Score bleu ciel)
- 5 screenshots iPhone 6.7" (1290x2796) :
  1. Dashboard avec tests recommandés
  2. Passation d'un questionnaire
  3. Résultat avec score gauge
  4. QR code patient
  5. PDF généré
- Texte :
  Nom : Doc&Score
  Sous-titre : Scores cliniques validés
  Description : "Doc&Score permet aux médecins d'administrer
  des questionnaires de scores cliniques validés (PHQ-9, MMSE,
  GAD-7, EVA...) et de générer un PDF pour le dossier patient.
  Mode QR : le patient répond sur son téléphone, le médecin
  reçoit le score en temps réel. Aucune donnée patient n'est
  stockée sur nos serveurs."
  Mots-clés : score clinique, médecin, PHQ-9, MMSE, questionnaire, santé
  Catégorie : Médecine
  Privacy : aucune donnée collectée (ou "données non liées à l'identité"
  pour l'email du médecin)

GOOGLE PLAY (Android) :
- Icône 512x512
- Feature graphic 1024x500
- 5 screenshots 1080x1920
- Description similaire
- Catégorie : Médical
- Data safety : données chiffrées en transit, aucune donnée partagée
```

---

# 14. ANNEXE A — LES 20 QUESTIONNAIRES DE LANCEMENT

## Gratuits (5)
1. PHQ-9 — Patient Health Questionnaire-9 (dépression)
2. GAD-7 — Generalized Anxiety Disorder-7 (anxiété)
3. EVA — Échelle Visuelle Analogique (douleur)
4. MMSE — Mini Mental State Examination (cognition)
5. Epworth — Échelle de somnolence d'Epworth (sommeil)

## Pro (15)
6. MoCA — Montreal Cognitive Assessment
7. NIHSS — NIH Stroke Scale
8. GDS-15 — Geriatric Depression Scale
9. DN4 — Douleur Neuropathique 4
10. AUDIT — Alcohol Use Disorders Identification Test
11. IPSS — International Prostate Symptom Score
12. THI — Tinnitus Handicap Inventory
13. Fagerström — Dépendance tabagique
14. MNA — Mini Nutritional Assessment
15. CAT — COPD Assessment Test
16. DLQI — Dermatology Life Quality Index
17. HADS — Hospital Anxiety and Depression Scale
18. MADRS — Montgomery-Åsberg Depression Rating Scale
19. Y-BOCS — Yale-Brown Obsessive Compulsive Scale
20. PANSS — Positive and Negative Syndrome Scale

La base de données complète de 330+ tests est dans le fichier Excel
initial et sera ajoutée progressivement après le lancement.

---

# 15. ANNEXE B — MODÈLE ÉCONOMIQUE

## Coûts

Vercel (Hobby) : 0€/mois (suffisant pour le lancement)
Railway (API + Redis optionnel) : ~5-7$/mois
Supabase (Free tier) : 0€/mois (jusqu'à 50K users)
Domaine (docandscore.app) : ~15€/an
Apple Developer : 99€/an
Google Play : 25€ une fois
Stripe : 2,9% + 0,30€ par transaction

Total année 1 : ~250-350€
Total récurrent : ~200-300€/an

## Revenus

Seuil de rentabilité : ~12 abonnés annuels (24,99€ × 12 = 300€)

Projections conservatrices :
- 6 mois : 100 utilisateurs, 20 payants → 500€/an
- 12 mois : 500 utilisateurs, 100 payants → 2 500€/an
- 24 mois : 2 000 utilisateurs, 400 payants → 10 000€/an

Le marché cible en France : ~230 000 médecins (dont ~120 000 libéraux).
Objectif réaliste à 3 ans : 1% des médecins libéraux = 1 200 utilisateurs.

---

# NOTES FINALES POUR LE DÉVELOPPEUR

## Ordre de développement recommandé

1. Phase 1 (setup) → 2 (auth) → 3 (questionnaires) → 4 (interface médecin)
   = MVP médecin fonctionnel, testable immédiatement

2. Phase 5 (QR) → 6 (WebSocket) 
   = Mode patient fonctionnel

3. Phase 7 (PDF) → 8 (paywall) → 9 (PWA)
   = Fonctionnalités de monétisation

4. Phase 10 (sécurité) → 11 (Capacitor)
   = Publication sur les stores

## Principes à garder en tête

- Mobile-first TOUJOURS. Tester en mode responsive Chrome avant desktop.
- Un médecin a 30 secondes d'attention. Si le questionnaire n'est pas
  plus rapide que le papier, c'est un échec.
- Le patient est peut-être âgé. Gros boutons, gros texte, zéro ambiguïté.
- Zéro donnée patient sur le serveur. C'est non négociable.
- Lancer avec 20 tests parfaits plutôt que 330 approximatifs.
- Tester avec 10 vrais médecins avant de publier.
