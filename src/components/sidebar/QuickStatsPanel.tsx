// =============================================================================
// components/sidebar/QuickStatsPanel.tsx — property stat cards with badges
// =============================================================================

import React, { useState, type FC } from "react";
import {
    Info, Calendar, Tag, DollarSign, Home, Store,
    Building2, Landmark, TreePine, Warehouse, HelpCircle,
    Layers, Ruler, TrendingUp, SquareStack,
    ArrowUpDown, Clock, Zap, type LucideProps,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type IconComponent = FC<LucideProps>;
type MetaMap       = Record<string, string>;

interface BadgeDesc { icon?: IconComponent; label: string; color: string; }

interface StatCardConfig {
    icon:   IconComponent;
    accent: string;
    bg:     string;
    badge?: (meta: MetaMap) => BadgeDesc | null;
}

// ── Use-type → icon ───────────────────────────────────────────────────────────

function useTypeIcon(useType: string): IconComponent {
    const s = useType.toLowerCase();
    if (s.includes("residential") || s.includes("single"))   return Home;
    if (s.includes("commercial") || s.includes("retail"))    return Store;
    if (s.includes("multi") || s.includes("apartment"))      return Building2;
    if (s.includes("industrial") || s.includes("warehouse")) return Warehouse;
    if (s.includes("education") || s.includes("public"))     return Landmark;
    if (s.includes("park") || s.includes("rec"))             return TreePine;
    if (s.includes("mixed"))                                  return SquareStack;
    if (s.includes("condo"))                                  return Building2;
    return HelpCircle;
}

// ── Badge helpers ─────────────────────────────────────────────────────────────

function taxBadge(raw: string): BadgeDesc | null {
    const n = Number(raw);
    if (!n || isNaN(n)) return null;
    if (n >= 1_000_000) return { label: "$$$", color: "#ef4444" };
    if (n >= 250_000)   return { label: "$$",  color: "#f97316" };
    return                     { label: "$",   color: "#22c55e" };
}

function eraBadge(raw: string): BadgeDesc | null {
    const y = Number(raw);
    if (!y || isNaN(y)) return null;
    const age = new Date().getFullYear() - y;
    if (age >= 80) return { icon: Clock, label: "Historic", color: "#a78bfa" };
    if (age >= 40) return { icon: Clock, label: "Mature",   color: "#60a5fa" };
    if (age >= 15) return { icon: Clock, label: "Est.",     color: "#34d399" };
    return               { icon: Zap,   label: "New",      color: "#f59e0b" };
}

function lotBadge(raw: string): BadgeDesc | null {
    const n = Number(raw);
    if (!n || isNaN(n)) return null;
    if (n >= 5)   return { label: "L", color: "#22c55e" };
    if (n >= 0.5) return { label: "M", color: "#f59e0b" };
    return               { label: "S", color: "#94a3b8" };
}

// ── Card config ───────────────────────────────────────────────────────────────

const STAT_CONFIG: Record<string, StatCardConfig> = {
    "Use Type":  { icon: Home,       accent: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
    "Zone":      { icon: Tag,        accent: "#a855f7", bg: "rgba(168,85,247,0.12)" },
    "Lot Area":  { icon: Layers,     accent: "#22c55e", bg: "rgba(34,197,94,0.12)",    badge: (m) => lotBadge(m["_acres"] ?? "") },
    "Floor Area":{ icon: Ruler,      accent: "#14b8a6", bg: "rgba(20,184,166,0.12)" },
    "Built":     { icon: Calendar,   accent: "#3b82f6", bg: "rgba(59,130,246,0.12)",   badge: (m) => eraBadge(m["_yearVal"] ?? "") },
    "Units":     { icon: Building2,  accent: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
    "Tax Value": { icon: DollarSign, accent: "#f97316", bg: "rgba(249,115,22,0.12)",   badge: (m) => taxBadge(m["_taxVal"] ?? "") },
    "Last Sale": { icon: TrendingUp, accent: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
};

const DEFAULT_STAT: StatCardConfig = {
    icon: Info, accent: "#94a3b8", bg: "rgba(148,163,184,0.10)",
};

// ── Meta extraction ───────────────────────────────────────────────────────────

function extractMeta(stats: Array<{ label: string; value: string }>): MetaMap {
    return Object.fromEntries(
        stats.filter((s) => s.label.startsWith("_")).map((s) => [s.label, s.value]),
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
    stats: Array<{ label: string; value: string }>;
}

const QuickStatsPanel: FC<Props> = ({ stats }) => {
    const [expanded, setExpanded] = useState(false);
    const meta    = extractMeta(stats);
    const visible = stats.filter((s) => !s.label.startsWith("_"));

    const getIcon = (label: string, value: string): IconComponent => {
        if (label === "Use Type") return useTypeIcon(value);
        return (STAT_CONFIG[label] ?? DEFAULT_STAT).icon;
    };

    return (
        <div className="qs-panel">
            <div className="qs-header">
                <p className="section-eyebrow">Quick Stats</p>
                <button
                    className="qs-expand-btn"
                    onClick={() => setExpanded((v) => !v)}
                    aria-label={expanded ? "Show card view" : "Show table view"}
                    aria-pressed={expanded}
                >
                    {expanded
                        ? <ArrowUpDown size={12} aria-hidden="true" />
                        : <Info size={12} aria-hidden="true" />}
                </button>
            </div>

            {!expanded ? (
                <div className="qs-grid" role="list" aria-label="Quick property statistics">
                    {visible.map((stat) => {
                        const cfg     = STAT_CONFIG[stat.label] ?? DEFAULT_STAT;
                        const Icon    = getIcon(stat.label, stat.value);
                        const badge   = cfg.badge ? cfg.badge(meta) : null;
                        const isBlank = !stat.value || stat.value === "—";

                        return (
                            <div
                                key={stat.label}
                                role="listitem"
                                className={`qs-card${isBlank ? " qs-card--blank" : ""}`}
                                style={{ "--qs-accent": cfg.accent, "--qs-bg": cfg.bg } as React.CSSProperties}
                            >
                                <span className="qs-card-icon" aria-hidden="true">
                                    <Icon size={14} strokeWidth={2} />
                                </span>
                                <div className="qs-card-content">
                                    <p className="qs-card-label">{stat.label}</p>
                                    <p className="qs-card-value">{stat.value}</p>
                                </div>
                                {badge && (
                                    <span
                                        className="qs-badge"
                                        style={{ "--badge-color": badge.color } as React.CSSProperties}
                                        aria-label={badge.label}
                                        title={badge.label}
                                    >
                                        {badge.icon && <badge.icon size={9} strokeWidth={2.5} aria-hidden="true" />}
                                        <span>{badge.label}</span>
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <dl className="qs-detail" aria-label="Property statistics table">
                    {visible.map((stat) => (
                        <div key={stat.label} className="qs-detail-row">
                            <dt className="qs-detail-label">{stat.label}</dt>
                            <dd className="qs-detail-value">{stat.value}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </div>
    );
};

export default QuickStatsPanel;
