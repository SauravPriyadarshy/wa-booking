type Props = {
  icon: string;
  title: string;
  body: string;
};

/** Short guidance banner for multi-step flows — speaks to non-technical users. */
export function StepHint({ icon, title, body }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/90 p-3">
      <span className="shrink-0 text-xl leading-none" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-emerald-900">{title}</div>
        <p className="mt-0.5 text-[12px] leading-relaxed text-emerald-800/90">{body}</p>
      </div>
    </div>
  );
}
