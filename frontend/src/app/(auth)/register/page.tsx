"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, ArrowRight } from "lucide-react";
import { registerRequest } from "@/lib/auth-api";
import { useAuthStore } from "@/stores/auth-store";

// Define the validation schema using Zod
const registerSchema = z.object({
  fullName: z.string().min(2, { message: "Họ tên phải có ít nhất 2 ký tự" }),
  email: z.string().email({ message: "Email không hợp lệ" }),
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base relative overflow-hidden py-12">
      {/* Background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-primary/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-brand-accent/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none"></div>

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="bg-bg-surface/80 backdrop-blur-2xl border border-bg-border shadow-2xl rounded-3xl p-8 relative overflow-hidden">
          {/* Subtle top glow */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-50"></div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-heading mb-2">Đăng Ký</h1>
            <p className="text-text-muted text-sm">
              Trở thành hội viên để săn vé nhanh nhất
            </p>
          </div>

          {errors.root && (
            <p className="text-sm text-red-500 text-center">{errors.root.message}</p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-body mb-1.5">Họ và Tên</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  {...register("fullName")}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    errors.fullName ? "border-red-500 focus:ring-red-500" : "border-bg-border focus:ring-brand-primary"
                  } rounded-xl bg-bg-base text-text-heading placeholder-text-muted focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-body mb-1.5">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  {...register("email")}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    errors.email ? "border-red-500 focus:ring-red-500" : "border-bg-border focus:ring-brand-primary"
                  } rounded-xl bg-bg-base text-text-heading placeholder-text-muted focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                  placeholder="hello@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-body mb-1.5">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  {...register("password")}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    errors.password ? "border-red-500 focus:ring-red-500" : "border-bg-border focus:ring-brand-primary"
                  } rounded-xl bg-bg-base text-text-heading placeholder-text-muted focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-body mb-1.5">Xác nhận mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  {...register("confirmPassword")}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    errors.confirmPassword ? "border-red-500 focus:ring-red-500" : "border-bg-border focus:ring-brand-primary"
                  } rounded-xl bg-bg-base text-text-heading placeholder-text-muted focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-brand-primary/20 text-white bg-brand-primary hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary font-bold text-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-6"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Tạo Tài Khoản <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
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
