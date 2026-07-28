"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type BusinessDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monthFormatter = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long" });
const displayFormatter = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" });

function parseDate(value: string | undefined) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sameDay(a: Date | null, b: Date | null) {
  return Boolean(a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate());
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getCalendarDays(viewDate: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
}

export function BusinessDatePicker({ value, onChange, min, placeholder = "选择日期", className, disabled = false }: BusinessDatePickerProps) {
  const selectedDate = useMemo(() => parseDate(value), [value]);
  const minDate = useMemo(() => parseDate(min), [min]);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => selectedDate ?? minDate ?? new Date());
  const rootRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => startOfDay(new Date()), []);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const days = useMemo(() => getCalendarDays(viewDate), [viewDate]);
  const normalizedMin = minDate ? startOfDay(minDate) : null;

  function toggleOpen() {
    if (disabled) return;
    setOpen((current) => {
      if (!current) {
        setViewDate(selectedDate ?? minDate ?? new Date());
      }
      return !current;
    });
  }

  function selectDate(date: Date) {
    if (normalizedMin && startOfDay(date).getTime() < normalizedMin.getTime()) return;
    onChange(formatDateValue(date));
    setOpen(false);
  }

  function selectQuickDate(daysFromToday: number) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysFromToday);
    selectDate(nextDate);
    setViewDate(nextDate);
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button type="button" onClick={toggleOpen} disabled={disabled} className={cn("flex h-11 w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 text-left text-sm text-[var(--text)] shadow-[var(--shadow-sm)] outline-none transition hover:border-[var(--primary)]/45 hover:bg-[var(--card-hover)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)] disabled:cursor-not-allowed disabled:opacity-60", open && "border-[var(--primary)] ring-4 ring-[var(--primary-soft)]")}>
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays size={16} className="shrink-0 text-[var(--primary)]" />
          <span className={cn("truncate", !selectedDate && "text-[var(--text-faint)]")}>{selectedDate ? displayFormatter.format(selectedDate) : placeholder}</span>
        </span>
        <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-faint)]">Date</span>
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+10px)] z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[0_24px_70px_color-mix(in_srgb,var(--text)_18%,transparent)]">
          <div className="border-b border-[var(--border)] bg-[var(--bg-soft)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-faint)]">Exam Date</div>
                <div className="mt-1 text-base font-black text-[var(--text)]">{monthFormatter.format(viewDate)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setViewDate((current) => addMonths(current, -1))} className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] transition hover:border-[var(--primary)]/40 hover:text-[var(--primary)]" aria-label="上个月">
                  <ChevronLeft size={17} />
                </button>
                <button type="button" onClick={() => setViewDate((current) => addMonths(current, 1))} className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] transition hover:border-[var(--primary)]/40 hover:text-[var(--primary)]" aria-label="下个月">
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button type="button" onClick={() => selectQuickDate(30)} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-2 py-2 text-xs font-bold text-[var(--text-soft)] transition hover:border-[var(--primary)]/40 hover:text-[var(--primary)]">30 天</button>
              <button type="button" onClick={() => selectQuickDate(60)} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-2 py-2 text-xs font-bold text-[var(--text-soft)] transition hover:border-[var(--primary)]/40 hover:text-[var(--primary)]">60 天</button>
              <button type="button" onClick={() => selectQuickDate(90)} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-2 py-2 text-xs font-bold text-[var(--text-soft)] transition hover:border-[var(--primary)]/40 hover:text-[var(--primary)]">90 天</button>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 pb-2">
              {weekdayLabels.map((label) => (
                <div key={label} className="py-1 text-center text-[10px] font-black uppercase tracking-wide text-[var(--text-faint)]">{label}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((date) => {
                const outsideMonth = date.getMonth() !== viewDate.getMonth();
                const isSelected = sameDay(date, selectedDate);
                const isToday = sameDay(date, today);
                const isDisabled = Boolean(normalizedMin && startOfDay(date).getTime() < normalizedMin.getTime());

                return (
                  <button key={formatDateValue(date)} type="button" disabled={isDisabled} onClick={() => selectDate(date)} className={cn("flex aspect-square items-center justify-center rounded-[var(--radius-sm)] text-sm font-bold transition", outsideMonth ? "text-[var(--text-faint)]/60" : "text-[var(--text)]", isToday && "border border-[var(--primary)]/45 text-[var(--primary)]", isSelected && "border-transparent bg-[var(--primary)] text-white shadow-[0_10px_28px_color-mix(in_srgb,var(--primary)_28%,transparent)]", !isSelected && !isDisabled && "hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]", isDisabled && "cursor-not-allowed text-[var(--text-faint)]/35 line-through")}>
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
