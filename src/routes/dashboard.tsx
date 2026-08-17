import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppShell } from "@/components/scripta/AppShell";
import { useScripta, type Skill, type SkillCategory } from "@/lib/scripta/store";
import { CATEGORY_KEYS, STRENGTH_LABEL_KEYS, genreLabel, nf, t, type Lang } from "@/lib/scripta/i18n";
import { exportManuscript, type ExportFormat } from "@/lib/scripta/export";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard & Skill Engine — Scripta" },
      {
        name: "description",
        content:
          "Track synthesized books, pages generated and humanizer scores, curate your Skill Vault directives, and re-download past manuscripts as DOCX, PDF or Markdown.",
      },
      { property: "og:title", content: "Dashboard & Skill Engine — Scripta" },
      {
        property: "og:description",
        content: "Your manuscript metrics, authoring skill directives, and book archive.",
      },
    ],
  }),
  component: DashboardPage,
});

function useCountUp(target: number, enabled: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const duration = 400;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, enabled]);
  return value;
}

function MetricCard({ label, value, lang }: { label: string; value: number | null; lang: Lang }) {
  const animated = useCountUp(value ?? 0, value !== null);
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-3 font-serif text-3xl">{value === null ? "—" : nf(lang, animated)}</p>
    </div>
  );
}

const CATEGORIES: SkillCategory[] = ["Style", "Anti-AI Filter", "Pacing", "Structure"];

