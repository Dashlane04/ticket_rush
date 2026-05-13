"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight } from "lucide-react";
import { loginRequest, userHasAdminRole } from "@/lib/auth-api";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ" }),
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function isSafeInternalRedirect(path: string | null): path is string {
  if (!path) return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("://")) return false;
  return true;
}

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const me = await loginRequest(data.email, data.password);
      setUser(me);
      const redirect =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("redirect")
          : null;
      if (isSafeInternalRedirect(redirect)) {
        router.push(redirect);
        return;
      }
      if (userHasAdminRole(me)) {
        router.push("/admin/events");
      } else {
        router.push("/");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Đăng nhập thất bại";
      setError("password", { message });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-primary/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-accent/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none"></div>

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="bg-bg-surface/80 backdrop-blur-2xl border border-bg-border shadow-2xl rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-50"></div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-heading mb-2">Đăng Nhập</h1>
            <p className="text-text-muted text-sm">Trải nghiệm mua vé tốc độ cao cùng TicketRush</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="login-email" className="block text-sm font-medium text-text-body mb-1.5">
                Email
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Mail className="h-5 w-5" />
                </div>
                <Input
                  id="login-email"
                  type="email"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                  className={cn(
                    "block w-full pl-10 pr-3 py-3 h-11 rounded-xl bg-bg-base text-text-heading placeholder:text-muted-foreground",
                    errors.email
                      ? "border-red-500 focus-visible:ring-red-500"
                      : "border-bg-border focus-visible:ring-brand-primary",
                  )}
                  placeholder="hello@example.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="login-password" className="block text-sm font-medium text-text-body mb-1.5">
                Mật khẩu
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Lock className="h-5 w-5" />
                </div>
                <Input
                  id="login-password"
                  type="password"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                  className={cn(
                    "block w-full pl-10 pr-3 py-3 h-11 rounded-xl bg-bg-base text-text-heading placeholder:text-muted-foreground",
                    errors.password
                      ? "border-red-500 focus-visible:ring-red-500"
                      : "border-bg-border focus-visible:ring-brand-primary",
                  )}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm mt-2">
              <Label htmlFor="remember" className="flex items-center gap-2 text-text-muted cursor-pointer hover:text-text-body transition-colors font-normal">
                <Checkbox id="remember" className="border-bg-border" />
                Ghi nhớ đăng nhập
              </Label>
              <Link
                href="/forgot-password"
                className="text-brand-primary font-medium hover:text-brand-primary-hover transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl shadow-lg shadow-brand-primary/20 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-lg h-auto mt-4 border-0"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Đăng Nhập <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-text-muted">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="font-bold text-brand-primary hover:text-brand-primary-hover transition-colors">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
