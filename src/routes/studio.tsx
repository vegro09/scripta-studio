import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BookOpenText, Check, Download, FileText, FileType2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppShell } from "@/components/scripta/AppShell";
import { useScripta, type ReaderPrefs } from "@/lib/scripta/store";
import { GENRES, LANGS, genreLabel, nf, t, type Lang } from "@/lib/scripta/i18n";
import {
  chapterBody,
  chapterTitle,
  estimate,
  humanizerScore,
  WORDS_PER_PAGE,
  type StepId,
  type StepStatus,
} from "@/lib/scripta/pipeline";
import { exportManuscript, type ExportFormat } from "@/lib/scripta/export";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Author Studio — Scripta AI Book Authoring" },
      {
        name: "description",
        content:
          "Configure a full-length book — title, synopsis, genre, language, scale and authoring skills — then run the Scripta synthesis pipeline and export DOCX, PDF or Markdown.",
      },
      { property: "og:title", content: "Author Studio — Scripta" },
      {
        property: "og:description",
        content: "Architect and generate long-form manuscripts with editorial-grade control.",
      },
    ],
  }),
  component: StudioPage,
});

type Phase = "idle" | "running" | "failed" | "done";

const STEPS: { id: StepId; key: string }[] = [
  { id: "outline", key: "step1" },
  { id: "memory", key: "step2" },
  { id: "synthesis", key: "step3" },
  { id: "polish", key: "step4" },
];

