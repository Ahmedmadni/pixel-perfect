const km = new Intl.NumberFormat("en-US");
export const formatKm = (n: number) => `${km.format(n)} كم`;
export const formatNumber = (n: number) => km.format(n);
export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { dateStyle: "medium" }).format(new Date(iso));
