// =============================================================================
// components/ui/AccordionItem.tsx — expandable accordion panel
// =============================================================================

import type { FC } from "react";
import { Info, Map, Settings, Users, FileText, ChevronDown, type LucideProps } from "lucide-react";
import type { AccordionItem as AccordionItemType, AccordionIconKey } from "../../types";

interface Props {
    item:      AccordionItemType;
    isOpen:    boolean;
    onToggle:  () => void;
    /** Optional tooltip dictionary — key = field label, value = explanation */
    fieldTips?: Record<string, string>;
}

type IconComponent = FC<LucideProps>;

const ICON_MAP: Record<AccordionIconKey, IconComponent> = {
    info:     Info,
    map:      Map,
    settings: Settings,
    users:    Users,
    file:     FileText,
};

const AccordionItem: FC<Props> = ({ item, isOpen, onToggle, fieldTips = {} }) => {
    const Icon   = ICON_MAP[item.icon] ?? Info;
    const headId = `accordion-head-${item.label.replace(/\s+/g, "-").toLowerCase()}`;
    const bodyId = `accordion-body-${item.label.replace(/\s+/g, "-").toLowerCase()}`;

    return (
        <div className="accordion-item">
            <button
                id={headId}
                className={`accordion-trigger${isOpen ? " accordion-trigger--open" : ""}`}
                onClick={onToggle}
                aria-expanded={isOpen}
                aria-controls={bodyId}
            >
                <span
                    className={`accordion-icon${isOpen ? " accordion-icon--active" : ""}`}
                    aria-hidden="true"
                >
                    <Icon size={15} strokeWidth={1.75} />
                </span>
                <span className={`accordion-label${isOpen ? " accordion-label--active" : ""}`}>
                    {item.label}
                </span>
                <ChevronDown
                    size={13}
                    strokeWidth={2}
                    className={`accordion-chevron${isOpen ? " accordion-chevron--open" : ""}`}
                    aria-hidden="true"
                />
            </button>

            {isOpen && (
                <div
                    id={bodyId}
                    role="region"
                    aria-labelledby={headId}
                    className="accordion-body"
                >
                    {item.sections.map((section) => (
                        <div key={section.title} className="accordion-section">
                            <p className="accordion-section-title" aria-hidden="true">
                                {section.title}
                            </p>
                            <div className="accordion-fields">
                                {section.fields.map((field) => {
                                    const tip = fieldTips[field.label];
                                    return (
                                        <div
                                            key={field.label}
                                            className={`accordion-field${field.span === 2 ? " accordion-field--full" : ""}`}
                                        >
                                            <p
                                                className="field-label"
                                                title={tip}
                                                aria-label={tip
                                                    ? `${field.label} (${tip}): ${field.value}`
                                                    : `${field.label}: ${field.value}`}
                                            >
                                                {field.label}
                                                {tip && (
                                                    <span
                                                        className="field-tip-dot"
                                                        aria-hidden="true"
                                                        title={tip}
                                                    />
                                                )}
                                            </p>
                                            <p
                                                className="field-value"
                                                aria-label={`${field.label}: ${field.value}`}
                                            >
                                                {field.value}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AccordionItem;