function StudioPage() {
  const { lang, setLang, skills, updateSkill, addBook, reader, setReader } = useScripta();

  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [genre, setGenre] = useState("");
  const [chapters, setChapters] = useState(12);

  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [written, setWritten] = useState<{ title: string; body: string }[]>([]);
  const [subStatus, setSubStatus] = useState("");
  const [touched, setTouched] = useState(false);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  const projected = estimate(chapters);
  const valid = title.trim().length > 0 && synopsis.trim().length > 0 && genre.length > 0;
  const activeSkills = skills.filter((s) => s.active);

  const wordsWritten = useMemo(
    () => written.reduce((a, c) => a + c.body.trim().split(/\s+/).length, 0),
    [written],
  );

  const stepStatus = (i: number): StepStatus => {
    if (phase === "done") return "complete";
    if (phase === "idle") return "pending";
    if (i < stepIndex) return "complete";
    if (i === stepIndex) return "active";
    return "pending";
  };

  const schedule = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const runSynthesis = useCallback(
    (fromChapter: number, existing: { title: string; body: string }[]) => {
      setPhase("running");
      setStepIndex(2);
      const failAt = Math.random() < 0.18 ? fromChapter + Math.floor(chapters / 2) : -1;
      let acc = existing;

      const writeChapter = (i: number) => {
        if (i >= chapters) {
          setStepIndex(3);
          setSubStatus(t(lang, "step4"));
          schedule(() => {
            setPhase("done");
            setSubStatus("");
            const words = acc.reduce((a, c) => a + c.body.trim().split(/\s+/).length, 0);
            addBook({
              title: title.trim(),
              genre,
              language: lang,
              chapters,
              words,
              pages: Math.max(1, Math.round(words / WORDS_PER_PAGE)),
              humanizerScore: humanizerScore(activeSkills.map((s) => s.strength)),
              chapterTitles: acc.map((c) => c.title),
              chapterBodies: acc.map((c) => c.body),
            });
          }, 1400);
          return;
        }
        if (i === failAt) {
          schedule(() => setPhase("failed"), 700);
          return;
        }
        const ct = chapterTitle(i, lang);
        setSubStatus(
          `${t(lang, "chapter")} ${nf(lang, i + 1)} ${t(lang, "of")} ${nf(lang, chapters)} · ${nf(lang, 1600 + ((i * 137) % 900))} ${t(lang, "words")}`,
        );
        schedule(() => {
          const body = chapterBody(i, lang, synopsis);
          acc = [...acc, { title: ct, body }];
          setWritten(acc);
          writeChapter(i + 1);
        }, 900);
      };
      writeChapter(fromChapter);
    },
    [activeSkills, addBook, chapters, genre, lang, synopsis, title],
  );

  const start = () => {
    setTouched(true);
    if (!valid) return;
    clearTimers();
    setWritten([]);
    setPhase("running");
    setStepIndex(0);
    setSubStatus(t(lang, "step1"));
    schedule(() => {
      setStepIndex(1);
      setSubStatus(t(lang, "step2"));
      schedule(() => runSynthesis(0, []), 1200);
    }, 1300);
  };

  const retry = () => {
    clearTimers();
    runSynthesis(written.length, written);
  };

  const onExport = (format: ExportFormat) => {
    void exportManuscript(
      {
        title: title.trim() || "Untitled",
        genre: genreLabel(genre, lang),
        language: lang,
        chapterTitles: written.map((c) => c.title),
        chapterBodies: written.map((c) => c.body),
      },
      format,
    );
  };

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* Mobile sticky progress */}
        {phase !== "idle" && (
          <div className="sticky top-16 z-30 -mx-4 border-y border-border bg-surface px-4 py-2 text-xs sm:-mx-6 sm:px-6 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate font-medium">
                {t(lang, STEPS[Math.min(stepIndex, 3)]?.key ?? "step1")}
              </span>
              <span className="shrink-0 text-muted-foreground">
                {nf(lang, written.length)} / {nf(lang, chapters)}
              </span>
            </div>
            <div className="mt-2 h-1 w-full bg-surface-alt">
              <div
                className="h-1 bg-foreground transition-editorial"
                style={{ width: `${Math.round((written.length / chapters) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* LEFT: configuration */}
        <section className="space-y-6 rounded-lg border border-border bg-surface p-5 sm:p-6">
          <div>
            <h1 className="font-serif text-2xl">{t(lang, "bookConfig")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t(lang, "tagline")}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor="book-title">{t(lang, "bookTitle")}</Label>
              <span className="text-xs text-muted-foreground">
                {nf(lang, title.length)}/{nf(lang, 80)}
              </span>
            </div>
            <Input
              id="book-title"
              maxLength={80}
              value={title}
              placeholder={t(lang, "bookTitlePh")}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-background"
            />
            {touched && !title.trim() && (
              <p className="text-xs text-destructive">{t(lang, "validation")}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor="synopsis">{t(lang, "synopsis")}</Label>
              <span className="text-xs text-muted-foreground">
                {nf(lang, synopsis.length)}/{nf(lang, 2000)}
              </span>
            </div>
            <Textarea
              id="synopsis"
              rows={7}
              maxLength={2000}
              value={synopsis}
              placeholder={t(lang, "synopsisPh")}
              onChange={(e) => setSynopsis(e.target.value)}
              className="bg-background"
            />
            {synopsis.length > 0 && synopsis.length < 500 && (
              <p className="text-xs text-muted-foreground">{t(lang, "synopsisHint")}</p>
            )}
            {touched && !synopsis.trim() && (
              <p className="text-xs text-destructive">{t(lang, "validation")}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="genre">{t(lang, "genre")}</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger id="genre" className="bg-background">
                  <SelectValue placeholder={t(lang, "genrePh")} />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {genreLabel(g.value, lang)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {touched && !genre && (
                <p className="text-xs text-destructive">{t(lang, "validation")}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">{t(lang, "language")}</Label>
              <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
                <SelectTrigger id="language" className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor="scale">{t(lang, "scale")}</Label>
              <span className="text-sm font-medium">
                {nf(lang, chapters)} {t(lang, "chapters")}
              </span>
            </div>
            <Slider
              id="scale"
              aria-label={t(lang, "scale")}
              min={3}
              max={30}
              step={1}
              value={[chapters]}
              onValueChange={(v) => setChapters(v[0] ?? 12)}
              dir={lang === "ar" ? "rtl" : "ltr"}
            />
            <p className="font-serif text-sm text-muted-foreground">
              ~{nf(lang, projected.words)} {t(lang, "words")} · ~{nf(lang, projected.pages)}{" "}
              {t(lang, "pages")}
            </p>
          </div>

          <div className="space-y-3">
            <Label>{t(lang, "activeSkills")}</Label>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={s.active}
                  onClick={() => updateSkill(s.id, { active: !s.active })}
                  className={cn(
                    "transition-editorial flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                    s.active
                      ? "border-foreground bg-foreground text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn("size-1.5 rounded-full", s.active ? "bg-background" : "bg-foreground")}
                    style={{ opacity: 0.25 + s.strength * 0.15 }}
                  />
                  {s.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{t(lang, "skillsHint")}</p>
          </div>

          <Button
            onClick={start}
            disabled={!valid || phase === "running"}
            className="h-12 w-full rounded-md text-sm font-medium"
          >
            {phase === "running" ? t(lang, "ctaBusy") : t(lang, "cta")}
          </Button>
          {!valid && <p className="text-center text-xs text-muted-foreground">{t(lang, "validation")}</p>}
        </section>

        {/* RIGHT: pipeline + output */}
        <section className="space-y-6">
          <div className="rounded-lg border border-border bg-surface p-5 sm:p-6">
            <h2 className="font-serif text-xl">{t(lang, "pipeline")}</h2>
            <ol className="mt-4 space-y-4">
              {STEPS.map((s, i) => {
                const status = stepStatus(i);
                return (
                  <li key={s.id} className="flex items-start gap-3">
                    <span className="mt-1 flex size-4 shrink-0 items-center justify-center">
                      {status === "complete" ? (
                        <Check className="size-4" aria-hidden />
                      ) : (
                        <span
                          aria-hidden
                          className={cn(
                            "size-2.5 rounded-full",
                            status === "active" ? "dot-pulse bg-foreground" : "bg-input",
                          )}
                        />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-sm",
                          status === "pending" ? "text-muted-foreground" : "font-medium text-foreground",
                        )}
                      >
                        {t(lang, s.key)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {status === "active"
                          ? subStatus || t(lang, "active")
                          : t(lang, status === "complete" ? "complete" : "pending")}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {phase === "failed" && (
            <div className="rounded-lg border border-destructive/40 bg-surface-alt p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
                <div className="min-w-0">
                  <p className="font-medium">{t(lang, "failed")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t(lang, "failedBody")}</p>
                  <Button variant="outline" className="mt-4" onClick={retry}>
                    {t(lang, "retry")}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {written.length === 0 && phase !== "failed" ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface-alt/50 p-10 text-center">
              <BookOpenText className="size-10 text-muted-foreground/50" aria-hidden />
              <p className="font-serif text-lg">{t(lang, "emptyOutput")}</p>
              <p className="max-w-xs text-sm text-muted-foreground">{t(lang, "emptyOutputSub")}</p>
            </div>
          ) : (
            <Reader
              chaptersWritten={written}
              lang={lang}
              reader={reader}
              setReader={setReader}
              wordsWritten={wordsWritten}
              total={chapters}
            />
          )}

          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-4">
            <span className="me-2 text-sm font-medium">{t(lang, "export")}</span>
            {(
              [
                { f: "docx" as const, icon: FileType2, label: "DOCX" },
                { f: "pdf" as const, icon: FileText, label: "PDF" },
                { f: "md" as const, icon: Download, label: "Markdown" },
              ]
            ).map(({ f, icon: Icon, label }) => (
              <Button
                key={f}
                variant="outline"
                disabled={phase !== "done"}
                onClick={() => onExport(f)}
                className="gap-2"
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Button>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

const SIZE_CLASS: Record<ReaderPrefs["size"], string> = {
  S: "text-sm",
  M: "text-base",
  L: "text-lg",
  XL: "text-xl",
};
const LEAD_CLASS: Record<ReaderPrefs["leading"], string> = {
  compact: "leading-snug",
  comfortable: "leading-relaxed",
  relaxed: "leading-loose",
};

function Reader({
  chaptersWritten,
  lang,
  reader,
  setReader,
  wordsWritten,
  total,
}: {
  chaptersWritten: { title: string; body: string }[];
  lang: Lang;
  reader: ReaderPrefs;
  setReader: (p: Partial<ReaderPrefs>) => void;
  wordsWritten: number;
  total: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-background">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-5 py-3 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate font-serif text-lg">{t(lang, "reader")}</h2>
          <p className="text-xs text-muted-foreground">
            {nf(lang, chaptersWritten.length)} {t(lang, "of")} {nf(lang, total)} ·{" "}
            {nf(lang, wordsWritten)} {t(lang, "words")}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{t(lang, "fontSize")}</span>
            {(["S", "M", "L", "XL"] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={reader.size === s}
                aria-label={`${t(lang, "fontSize")} ${s}`}
                onClick={() => setReader({ size: s })}
                className={cn(
                  "transition-editorial min-h-8 min-w-8 rounded border px-2 text-xs",
                  reader.size === s
                    ? "border-foreground bg-foreground text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{t(lang, "lineHeight")}</span>
            {(["compact", "comfortable", "relaxed"] as const).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={reader.leading === l}
                onClick={() => setReader({ leading: l })}
                className={cn(
                  "transition-editorial min-h-8 rounded border px-2 text-xs",
                  reader.leading === l
                    ? "border-foreground bg-foreground text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {t(lang, l)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="max-h-[38rem] overflow-y-auto px-5 py-6 sm:px-10">
        {chaptersWritten.map((c, i) => (
          <article key={i} className="mb-10 last:mb-0">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {t(lang, "chapter")} {nf(lang, i + 1)}
            </p>
            <h3 className="mt-1 font-serif text-2xl">{c.title}</h3>
            <div
              className={cn(
                "mt-4 space-y-4 font-serif text-foreground",
                SIZE_CLASS[reader.size],
                LEAD_CLASS[reader.leading],
              )}
            >
              {c.body.split("\n\n").map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
