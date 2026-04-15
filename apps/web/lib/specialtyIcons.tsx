"use client";
import { Icon } from "@iconify/react";

// Phosphor Duotone (https://phosphoricons.com, duotone weight)
// Loaded dynamically via Iconify CDN. One icon per specialty.
const ICON_BY_SPECIALTY: Record<string, string> = {
  cardio:           "ph:heart-duotone",
  cardiologie:      "ph:heart-duotone",
  psy:              "ph:smiley-duotone",
  psychiatrie:      "ph:smiley-duotone",
  neuro:            "ph:brain-duotone",
  neurologie:       "ph:brain-duotone",
  douleur:          "ph:lightning-duotone",
  algologie:        "ph:lightning-duotone",
  orl:              "ph:ear-duotone",
  audiologie:       "ph:ear-duotone",
  pneumo:           "ph:lungs-duotone",
  pneumologie:      "ph:lungs-duotone",
  geriatrie:        "ph:hourglass-duotone",
  uro:              "ph:drop-duotone",
  urologie:         "ph:drop-duotone",
  addictologie:     "ph:pill-duotone",
  dermato:          "ph:hand-duotone",
  dermatologie:     "ph:hand-duotone",
  allergo:          "ph:flower-duotone",
  allergologie:     "ph:flower-duotone",
  nutrition:        "ph:apple-logo-duotone",
  general:          "ph:stethoscope-duotone",
  generale:         "ph:stethoscope-duotone",
  medicinegeneral:  "ph:stethoscope-duotone",
  medecinegenerale: "ph:stethoscope-duotone",
  endocrino:        "ph:flask-duotone",
  endocrinologie:   "ph:flask-duotone",
  urgences:         "ph:heartbeat-duotone",
  anesthesie:       "ph:syringe-duotone",
  toutesspecialites:"ph:stethoscope-duotone",
};

// Brand gradient per specialty — stays in sync with previous custom SVGs.
type SpecialtyMeta = {
  iconName: string;
  label: string;
  from: string;
  to: string;
};

const META_BY_SPECIALTY: Record<string, SpecialtyMeta> = {
  cardio:           { iconName: "ph:heart-duotone",        label: "Cardiologie",    from: "#FF6B9D", to: "#FF8E8E" },
  cardiologie:      { iconName: "ph:heart-duotone",        label: "Cardiologie",    from: "#FF6B9D", to: "#FF8E8E" },
  psy:              { iconName: "ph:smiley-duotone",       label: "Psychiatrie",    from: "#A78BFA", to: "#7BBDD9" },
  psychiatrie:      { iconName: "ph:smiley-duotone",       label: "Psychiatrie",    from: "#A78BFA", to: "#7BBDD9" },
  neuro:            { iconName: "ph:brain-duotone",        label: "Neurologie",     from: "#7C6FE8", to: "#4A9ABF" },
  neurologie:       { iconName: "ph:brain-duotone",        label: "Neurologie",     from: "#7C6FE8", to: "#4A9ABF" },
  douleur:          { iconName: "ph:lightning-duotone",    label: "Douleur",        from: "#FFA94D", to: "#FF6B6B" },
  algologie:        { iconName: "ph:lightning-duotone",    label: "Algologie",      from: "#FFA94D", to: "#FF6B6B" },
  orl:              { iconName: "ph:ear-duotone",          label: "ORL",            from: "#4FD1C5", to: "#4A9ABF" },
  audiologie:       { iconName: "ph:ear-duotone",          label: "Audiologie",     from: "#4FD1C5", to: "#4A9ABF" },
  pneumo:           { iconName: "ph:lungs-duotone",        label: "Pneumologie",    from: "#5EC9EB", to: "#7BBDD9" },
  pneumologie:      { iconName: "ph:lungs-duotone",        label: "Pneumologie",    from: "#5EC9EB", to: "#7BBDD9" },
  geriatrie:        { iconName: "ph:hourglass-duotone",    label: "Gériatrie",      from: "#C4A25A", to: "#8B7E6E" },
  uro:              { iconName: "ph:drop-duotone",         label: "Urologie",       from: "#F0A05A", to: "#D17E4C" },
  urologie:         { iconName: "ph:drop-duotone",         label: "Urologie",       from: "#F0A05A", to: "#D17E4C" },
  addictologie:     { iconName: "ph:pill-duotone",         label: "Addictologie",   from: "#6D5ECF", to: "#8B7CE8" },
  dermato:          { iconName: "ph:hand-duotone",         label: "Dermatologie",   from: "#F48FB1", to: "#FFB088" },
  dermatologie:     { iconName: "ph:hand-duotone",         label: "Dermatologie",   from: "#F48FB1", to: "#FFB088" },
  allergo:          { iconName: "ph:flower-duotone",       label: "Allergologie",   from: "#7BD389", to: "#4FD1C5" },
  allergologie:     { iconName: "ph:flower-duotone",       label: "Allergologie",   from: "#7BD389", to: "#4FD1C5" },
  nutrition:        { iconName: "ph:apple-logo-duotone",   label: "Nutrition",      from: "#6FCF97", to: "#4FD1C5" },
  general:          { iconName: "ph:stethoscope-duotone",  label: "Médecine générale", from: "#4A9ABF", to: "#7BBDD9" },
  generale:         { iconName: "ph:stethoscope-duotone",  label: "Médecine générale", from: "#4A9ABF", to: "#7BBDD9" },
  medicinegeneral:  { iconName: "ph:stethoscope-duotone",  label: "Médecine générale", from: "#4A9ABF", to: "#7BBDD9" },
  medecinegenerale: { iconName: "ph:stethoscope-duotone",  label: "Médecine générale", from: "#4A9ABF", to: "#7BBDD9" },
  endocrino:        { iconName: "ph:flask-duotone",        label: "Endocrinologie", from: "#F06292", to: "#BA68C8" },
  endocrinologie:   { iconName: "ph:flask-duotone",        label: "Endocrinologie", from: "#F06292", to: "#BA68C8" },
  urgences:         { iconName: "ph:heartbeat-duotone",    label: "Urgences",       from: "#FF5252", to: "#FFA94D" },
  anesthesie:       { iconName: "ph:syringe-duotone",      label: "Anesthésie",     from: "#5E72E4", to: "#4A9ABF" },
  toutesspecialites:{ iconName: "ph:stethoscope-duotone",  label: "Toutes spécialités", from: "#4A9ABF", to: "#7BBDD9" },
};

const DEFAULT: SpecialtyMeta = {
  iconName: "ph:pulse-duotone",
  label: "Score clinique",
  from: "#4A9ABF",
  to: "#7BBDD9",
};

function normalize(key: string | undefined): string {
  if (!key) return "";
  return key
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

export function getSpecialty(category: string | undefined): SpecialtyMeta {
  const k = normalize(category);
  return META_BY_SPECIALTY[k] ?? DEFAULT;
}

export function getSpecialtyIcon(category: string | undefined): string {
  const k = normalize(category);
  return ICON_BY_SPECIALTY[k] ?? DEFAULT.iconName;
}

export function SpecialtyIcon({
  category,
  size = 24,
  className,
}: {
  category: string | undefined;
  size?: number;
  className?: string;
}) {
  const icon = getSpecialtyIcon(category);
  return (
    <Icon
      icon={icon}
      width={size}
      height={size}
      className={className}
    />
  );
}

export type { SpecialtyMeta };
