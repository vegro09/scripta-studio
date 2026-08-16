import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Lang } from "./i18n";

export type SkillCategory = "Style" | "Anti-AI Filter" | "Pacing" | "Structure";

export type Skill = {
  id: string;
  name: string;
  category: SkillCategory;
  directive: string;
  /** 1-5: Subtle · Light · Balanced · Strong · Aggressive */
  strength: number;
  active: boolean;
};

export type BookRecord = {
  id: string;
  title: string;
  genre: string;
  language: Lang;
  chapters: number;
  words: number;
  pages: number;
  humanizerScore: number;
  createdAt: string;
  chapterTitles: string[];
  chapterBodies: string[];
};

export type ReaderPrefs = {
  size: "S" | "M" | "L" | "XL";
  leading: "compact" | "comfortable" | "relaxed";
};

const DEFAULT_SKILLS: Skill[] = [
  {
    id: "human-rhythm",
    name: "Human Rhythm / Anti-AI",
    category: "Anti-AI Filter",
    directive:
      "Vary sentence length aggressively: follow a long, winding clause with a three-word fragment. Break at least one grammatical convention per page the way a confident human writer does. Never open two consecutive paragraphs with the same syntactic shape.",
    strength: 5,
    active: true,
  },
  {
    id: "sensory-immersion",
    name: "Sensory Immersion",
    category: "Style",
    directive:
      "Anchor every scene in at least two non-visual senses within its first hundred words. Prefer concrete, specific nouns over abstractions. Temperature, texture, and sound carry emotional weight; use them instead of naming the emotion.",
    strength: 4,
    active: true,
  },
  {
    id: "subtext-conflict",
    name: "Subtext & Conflict",
    category: "Structure",
    directive:
      "Every exchange must carry a want the speaker will not state directly. Keep the surface conversation mundane while the pressure underneath escalates. End scenes a beat before resolution so tension carries into the next chapter.",
    strength: 4,
    active: true,
  },
  {
    id: "fingerprint-neutralizer",
    name: "AI Fingerprint Neutralizer",
    category: "Anti-AI Filter",
    directive:
      "Strip transitional scaffolding such as 'moreover', 'in conclusion', and 'it is important to note'. Remove balanced three-item lists and symmetrical paragraph lengths. Allow the prose to end on an uneven, unresolved cadence.",
    strength: 5,
    active: true,
  },
  {
    id: "show-dont-tell",
    name: "Show Don't Tell Engine",
    category: "Style",
    directive:
      "Convert stated emotion into observable behaviour: a hand that stops mid-gesture, a reply that arrives a half-second late. Reveal interiority through choice and physical detail, never through summary. Delete any sentence that explains what the previous sentence already dramatised.",
    strength: 4,
    active: true,
  },
  {
    id: "organic-dialogue",
    name: "Organic Dialogue Shaper",
    category: "Pacing",
    directive:
      "Let characters interrupt, trail off, and answer questions that were never asked. Keep speech tags plain and sparse; blocking should replace adverbs. Real conversation is inefficient — preserve the inefficiency that reveals character.",
    strength: 3,
    active: false,
  },
];

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  skills: Skill[];
  addSkill: (s: Omit<Skill, "id">) => void;
  updateSkill: (id: string, patch: Partial<Skill>) => void;
  deleteSkill: (id: string) => void;
  books: BookRecord[];
  addBook: (b: Omit<BookRecord, "id" | "createdAt">) => void;
  reader: ReaderPrefs;
  setReader: (p: Partial<ReaderPrefs>) => void;
};

const ScriptaContext = createContext<Ctx | null>(null);

const KEY = "scripta-session-v1";

type Persisted = { lang: Lang; skills: Skill[]; books: BookRecord[]; reader: ReaderPrefs };

export function ScriptaProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const [skills, setSkills] = useState<Skill[]>(DEFAULT_SKILLS);
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [reader, setReaderState] = useState<ReaderPrefs>({ size: "M", leading: "comfortable" });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<Persisted>;
        if (p.lang) setLang(p.lang);
        if (p.skills) setSkills(p.skills);
        if (p.books) setBooks(p.books);
        if (p.reader) setReaderState(p.reader);
      }
    } catch {
      /* ignore corrupt session data */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ lang, skills, books, reader }));
    } catch {
      /* storage unavailable */
    }
  }, [hydrated, lang, skills, books, reader]);

  const addSkill = useCallback((s: Omit<Skill, "id">) => {
    setSkills((prev) => [...prev, { ...s, id: `skill-${Date.now()}-${prev.length}` }]);
  }, []);

  const updateSkill = useCallback((id: string, patch: Partial<Skill>) => {
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const deleteSkill = useCallback((id: string) => {
    setSkills((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const addBook = useCallback((b: Omit<BookRecord, "id" | "createdAt">) => {
    setBooks((prev) => [
      { ...b, id: `book-${Date.now()}`, createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const setReader = useCallback((p: Partial<ReaderPrefs>) => {
    setReaderState((prev) => ({ ...prev, ...p }));
  }, []);

  const value = useMemo<Ctx>(
    () => ({ lang, setLang, skills, addSkill, updateSkill, deleteSkill, books, addBook, reader, setReader }),
    [lang, skills, addSkill, updateSkill, deleteSkill, books, addBook, reader, setReader],
  );

  return <ScriptaContext.Provider value={value}>{children}</ScriptaContext.Provider>;
}

export function useScripta() {
  const ctx = useContext(ScriptaContext);
  if (!ctx) throw new Error("useScripta must be used inside ScriptaProvider");
  return ctx;
}
