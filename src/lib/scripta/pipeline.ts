import type { Lang } from "./i18n";

export type StepId = "outline" | "memory" | "synthesis" | "polish";
export type StepStatus = "pending" | "active" | "complete";

export const WORDS_PER_CHAPTER = 2200;
export const WORDS_PER_PAGE = 250;

export const estimate = (chapters: number) => {
  const words = chapters * WORDS_PER_CHAPTER;
  return { words, pages: Math.round(words / WORDS_PER_PAGE) };
};

const EN_TITLES = [
  "The Weight of Small Rooms",
  "What the Mirror Withholds",
  "A Grammar of Absence",
  "The Hour Before Speech",
  "Inventory of Unsent Letters",
  "The Argument With Water",
  "Everything That Stays",
  "A Map Drawn in Reverse",
  "The Second Silence",
  "Where the Floorboards Remember",
  "Notes Toward a Departure",
  "The Long Afternoon",
  "Interior, With Rain",
  "The Cost of Being Understood",
  "A Theory of Doors",
  "The Undertow",
  "What We Practiced",
  "The Last Rehearsal",
  "Threshold",
  "After the Applause",
  "A Colder Kind of Mercy",
  "The Question Repeated",
  "Field Notes on Forgetting",
  "The Shape of a Yes",
  "Salt and Paper",
  "The Room Agrees",
  "Unfinished Weather",
  "The Return, Slightly Altered",
  "Coda for a Stranger",
  "And Then the Light",
];

const AR_TITLES = [
  "ثِقل الغرف الصغيرة",
  "ما تحتفظ به المرآة",
  "نحوٌ للغياب",
  "الساعة التي تسبق الكلام",
  "جردة الرسائل غير المُرسلة",
  "جدال مع الماء",
  "كل ما يبقى",
  "خريطة مرسومة بالمقلوب",
  "الصمت الثاني",
  "حيث تتذكر الألواح",
  "ملاحظات نحو الرحيل",
  "الأصيل الطويل",
  "داخلٌ، مع مطر",
  "ثمن أن تُفهَم",
  "نظرية الأبواب",
  "التيار السفلي",
  "ما تدرّبنا عليه",
  "التمرين الأخير",
  "العتبة",
  "بعد التصفيق",
  "رحمة أبرد",
  "السؤال مُعادًا",
  "ملاحظات ميدانية عن النسيان",
  "شكل الموافقة",
  "ملح وورق",
  "الغرفة توافق",
  "طقسٌ لم يكتمل",
  "العودة، بتغيّر طفيف",
  "خاتمة لغريب",
  "ثم جاء الضوء",
];

const EN_PARAS = [
  "The kettle had not boiled. That was the first thing, and later it would seem like the only honest detail in the whole afternoon — the water going quiet in its metal, the click of a switch nobody had pressed.",
  "She counted the tiles because counting was cheaper than thinking. Seven across, eleven down, one chipped at the corner where a suitcase had struck it in some earlier year, some earlier life that had also insisted it was permanent.",
  "He said her name the way people say a word in a language they have almost lost. Careful. Slightly wrong. Waiting to be corrected and half hoping not to be.",
  "Outside, the street performed its ordinary theatre: a delivery van reversing, a dog deciding against a puddle, two men arguing about a number neither of them could verify. None of it required an audience. All of it had one.",
  "There is a particular fatigue that arrives not from work but from withholding, and it settles in the jaw first. She noticed hers when she tried to smile and found the machinery slow.",
  "The letter stayed in the drawer for eleven days. On the twelfth she moved it to the other drawer, which she understood, even as she did it, was not the same as deciding anything.",
  "What he wanted was simple and therefore unsayable. He wanted the room to hold still. He wanted the past to agree to be past. He asked instead whether she had eaten.",
  "Memory, she had begun to suspect, was not a room you entered but a weather you were caught in. You could dress for it. You could not schedule it.",
  "The clock in the hall was three minutes fast, and had been for as long as anyone remembered, and nobody fixed it because being early had become a family habit disguised as a mechanical fault.",
  "Afterwards they would each tell the story with a different door in it. Both doors were real. Only one had been open.",
];