function DashboardPage() {
  const { lang, skills, books, addSkill, updateSkill, deleteSkill } = useScripta();
  const [editing, setEditing] = useState<Skill | "new" | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Skill | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<SkillCategory>("Style");
  const [directive, setDirective] = useState("");
  const [strength, setStrength] = useState(3);

  const openNew = () => {
    setName("");
    setCategory("Style");
    setDirective("");
    setStrength(3);
    setEditing("new");
  };
  const openEdit = (s: Skill) => {
    setName(s.name);
    setCategory(s.category);
    setDirective(s.directive);
    setStrength(s.strength);
    setEditing(s);
  };

  const save = () => {
    if (!name.trim() || !directive.trim()) return;
    if (editing === "new") {
      addSkill({ name: name.trim(), category, directive: directive.trim(), strength, active: true });
    } else if (editing) {
      updateSkill(editing.id, { name: name.trim(), category, directive: directive.trim(), strength });
    }
    setEditing(null);
  };

  const totalPages = books.reduce((a, b) => a + b.pages, 0);
  const avgScore = books.length
    ? Math.round(books.reduce((a, b) => a + b.humanizerScore, 0) / books.length)
    : null;

  const reDownload = (bookId: string, format: ExportFormat) => {
    const b = books.find((x) => x.id === bookId);
    if (!b) return;
    void exportManuscript(
      {
        title: b.title,
        genre: genreLabel(b.genre, lang),
        language: b.language,
        chapterTitles: b.chapterTitles,
        chapterBodies: b.chapterBodies,
      },
      format,
    );
  };

  return (
    <AppShell>
      <div className="space-y-10">
        <div>
          <h1 className="font-serif text-3xl">{t(lang, "dashboard")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t(lang, "tagline")}</p>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label={t(lang, "totalBooks")} value={books.length} lang={lang} />
          <MetricCard
            label={t(lang, "totalPages")}
            value={books.length ? totalPages : null}
            lang={lang}
          />
          <MetricCard
            label={t(lang, "activeCustomSkills")}
            value={skills.filter((s) => s.active).length}
            lang={lang}
          />
          <MetricCard label={t(lang, "avgScore")} value={avgScore} lang={lang} />
        </section>

        <section className="space-y-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
            <h2 className="truncate font-serif text-2xl">{t(lang, "skillVault")}</h2>
            <Button onClick={openNew} className="shrink-0 gap-2">
              <Plus className="size-4" aria-hidden />
              {t(lang, "addSkill")}
            </Button>
          </div>

          {skills.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface-alt/50 p-10 text-center">
              <p className="font-serif text-lg">{t(lang, "emptySkills")}</p>
              <Button onClick={openNew} variant="outline" className="mt-4">
                {t(lang, "emptySkillsCta")}
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {skills.map((s) => (
                <article
                  key={s.id}
                  className="flex flex-col rounded-lg border border-border bg-surface p-5"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-serif text-lg">{s.name}</h3>
                      <p className="mt-1 inline-block rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
                        {t(lang, CATEGORY_KEYS[s.category] ?? "catStyle")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Label htmlFor={`toggle-${s.id}`} className="text-xs text-muted-foreground">
                        {t(lang, "activeToggle")}
                      </Label>
                      <Switch
                        id={`toggle-${s.id}`}
                        checked={s.active}
                        onCheckedChange={(v) => updateSkill(s.id, { active: v })}
                      />
                    </div>
                  </div>
                  <p className="mt-3 grow text-sm leading-relaxed text-muted-foreground">
                    {s.directive}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      {t(lang, STRENGTH_LABEL_KEYS[s.strength - 1] ?? "strengthBalanced")}
                      <span className="flex gap-1" aria-hidden>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span
                            key={n}
                            className={cn(
                              "size-1.5 rounded-full",
                              n <= s.strength ? "bg-foreground" : "bg-input",
                            )}
                          />
                        ))}
                      </span>
                    </span>
                    <span className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`${t(lang, "editSkill")}: ${s.name}`}
                        onClick={() => openEdit(s)}
                        className="min-h-11 min-w-11"
                      >
                        <Pencil className="size-4" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`${t(lang, "delete")}: ${s.name}`}
                        onClick={() => setPendingDelete(s)}
                        className="min-h-11 min-w-11"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-2xl">{t(lang, "archive")}</h2>
          {books.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface-alt/50 p-10 text-center">
              <p className="font-serif text-lg">{t(lang, "emptyBooks")}</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/studio">{t(lang, "goStudio")}</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border bg-surface">
              <table className="w-full min-w-[46rem] text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="p-4 text-start font-medium">{t(lang, "colTitle")}</th>
                    <th className="p-4 text-start font-medium">{t(lang, "colGenre")}</th>
                    <th className="p-4 text-start font-medium">{t(lang, "colLang")}</th>
                    <th className="p-4 text-start font-medium">{t(lang, "colChapters")}</th>
                    <th className="p-4 text-start font-medium">{t(lang, "colDate")}</th>
                    <th className="p-4 text-end font-medium">{t(lang, "colDownload")}</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((b) => (
                    <tr key={b.id} className="border-b border-border last:border-0">
                      <td className="p-4 font-serif">{b.title}</td>
                      <td className="p-4 text-muted-foreground">{genreLabel(b.genre, lang)}</td>
                      <td className="p-4 uppercase text-muted-foreground">{b.language}</td>
                      <td className="p-4 text-muted-foreground">{nf(lang, b.chapters)}</td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(b.createdAt).toLocaleDateString(lang === "ar" ? "ar-EG" : lang)}
                      </td>
                      <td className="p-4 text-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                              <Download className="size-4" aria-hidden />
                              {t(lang, "export")}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => reDownload(b.id, "docx")}>
                              DOCX
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => reDownload(b.id, "pdf")}>
                              PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => reDownload(b.id, "md")}>
                              Markdown
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Add / edit skill */}
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-surface sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editing === "new" ? t(lang, "addSkill") : t(lang, "editSkill")}
            </DialogTitle>
            <DialogDescription>{t(lang, "skillsHint")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skill-name">{t(lang, "skillName")}</Label>
              <Input
                id="skill-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-category">{t(lang, "category")}</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as SkillCategory)}>
                <SelectTrigger id="skill-category" className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(lang, CATEGORY_KEYS[c] ?? "catStyle")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-directive">{t(lang, "directive")}</Label>
              <Textarea
                id="skill-directive"
                rows={6}
                value={directive}
                onChange={(e) => setDirective(e.target.value)}
                className="bg-background font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <Label htmlFor="skill-strength">{t(lang, "strength")}</Label>
                <span className="text-sm font-medium">
                  {t(lang, STRENGTH_LABEL_KEYS[strength - 1] ?? "strengthBalanced")}
                </span>
              </div>
              <Slider
                id="skill-strength"
                aria-label={t(lang, "strength")}
                min={1}
                max={5}
                step={1}
                value={[strength]}
                onValueChange={(v) => setStrength(v[0] ?? 3)}
                dir={lang === "ar" ? "rtl" : "ltr"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              {t(lang, "cancel")}
            </Button>
            <Button onClick={save} disabled={!name.trim() || !directive.trim()}>
              {t(lang, "save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={pendingDelete !== null} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <DialogContent className="bg-surface sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{t(lang, "confirmDelete")}</DialogTitle>
            <DialogDescription>{t(lang, "confirmDeleteBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              {t(lang, "cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingDelete) deleteSkill(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              {t(lang, "delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
