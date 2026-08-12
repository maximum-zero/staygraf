"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export type SelectMenuOption = {
  value: string;
  label: string;
  meta?: string;
};

export function SelectMenu({
  ariaLabel,
  value,
  placeholder,
  options,
  onChange,
}: {
  ariaLabel: string;
  value?: string;
  placeholder: string;
  options: SelectMenuOption[];
  onChange: (value: string) => void;
}) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  useEffect(() => {
    if (!open) return;

    const closeFromOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeFromOutside);
    return () => document.removeEventListener("pointerdown", closeFromOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const targetIndex = selectedIndex >= 0 ? selectedIndex : 0;
    requestAnimationFrame(() => optionRefs.current[targetIndex]?.focus());
  }, [open, selectedIndex]);

  const close = (restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const select = (nextValue: string) => {
    onChange(nextValue);
    close();
  };

  const moveOptionFocus = (currentIndex: number, direction: 1 | -1) => {
    const nextIndex =
      (currentIndex + direction + options.length) % options.length;
    optionRefs.current[nextIndex]?.focus();
  };

  const handleOptionKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      moveOptionFocus(index, event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      optionRefs.current[
        event.key === "Home" ? 0 : options.length - 1
      ]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div className={open ? "select-menu is-open" : "select-menu"} ref={rootRef}>
      <button
        ref={triggerRef}
        className="select-menu__trigger"
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
            event.preventDefault();
            setOpen(true);
          } else if (event.key === "Escape" && open) {
            event.preventDefault();
            close();
          }
        }}
      >
        <span className={selectedOption ? "" : "is-placeholder"}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      {open && (
        <div
          className="select-menu__list"
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((option, index) => {
            const selected = option.value === value;
            return (
              <button
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                className={selected ? "is-selected" : ""}
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => select(option.value)}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
              >
                <span>
                  <strong>{option.label}</strong>
                  {option.meta && <small>{option.meta}</small>}
                </span>
                {selected && <Check size={16} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