const AR_PARAS = [
  "لم تكن المِرجل قد وصلت إلى الغليان بعد. كان ذلك أول ما لاحظته، ثم صار لاحقًا التفصيلة الأمينة الوحيدة في ذلك الأصيل كله: الماء يهدأ في معدنه، وطقطقة مفتاح لم يضغطه أحد.",
  "عدَّت البلاطات لأن العدّ أرخص من التفكير. سبعٌ عرضًا، وإحدى عشرة طولًا، وواحدة مشروخة في زاويتها حيث صدمتها حقيبة في عام سابق، في حياة سابقة أصرّت هي أيضًا أنها دائمة.",
  "نطق اسمها كما ينطق الناس كلمة في لغة كادوا يفقدونها. بحذر. وبخطأ طفيف. منتظرًا أن يُصحَّح له، وراجيًا نصف رجاء ألا يُصحَّح.",
  "في الخارج، كان الشارع يؤدي مسرحه المعتاد: شاحنة تتراجع، وكلب يعدل عن بركة ماء، ورجلان يتجادلان حول رقم لا يستطيع أيٌّ منهما التحقق منه. لم يكن شيء من ذلك يحتاج جمهورًا. وكان له جمهور.",
  "هناك تعبٌ خاص لا يأتي من العمل بل من الكتمان، وينزل في الفكّ أولًا. لاحظت تعبها حين حاولت أن تبتسم فوجدت الآلة بطيئة.",
  "بقيت الرسالة في الدرج أحد عشر يومًا. وفي الثاني عشر نقلتها إلى الدرج الآخر، وكانت تعرف، وهي تفعل، أن هذا ليس قرارًا.",
  "ما أراده كان بسيطًا، ولذلك كان غير قابل للقول. أراد أن تثبت الغرفة. أراد أن يقبل الماضي أن يكون ماضيًا. سألها بدلًا من ذلك إن كانت قد أكلت.",
  "بدأت تشتبه أن الذاكرة ليست غرفة تدخلها بل طقسٌ تُحتجز فيه. تستطيع أن تتهيأ له. ولا تستطيع أن تحدد موعده.",
  "ساعة الممر متقدمة ثلاث دقائق، ومنذ ما يتذكره أحد، ولم يصلحها أحد لأن الوصول مبكرًا صار عادة عائلية متنكرة في هيئة خلل ميكانيكي.",
  "بعد ذلك، كان كلٌّ منهما يروي الحكاية وفيها باب مختلف. البابان حقيقيان. واحد فقط كان مفتوحًا.",
];

export const chapterTitle = (index: number, lang: Lang) =>
  (lang === "ar" ? AR_TITLES : EN_TITLES)[index % 30];

/** Deterministic-ish mock chapter body. */
export function chapterBody(index: number, lang: Lang, synopsis: string): string {
  const pool = lang === "ar" ? AR_PARAS : EN_PARAS;
  const opener =
    lang === "ar"
      ? `${synopsis.trim().split(/\s+/).slice(0, 18).join(" ")}…`
      : `${synopsis.trim().split(/\s+/).slice(0, 18).join(" ")}…`;
  const paras: string[] = [opener];
  for (let i = 0; i < 6; i++) {
    paras.push(pool[(index * 3 + i) % pool.length]);
  }
  return paras.join("\n\n");
}

export const humanizerScore = (activeSkillStrengths: number[]) => {
  if (activeSkillStrengths.length === 0) return 61;
  const avg = activeSkillStrengths.reduce((a, b) => a + b, 0) / activeSkillStrengths.length;
  return Math.min(99, Math.round(70 + avg * 5));
};
