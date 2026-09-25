import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";

export type DataErrorCode =
  | "DATA_PROVIDER_NOT_CONNECTED"
  | "NOT_AUTHENTICATED"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "UNKNOWN";

export class DataProviderError extends Error {
  code: DataErrorCode;
  constructor(code: DataErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = "DataProviderError";
  }
}

export function isNotConnected(error: unknown): boolean {
  return error instanceof DataProviderError && error.code === "DATA_PROVIDER_NOT_CONNECTED";
}

export function requireClient(): SupabaseClient {
  const client = getSupabase();
  if (!client) throw new DataProviderError("DATA_PROVIDER_NOT_CONNECTED");
  return client;
}

export async function requireUserId(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new DataProviderError("NOT_AUTHENTICATED");
  return data.user.id;
}

export function toDataError(error: { message: string; code?: string } | null): DataProviderError {
  if (error?.code === "PGRST116") return new DataProviderError("NOT_FOUND", error.message);
  return new DataProviderError("UNKNOWN", error?.message);
}

export function errorMessage(error: unknown): string {
  if (error instanceof DataProviderError) {
    switch (error.code) {
      case "DATA_PROVIDER_NOT_CONNECTED":
        return "قاعدة البيانات غير متصلة حاليًا.";
      case "NOT_AUTHENTICATED":
        return "يجب تسجيل الدخول أولاً.";
      case "NOT_FOUND":
        return "العنصر المطلوب غير موجود.";
      case "VALIDATION_ERROR":
        return error.message;
      default:
        return "حدث خطأ غير متوقع. حاول مرة أخرى.";
    }
  }
  return "حدث خطأ غير متوقع. حاول مرة أخرى.";
}
