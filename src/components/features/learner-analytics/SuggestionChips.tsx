import { Button } from "@/components/ui/button";

const CHIPS = [
  { id: "hint", label: "💡 Give me a hint", kind: "hint" as const },
  { id: "stuck", label: "🤔 I'm stuck on this step", kind: "stuck" as const },
] as const;

interface SuggestionChipsProps {
  disabled?: boolean;
  onHint: () => void;
  onStuck: () => void;
}

export function SuggestionChips({
  disabled = false,
  onHint,
  onStuck,
}: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CHIPS.map((chip) => (
        <Button
          key={chip.id}
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={chip.kind === "hint" ? onHint : onStuck}
          className="h-8 rounded-full border-brand-surface bg-white text-brand-text hover:border-brand-special/30 hover:bg-brand-special/10 hover:text-brand-special"
        >
          {chip.label}
        </Button>
      ))}
    </div>
  );
}
