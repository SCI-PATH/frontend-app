import { ArrowRightLeft } from "lucide-react";

interface LessonSwitchNoticeProps {
  message: string;
  onDismiss: () => void;
}

export function LessonSwitchNotice({
  message,
  onDismiss,
}: LessonSwitchNoticeProps) {
  return (
    <div
      className="flex items-start justify-between gap-3 border-b border-brand-special/15 bg-brand-special/10 px-4 py-2 text-sm text-brand-special sm:px-5"
      role="status"
    >
      <p className="flex items-center gap-2">
        <ArrowRightLeft className="size-3.5 shrink-0" aria-hidden />
        {message}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 text-xs font-medium text-brand-special/70 hover:text-brand-special"
      >
        Dismiss
      </button>
    </div>
  );
}
