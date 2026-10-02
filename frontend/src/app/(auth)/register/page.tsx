"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, ArrowRight } from "lucide-react";
import { registerRequest } from "@/lib/auth-api";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const registerSchema = z
  .object({
    fullName: z.string().min(2, { message: "Họ tên phải có ít nhất 2 ký tự" }),
    email: z.string().email({ message: "Email không hợp lệ" }),
    password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const me = await registerRequest({
        name: data.fullName.trim(),
        email: data.email.trim(),
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      setUser(me);
      router.push("/");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Đăng ký thất bại";
      setError("root", { message });
    }
  };

  const fieldInputClass = (hasError: boolean) =>
    cn(
      "block w-full pl-10 pr-3 py-3 h-11 rounded-xl bg-bg-base text-text-heading placeholder:text-muted-foreground",
      hasError ? "border-red-500 focus-visible:ring-red-500" : "border-bg-border focus-visible:ring-brand-primary",
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base relative overflow-hidden py-12">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-primary/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-brand-accent/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none"></div>

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="bg-bg-surface/80 backdrop-blur-2xl border border-bg-border shadow-2xl rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-50"></div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-heading mb-2">Đăng Ký</h1>
            <p className="text-text-muted text-sm">Trở thành hội viên để săn vé nhanh nhất</p>
          </div>

          {errors.root && <p className="text-sm text-red-500 text-center">{errors.root.message}</p>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="register-fullName" className="block text-sm font-medium text-text-body mb-1.5">
                Họ và Tên
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <User className="h-5 w-5" />
                </div>
                <Input
                  id="register-fullName"
                  type="text"
                  aria-invalid={!!errors.fullName}
                  {...register("fullName")}
                  className={fieldInputClass(!!errors.fullName)}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>}
            </div>

            <div>
              <Label htmlFor="register-email" className="block text-sm font-medium text-text-body mb-1.5">
                Email
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Mail className="h-5 w-5" />
                </div>
                <Input
                  id="register-email"
                  type="email"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                  className={fieldInputClass(!!errors.email)}
                  placeholder="hello@example.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="register-password" className="block text-sm font-medium text-text-body mb-1.5">
                Mật khẩu
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Lock className="h-5 w-5" />
                </div>
                <Input
                  id="register-password"
                  type="password"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                  className={fieldInputClass(!!errors.password)}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <div>
              <Label htmlFor="register-confirm" className="block text-sm font-medium text-text-body mb-1.5">
                Xác nhận mật khẩu
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Lock className="h-5 w-5" />
                </div>
                <Input
                  id="register-confirm"
                  type="password"
                  aria-invalid={!!errors.confirmPassword}
                  {...register("confirmPassword")}
                  className={fieldInputClass(!!errors.confirmPassword)}
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl shadow-lg shadow-brand-primary/20 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-lg h-auto mt-6 border-0"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Tạo Tài Khoản <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-text-muted">
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-bold text-brand-primary hover:text-brand-primary-hover transition-colors">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
