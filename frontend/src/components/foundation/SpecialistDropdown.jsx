import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Compass, Layers, MapPin, Radio, ShieldCheck } from 'lucide-react';
import { AGENT_COPY } from './agentCopy';

const SPECIALIST_GROUPS = [
  {
    label: 'Positioning & Messaging',
    items: [
      { id: 'branding', icon: Compass, hint: 'Launch angles & trade-offs' },
      { id: 'product_marketing', icon: Layers, hint: 'Service paths & quote terms' },
    ],
  },
  {
    label: 'Governance & Risk',
    items: [
      { id: 'pr', icon: ShieldCheck, hint: 'Claim review & escalation' },
    ],
  },
  {
    label: 'Channels & Live',
    items: [
      { id: 'social', icon: Radio, hint: 'Community checklists & cadence' },
      { id: 'events', icon: MapPin, hint: 'Local Q&A & session plans' },
    ],
  },
];

const FLAT_ITEMS = SPECIALIST_GROUPS.flatMap(group => group.items);
const ITEM_BY_ID = Object.fromEntries(FLAT_ITEMS.map(item => [item.id, item]));

export function SpecialistDropdown({ id, labelId, value, disabledId, onChange, buttonRef }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(null);
  const wrapRef = useRef(null);
  const localBtnRef = useRef(null);
  const listboxId = useId();

  const setTriggerRef = node => {
    localBtnRef.current = node;
    if (typeof buttonRef === 'function') buttonRef(node);
    else if (buttonRef) buttonRef.current = node;
  };

  const enabledItems = FLAT_ITEMS.filter(item => item.id !== disabledId);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    }
    function onFocusIn(event) {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('focusin', onFocusIn, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('focusin', onFocusIn, true);
    };
  }, [open]);

  function openMenu(initialId) {
    const startId = initialId
      ?? (value && value !== disabledId ? value : enabledItems[0]?.id ?? null);
    setHighlighted(startId);
    setOpen(true);
  }

  function closeMenu(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) localBtnRef.current?.focus();
  }

  function pick(nextId) {
    if (nextId === disabledId) return;
    onChange(nextId);
    closeMenu(true);
  }

  function moveHighlight(delta) {
    if (!enabledItems.length) return;
    const currentIndex = enabledItems.findIndex(item => item.id === highlighted);
    const nextIndex = currentIndex < 0
      ? (delta > 0 ? 0 : enabledItems.length - 1)
      : (currentIndex + delta + enabledItems.length) % enabledItems.length;
    setHighlighted(enabledItems[nextIndex].id);
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      if (!open) return;
      event.preventDefault();
      event.stopPropagation();
      closeMenu(true);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) openMenu();
      else moveHighlight(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) openMenu(enabledItems.at(-1)?.id);
      else moveHighlight(-1);
      return;
    }
    if (event.key === 'Home' && open) {
      event.preventDefault();
      if (enabledItems[0]) setHighlighted(enabledItems[0].id);
      return;
    }
    if (event.key === 'End' && open) {
      event.preventDefault();
      if (enabledItems.length) setHighlighted(enabledItems.at(-1).id);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!open) openMenu();
      else if (highlighted) pick(highlighted);
      return;
    }
    if (event.key === 'Tab' && open) {
      setOpen(false);
    }
  }

  const selectedMeta = value ? ITEM_BY_ID[value] : null;
  const SelectedIcon = selectedMeta?.icon ?? null;
  const selectedName = value ? AGENT_COPY[value]?.name : 'Choose a specialist';
  const activeOptionId = open && highlighted ? `${listboxId}-${highlighted}` : undefined;

  return (
    <div className="comparison-dropdown" ref={wrapRef} data-open={open ? 'true' : 'false'}>
      <button
        id={id}
        ref={setTriggerRef}
        type="button"
        role="combobox"
        className={`comparison-dropdown-trigger${value ? '' : ' is-placeholder'}`}
        aria-labelledby={labelId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        data-value={value}
        onClick={() => (open ? closeMenu(false) : openMenu())}
        onKeyDown={handleKeyDown}
      >
        <span className="comparison-dropdown-value">
          {SelectedIcon && (
            <span className="comparison-dropdown-badge" aria-hidden="true">
              <SelectedIcon size={17} strokeWidth={2} />
            </span>
          )}
          <span className="comparison-dropdown-text">{selectedName}</span>
        </span>
        <ChevronDown className="comparison-dropdown-chevron" aria-hidden="true" size={20} strokeWidth={1.8} />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          className="comparison-dropdown-menu"
          aria-labelledby={labelId}
          onKeyDown={handleKeyDown}
        >
          {SPECIALIST_GROUPS.map((group, groupIndex) => (
            <div key={group.label} role="group" aria-label={group.label} className="comparison-dropdown-group">
              {groupIndex > 0 && <div className="comparison-dropdown-sep" role="separator" />}
              <div className="comparison-dropdown-label" aria-hidden="true">{group.label}</div>
              {group.items.map(item => {
                const Icon = item.icon;
                const isSelected = item.id === value;
                const isDisabled = item.id === disabledId;
                const isActive = item.id === highlighted && !isDisabled;
                return (
                  <div
                    key={item.id}
                    id={`${listboxId}-${item.id}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isDisabled || undefined}
                    className={`comparison-dropdown-item${isSelected ? ' is-selected' : ''}${isActive ? ' is-active' : ''}${isDisabled ? ' is-disabled' : ''}`}
                    onPointerMove={() => { if (!isDisabled) setHighlighted(item.id); }}
                    onMouseDown={event => {
                      event.preventDefault();
                      if (!isDisabled) pick(item.id);
                    }}
                  >
                    <span className="comparison-dropdown-item-icon" aria-hidden="true">
                      <Icon size={16} strokeWidth={1.9} />
                    </span>
                    <span className="comparison-dropdown-item-body">
                      <span className="comparison-dropdown-item-name">{AGENT_COPY[item.id].name}</span>
                      <span className="comparison-dropdown-item-hint">{item.hint}</span>
                    </span>
                    {isDisabled && <span className="comparison-dropdown-tag">Other side</span>}
                    {isSelected && !isDisabled && (
                      <Check className="comparison-dropdown-check" size={16} strokeWidth={2.4} aria-hidden="true" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
