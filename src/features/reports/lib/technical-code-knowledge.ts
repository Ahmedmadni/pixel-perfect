/** Reviewed generic diagnostic guidance, not OEM fitment or a confirmed diagnosis. */
export type PartKind = "intake" | "pcv" | "maf" | "fuel" | "front-o2" | "plugs" | "coils" | "injector" | "catalyst" | "thermostat" | "coolant-sensor";
export interface TechnicalCause { cause: string; check: string; partKinds: PartKind[] }
export interface TechnicalCodeKnowledge { code: string; meaning: string; causes: TechnicalCause[]; caution: string; source: { title: string; url: string }; scope: string }

const reviewed: Record<string, Omit<TechnicalCodeKnowledge, "code" | "source" | "scope">> = {
  P0171: {
    meaning: "خليط وقود فقير في البنك 1؛ لا يعني وحده تلف حساس الأكسجين.",
    causes: [
      { cause: "هواء غير محسوب من تسرب في مجرى السحب أو منظومة PCV", check: "فحص دخان لمجرى السحب ومقارنة تصحيح الوقود STFT/LTFT عند الخمول ومع رفع الدوران.", partKinds: ["intake", "pcv"] },
      { cause: "قياس غير صحيح لتدفق الهواء إذا كان المحرك مزودًا بحساس MAF", check: "فحص مجرى الهواء والموصل وقراءة MAF مقابل مواصفات المحرك؛ لا تفترض وجود MAF بدل MAP.", partKinds: ["maf"] },
      { cause: "ضغط وقود منخفض أو بخاخ مقيد التدفق", check: "قياس ضغط الوقود تحت الحمل وفحص توازن البخاخات وفق مواصفات السيارة.", partKinds: ["fuel", "injector"] },
      { cause: "انحراف حساس الأكسجين الأمامي أو تسرب عادم قبله", check: "استبعاد تسرب العادم واختبار استجابة الحساس لتغيير الخليط قبل استبداله.", partKinds: ["front-o2"] },
    ],
    caution: "ابدأ باختبار التسرب وضغط الوقود؛ قراءة خليط فقير ليست إثباتًا لتلف الحساس.",
  },
  P0300: {
    meaning: "فقد اشتعال عشوائي أو متعدد الأسطوانات؛ الكود لا يحدد القطعة التالفة.",
    causes: [
      { cause: "بواجي متآكلة أو خلل في ملفات/توصيلات الإشعال", check: "قراءة عدادات فقد الاشتعال وفحص البواجي والفجوة؛ اختبار تبديل الملف بين الأسطوانات عند ملاءمة التصميم.", partKinds: ["plugs", "coils"] },
      { cause: "خلل تغذية الوقود أو تسرب هواء يؤدي لخليط فقير", check: "فحص ضغط الوقود وتوازن البخاخات وتسرب السحب؛ عند وجود P0171 افحص السبب المشترك أولًا.", partKinds: ["fuel", "injector", "intake", "pcv"] },
      { cause: "ضعف انضغاط أو خلل صمام/توقيت ميكانيكي", check: "اختبار ضغط الأسطوانات وتسريبها إذا لم تفسر اختبارات الإشعال والوقود العطل.", partKinds: [] },
    ],
    caution: "إذا ومضت لمبة المحرك أو كان التقطيع شديدًا فتوقف بأمان؛ استمرار القيادة قد يتلف المحول الحفاز.",
  },
  P0135: {
    meaning: "خلل دائرة تسخين حساس الأكسجين في البنك 1، الحساس 1 (الأمامي).",
    causes: [
      { cause: "قطع أو مقاومة مرتفعة أو قصر في أسلاك دائرة السخان", check: "فحص تغذية السخان والأرضي والموصلات والفيوز حسب مخطط السيارة.", partKinds: [] },
      { cause: "قطع أو قصر داخلي في سخان حساس الأكسجين الأمامي", check: "قياس مقاومة السخان وهو بارد ومقارنتها بمواصفات المصنع بعد التأكد من سلامة الدائرة.", partKinds: ["front-o2"] },
    ],
    caution: "لا تستبدل الحساس قبل التحقق من التغذية والأسلاك؛ الحساس الخلفي ليس بديلًا للأمامي.",
  },
  P0420: {
    meaning: "كفاءة منظومة المحول الحفاز دون الحد في البنك 1.",
    causes: [
      { cause: "ضعف كفاءة المحول الحفاز", check: "مقارنة إشارات حساسي الأكسجين قبل المحول وبعده عند حرارة التشغيل وفق إجراء المصنع.", partKinds: ["catalyst"] },
      { cause: "تسرب عادم أو قراءة حساس غير صحيحة أو خلل احتراق يؤثر على التقييم", check: "فحص تسرب العادم وسلامة استجابة الحساسين وإصلاح فقد الاشتعال وخلل الخليط أولًا.", partKinds: [] },
    ],
    caution: "عالج سبب تلف المحول قبل استبداله؛ الكود وحده لا يكفي لاتخاذ قرار الشراء.",
  },
  P0128: {
    meaning: "حرارة سائل التبريد أقل من حرارة تنظيم الثرموستات خلال مدة الإحماء المتوقعة.",
    causes: [
      { cause: "ثرموستات عالق مفتوحًا أو يسرب", check: "متابعة ارتفاع حرارة المحرك من بدء بارد ومقارنتها بمواصفات المصنع.", partKinds: ["thermostat"] },
      { cause: "نقص سائل تبريد أو تشغيل مفرط لمروحة التبريد", check: "فحص المستوى والمحرك بارد وفحص التسرب وتشغيل المروحة.", partKinds: [] },
      { cause: "قراءة غير صحيحة لحساس حرارة سائل التبريد أو هواء السحب", check: "مقارنة القراءتين بحرارة الجو قبل التشغيل وفحص الأسلاك قبل استبدال الحساس.", partKinds: ["coolant-sensor"] },
    ],
    caution: "لا تفتح غطاء التبريد والمحرك ساخن؛ يراجع الفني درجة الثرموستات الصحيحة للمحرك.",
  },
};

