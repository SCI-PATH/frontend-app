"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { QuestionType } from "../types";

const fieldClassName =
  "h-11 border-brand-surface bg-brand-background/70 text-brand-text placeholder:text-brand-text/40 transition-colors focus-visible:border-brand-primary focus-visible:bg-white focus-visible:ring-brand-primary/25";

export function normalizeOptions(
  options?: Record<string, string> | string[] | null
): { key: string; label: string }[] {
  if (!options) return [];
  if (Array.isArray(options)) {
    return options.map((label, i) => {
      const key = String.fromCharCode(65 + i);
      const text =
        typeof label === "string"
          ? label
          : label && typeof label === "object" && "text" in (label as object)
            ? String((label as { text: unknown }).text)
            : String(label);
      return { key, label: text };
    });
  }
  return Object.entries(options).map(([key, label]) => ({
    key,
    label: typeof label === "string" ? label : String(label),
  }));
}

interface QuestionRendererProps {
  questionType: QuestionType;
  prompt: string;
  options?: Record<string, string> | string[];
  paragraph?: string;
  blanks?: number;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  disabled?: boolean;
}

function promptToString(prompt: unknown): string {
  if (typeof prompt === "string") return prompt;
  if (prompt && typeof prompt === "object") {
    const obj = prompt as Record<string, unknown>;
    if (typeof obj.question === "string") return obj.question;
    if (typeof obj.text === "string") return obj.text;
    if (typeof obj.prompt === "string") return obj.prompt;
    if (typeof obj.paragraph === "string") return obj.paragraph;
  }
  return String(prompt ?? "");
}

export function QuestionRenderer({
  questionType,
  prompt,
  options,
  paragraph,
  blanks = 2,
  value,
  onChange,
  disabled,
}: QuestionRendererProps) {
  const stem =
    questionType === "MultiBlank" && paragraph
      ? paragraph
      : promptToString(prompt);

  return (
    <div className="mx-auto w-full max-w-xl space-y-5 text-center">
      <p className="text-lg font-medium leading-relaxed whitespace-pre-wrap text-brand-text sm:text-xl">
        {stem}
      </p>

      {questionType === "MCQ" ? (
        <McqOptions
          options={normalizeOptions(options)}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          disabled={disabled}
        />
      ) : null}

      {questionType === "TrueFalse" ? (
        <TrueFalseOptions
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          disabled={disabled}
        />
      ) : null}

      {questionType === "ShortAnswer" ? (
        <Input
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Type your answer…"
          className={fieldClassName}
        />
      ) : null}

      {questionType === "MultiBlank" ? (
        <MultiBlankInputs
          count={Math.max(blanks, 2)}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          disabled={disabled}
        />
      ) : null}
    </div>
  );
}

function McqOptions({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const list =
    options.length > 0
      ? options
      : ["A", "B", "C", "D"].map((key) => ({ key, label: `Option ${key}` }));

  return (
    <div className="mx-auto grid w-full max-w-lg gap-3 sm:grid-cols-2">
      {list.map((opt) => {
        const selected = value === opt.key || value === opt.label;
        return (
          <button
            key={opt.key}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.key)}
            className={cn(
              "flex min-h-14 items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all",
              selected
                ? "border-brand-primary bg-brand-primary/10 shadow-md shadow-brand-primary/20 ring-2 ring-brand-primary/30"
                : "border-brand-surface bg-white hover:border-brand-primary/40 hover:bg-brand-primary/5",
              disabled && "opacity-60"
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                selected
                  ? "bg-brand-primary text-white"
                  : "bg-brand-surface text-brand-text"
              )}
            >
              {opt.key}
            </span>
            <span className="text-sm font-medium text-brand-text sm:text-base">
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TrueFalseOptions({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const choices = ["True", "False"] as const;

  return (
    <div className="mx-auto grid w-full max-w-sm grid-cols-2 gap-3">
      {choices.map((c) => {
        const selected =
          value.toLowerCase() === c.toLowerCase() ||
          value === (c === "True" ? "T" : "F");
        return (
          <button
            key={c}
            type="button"
            disabled={disabled}
            onClick={() => onChange(c)}
            className={cn(
              "flex h-16 items-center justify-center rounded-xl border text-lg font-semibold transition-all",
              selected
                ? "border-brand-primary bg-brand-primary/10 text-brand-text shadow-md shadow-brand-primary/20 ring-2 ring-brand-primary/30"
                : "border-brand-surface bg-white text-brand-text hover:border-brand-primary/40 hover:bg-brand-primary/5",
              disabled && "opacity-60"
            )}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}

function MultiBlankInputs({
  count,
  value,
  onChange,
  disabled,
}: {
  count: number;
  value: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
}) {
  const blanks = Array.from({ length: count }, (_, i) => value[i] ?? "");

  return (
    <div className="mx-auto w-full max-w-md space-y-3 text-left">
      {blanks.map((blank, i) => (
        <div key={i} className="space-y-1">
          <label className="text-xs font-medium text-brand-text/60">
            Blank {i + 1}
          </label>
          <Input
            value={blank}
            disabled={disabled}
            placeholder={`Answer for blank ${i + 1}`}
            className={fieldClassName}
            onChange={(e) => {
              const next = [...blanks];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function hasAnswer(value: string | string[]): boolean {
  if (Array.isArray(value)) {
    return value.some((v) => v.trim().length > 0);
  }
  return value.trim().length > 0;
}
