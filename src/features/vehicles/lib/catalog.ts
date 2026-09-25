/** UI suggestions only — never used as data or defaults. */
export const manufacturerSuggestions: Record<string, string[]> = {
  Hyundai: ["Elantra", "Sonata", "Accent", "Tucson", "Santa Fe", "Creta"],
  Toyota: ["Camry", "Corolla", "Land Cruiser", "Hilux", "Yaris", "RAV4"],
  Nissan: ["Sunny", "Altima", "Patrol", "X-Trail"],
  Kia: ["Cerato", "Optima", "Sportage", "Rio"],
  Honda: ["Accord", "Civic", "CR-V"],
  Chevrolet: ["Malibu", "Tahoe", "Captiva"],
  Ford: ["Taurus", "Explorer", "F-150"],
  Mazda: ["Mazda 3", "Mazda 6", "CX-5"],
};

/** Common model years to surface first for some models (e.g. Elantra 2011). */
export const featuredYears: Record<string, number[]> = {
  "Hyundai|Elantra": [2011, 2012, 2013, 2016, 2019, 2021],
};

export const transmissionOptions = [
  { value: "automatic", label: "أوتوماتيك" },
  { value: "manual", label: "عادي (يدوي)" },
  { value: "cvt", label: "CVT" },
  { value: "dct", label: "ثنائي القابض (DCT)" },
];

export const fuelOptions = [
  { value: "gasoline_91", label: "بنزين 91" },
  { value: "gasoline_95", label: "بنزين 95" },
  { value: "diesel", label: "ديزل" },
  { value: "hybrid", label: "هجين" },
  { value: "electric", label: "كهربائي" },
];

export const labelOf = (options: { value: string; label: string }[], v: string | null) =>
  options.find((o) => o.value === v)?.label ?? v ?? "—";