export function getTechnicalCodeKnowledge(raw: string): TechnicalCodeKnowledge | null {
  const code = raw.trim().toUpperCase();
  const cylinder = /^P030([1-8])$/.exec(code)?.[1];
  const base = reviewed[cylinder ? "P0300" : code];
  if (!base) return null;
  return { ...base, code, ...(cylinder ? { meaning: `فقد اشتعال في الأسطوانة ${cylinder}؛ تأكد من ترقيم الأسطوانات من دليل المحرك.` } : {}),
    source: { title: "OBD-Codes · مرجع تشخيص عام", url: `https://www.obd-codes.com/${cylinder ? "p0300" : code.toLowerCase()}` },
    scope: "أسباب محتملة عامة؛ تختلف إجراءات الفحص ومواصفات القطع حسب المحرك، ولا تمثل تشخيصًا مؤكدًا أو مطابقة برقم الهيكل.",
  };
}

const aliases: Record<PartKind, string[]> = {
  intake: ["خرطوم سحب", "خرطوم فاكيوم", "جلدة مانيفولد", "جوان مانيفولد", "intake gasket", "vacuum hose", "intake hose"],
  pcv: ["pcv", "بلف تبخير", "صمام تهوية علبة المرفق"],
  maf: ["maf", "mass air flow", "حساس كتلة الهواء", "حساس تدفق الهواء"],
  fuel: ["طرمبة بنزين", "مضخة وقود", "فلتر بنزين", "فلتر وقود", "fuel pump", "fuel filter"],
  "front-o2": ["حساس اكسجين امامي", "حساس اكسجين قبل", "حساس o2 امامي", "حساس خليط", "upstream oxygen", "front oxygen", "air fuel ratio sensor"],
  plugs: ["بواجي", "بوجي", "شمعة اشعال", "شمعات اشعال", "spark plug"],
  coils: ["كويل", "كويلات", "ملف اشعال", "ملفات اشعال", "ignition coil"],
  injector: ["بخاخ وقود", "بخاخ بنزين", "fuel injector"],
  catalyst: ["محول حفاز", "دبة تلوث", "catalytic converter"],
  thermostat: ["ثرموستات", "ترموستات", "thermostat"],
  "coolant-sensor": ["حساس حرارة الماء", "حساس حرارة سائل التبريد", "coolant temperature sensor"],
};
function normalize(s: string) { return s.toLowerCase().normalize("NFKC").replace(/[أإآ]/g, "ا").replace(/[\u064b-\u065f\u0640]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim(); }
export function matchesPartKind(name: string, kind: PartKind): boolean {
  const text = ` ${normalize(name)} `;
  if (kind === "front-o2" && /خلفي|rear|downstream/.test(text)) return false;
  return aliases[kind].some(alias => text.includes(` ${normalize(alias)} `));
}