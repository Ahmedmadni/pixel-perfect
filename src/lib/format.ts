const km = new Intl.NumberFormat("en-US");
export const formatKm = (n: number) => `${km.format(n)} كم`;
export const formatNumber = (n: number) => km.format(n);
export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { dateStyle: "medium" }).format(new Date(iso));

const sar = new Intl.NumberFormat("ar-SA-u-nu-latn", { maximumFractionDigits: 0 });
/** Single money formatter for the whole app: 45,000 ر.س */
export const formatCurrency = (n: number | null | undefined) =>
  n === null || n === undefined || !Number.isFinite(n) ? "—" : `${sar.format(Math.round(n))} ر.س`;
