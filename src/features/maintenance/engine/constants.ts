export const DUE_SOON_KM = 1000;
export const DUE_SOON_DAYS = 30;

export type MaintenanceStatus = "OK" | "DUE_SOON" | "DUE" | "OVERDUE" | "NO_HISTORY" | "DISABLED";

export const STATUS_LABEL: Record<MaintenanceStatus, string> = {
  OK: "جيدة",
  DUE_SOON: "قريبة",
  DUE: "مستحقة",
  OVERDUE: "متأخرة",
  NO_HISTORY: "لم تُنفذ من قبل",
  DISABLED: "متوقفة",
};

export const STATUS_TONE: Record<MaintenanceStatus, "success" | "warning" | "danger" | "brand" | "neutral"> = {
  OK: "success",
  DUE_SOON: "warning",
  DUE: "brand",
  OVERDUE: "danger",
  NO_HISTORY: "neutral",
  DISABLED: "neutral",
};

/** Lower = higher priority. */
export const STATUS_PRIORITY: Record<MaintenanceStatus, number> = {
  OVERDUE: 0,
  DUE: 1,
  DUE_SOON: 2,
  NO_HISTORY: 3,
  OK: 4,
  DISABLED: 5,
};
