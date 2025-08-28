// Reusable badges with nicer styling, accessibility, and safety
// No new imports. Backwards compatible: <StatusBadge value="pending" /> still works

const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");
const norm = (v: string) => String(v || "").trim().toLowerCase();
const labelize = (v: string) =>
  String(v || "").replace(/[-_]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

type Size = "sm" | "md" | "lg";
const sizeCls: Record<Size, string> = {
  sm: "text-[10px] px-2 py-0.5",
  md: "text-xs px-2.5 py-1",
  lg: "text-sm px-3 py-1.5",
};

function Dot({ className = "" }) {
  return <span className={cx("h-1.5 w-1.5 rounded-full", className)} />;
}

export function StatusBadge({ value, size = "md", className = "" }: { value: string; size?: Size; className?: string }) {
  const v = norm(value);
  const map: Record<string, { bg: string; text: string; dot: string; icon?: JSX.Element }> = {
    pending: {
      bg: "bg-amber-500/15",
      text: "text-amber-300",
      dot: "bg-amber-400",
      icon: (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      ),
    },
    repairing: {
      bg: "bg-sky-500/15",
      text: "text-sky-300",
      dot: "bg-sky-400",
      icon: (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 21l3-3 6-6" />
          <path d="M14 7l-1 1 3 3 1-1a3 3 0 10-3-3z" />
        </svg>
      ),
    },
    completed: {
      bg: "bg-emerald-500/15",
      text: "text-emerald-300",
      dot: "bg-emerald-400",
      icon: (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ),
    },
  };

  const s = map[v] || { bg: "bg-slate-700/40", text: "text-slate-300", dot: "bg-slate-400" };
  const label = labelize(value || "Unknown");

  return (
    <span
      role="status"
      title={`Status: ${label}`}
      data-kind="status"
      data-value={v || "unknown"}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-md ring-1 ring-white/10",
        s.bg,
        s.text,
        sizeCls[size],
        className
      )}
    >
      <Dot className={s.dot} />
      {s.icon}
      <span>{label}</span>
    </span>
  );
}

export function PaymentBadge({ value, size = "md", className = "" }: { value: string; size?: Size; className?: string }) {
  const v = norm(value);
  const map: Record<string, { bg: string; text: string; dot: string; icon?: JSX.Element }> = {
    unpaid: {
      bg: "bg-rose-500/15",
      text: "text-rose-300",
      dot: "bg-rose-400",
      icon: (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 6l12 12" />
          <path d="M12 3v18" />
        </svg>
      ),
    },
    paid: {
      bg: "bg-emerald-500/15",
      text: "text-emerald-300",
      dot: "bg-emerald-400",
      icon: (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ),
    },
  };

  const s = map[v] || { bg: "bg-slate-700/40", text: "text-slate-300", dot: "bg-slate-400" };
  const label = labelize(value || "Unknown");

  return (
    <span
      role="status"
      title={`Payment: ${label}`}
      data-kind="payment"
      data-value={v || "unknown"}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-md ring-1 ring-white/10",
        s.bg,
        s.text,
        sizeCls[size],
        className
      )}
    >
      <Dot className={s.dot} />
      {s.icon}
      <span>{label}</span>
    </span>
  );
}
