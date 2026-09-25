import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, updateProfile } from "@/features/settings/services/profile.service";
import { errorMessage } from "@/lib/data-provider";
import { CardsSkeleton, ErrorState } from "@/components/common/states";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات · كمتر" },
      { name: "description", content: "بيانات الحساب واللغة وتفضيلات التنبيهات." },
      { property: "og:title", content: "الإعدادات · كمتر" },
      { property: "og:description", content: "بيانات الحساب واللغة وتفضيلات التنبيهات." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: getProfile });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (profileQuery.data) {
      setFullName(profileQuery.data.full_name ?? "");
      setPhone(profileQuery.data.phone ?? "");
    }
  }, [profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => updateProfile({ full_name: fullName.trim() || null, phone: phone.trim() || null }),
    onSuccess: () => {
      toast.success("تم حفظ الملف الشخصي");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <AppShell title="الإعدادات" subtitle="حسابي">
      <section className="rounded-2xl bg-panel p-6 ring-1 ring-border">
        <h2 className="text-base font-semibold">الملف الشخصي</h2>

        {profileQuery.isPending ? (
          <CardsSkeleton count={1} />
        ) : profileQuery.isError ? (
          <ErrorState error={profileQuery.error} onRetry={() => profileQuery.refetch()} />
        ) : (
          <form
            className="mt-5 grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="مثال: محمد أحمد" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input id="phone" dir="ltr" className="text-left" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xxxxxxxx" />
            </div>
            <div className="space-y-1.5">
              <Label>اللغة</Label>
              <Input value="العربية" disabled />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                حفظ التغييرات
              </Button>
            </div>
          </form>
        )}
      </section>

      <section className="mt-4 rounded-2xl bg-panel p-6 ring-1 ring-border">
        <h2 className="text-base font-semibold">الحساب</h2>
        <p className="mt-1 text-sm text-ink-soft">تسجيل الخروج من هذا الجهاز.</p>
        <Button variant="outline" className="mt-4 text-destructive" onClick={handleSignOut}>
          <LogOut className="size-4" />
          تسجيل الخروج
        </Button>
      </section>

      <section className="mt-4 rounded-2xl border border-dashed border-border p-6">
        <h2 className="text-sm font-medium text-ink-soft">التنبيهات</h2>
        <p className="mt-2 text-xs text-ink-soft/70">إعدادات تذكيرات الصيانة ستُضاف في مرحلة لاحقة.</p>
      </section>
    </AppShell>
  );
}
