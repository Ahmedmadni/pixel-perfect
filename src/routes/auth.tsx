import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Car, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول · كمتر" },
      { name: "description", content: "سجّل الدخول أو أنشئ حساباً جديداً لإدارة سياراتك." },
      { property: "og:title", content: "تسجيل الدخول · كمتر" },
      { property: "og:description", content: "سجّل الدخول أو أنشئ حساباً جديداً لإدارة سياراتك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        if (data.session) {
          navigate({ to: "/" });
        } else {
          setMessage({
            kind: "info",
            text: "تم إنشاء حسابك. تحقق من بريدك الإلكتروني لتأكيد الحساب ثم سجّل الدخول.",
          });
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setMessage({
        kind: "error",
        text:
          msg.includes("Invalid login credentials")
            ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
            : msg.includes("already registered")
              ? "هذا البريد مسجل مسبقاً. جرّب تسجيل الدخول."
              : msg.includes("weak") || msg.includes("easy to guess")
                ? "كلمة المرور ضعيفة أو شائعة. اختر كلمة أقوى تجمع أحرفاً وأرقاماً ورموزاً."
                : msg.includes("not confirmed") || msg.includes("Email not confirmed")
                  ? "لم يتم تأكيد بريدك بعد. افتح رابط التأكيد في بريدك ثم سجّل الدخول."
                  : "تعذّر إتمام العملية. حاول مرة أخرى.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setMessage(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setMessage({ kind: "error", text: "تعذّر تسجيل الدخول عبر Google. حاول مرة أخرى." });
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-[420px] w-[420px] rounded-full bg-brand/15 blur-3xl" />
        <div className="absolute top-1/3 -left-32 h-[380px] w-[380px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-panel/85 p-8 ring-1 ring-border backdrop-blur-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="grid size-12 place-items-center rounded-xl bg-brand-deep text-primary-foreground">
            <Car className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">كمتر</h1>
            <p className="mt-1 text-sm text-ink-soft">
              {mode === "signin" ? "سجّل الدخول لمتابعة سياراتك" : "أنشئ حساباً جديداً"}
            </p>
          </div>
        </div>

        <form onSubmit={handleEmail} className="space-y-4">
          {mode === "signup" ? (
            <div className="space-y-1.5">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: محمد أحمد"
                required
              />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              dir="ltr"
              className="text-left"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              dir="ltr"
              className="text-left"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          {message ? (
            <p
              className={`rounded-lg px-3 py-2 text-sm ${
                message.kind === "error"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-brand/10 text-brand-deep"
              }`}
            >
              {message.text}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "signin" ? "تسجيل الدخول" : "إنشاء الحساب"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-ink-soft">
          <span className="h-px flex-1 bg-border" />
          أو
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
          المتابعة عبر Google
        </Button>

        <p className="mt-5 text-center text-sm text-ink-soft">
          {mode === "signin" ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}{" "}
          <button
            type="button"
            className="font-medium text-brand-deep underline-offset-4 hover:underline"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setMessage(null);
            }}
          >
            {mode === "signin" ? "إنشاء حساب" : "تسجيل الدخول"}
          </button>
        </p>
      </div>
    </div>
  );
}
