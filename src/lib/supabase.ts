import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * عميل قاعدة البيانات — يعتمد على العميل المُولَّد من تكامل Lovable Cloud
 * (يدعم تخزين الجلسة في المعاينة). تبقى الخدمات تتعامل مع أخطاء الاتصال
 * عبر DataProviderError دون بيانات وهمية.
 */
export const isSupabaseConfigured = true;

export function getSupabase(): SupabaseClient | null {
  return supabase as unknown as SupabaseClient;
}
