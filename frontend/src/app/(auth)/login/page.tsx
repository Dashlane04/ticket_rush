"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight } from "lucide-react";

// Define the validation schema using Zod
const loginSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ" }),
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    // Mock login logic
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    if (data.email === "admin@ticketrush.com" && data.password === "admin123") {
      router.push("/admin");
    } else if (data.email === "user@example.com" && data.password === "user1234") {
      router.push("/");
    } else {
      setError("password", { message: "Email hoặc mật khẩu không đúng (Thử admin@ticketrush.com / admin123)" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-primary/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-accent/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none"></div>

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="bg-bg-surface/80 backdrop-blur-2xl border border-bg-border shadow-2xl rounded-3xl p-8 relative overflow-hidden">
          {/* Subtle top glow */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-50"></div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-heading mb-2">Đăng Nhập</h1>
            <p className="text-text-muted text-sm">
              Trải nghiệm mua vé tốc độ cao cùng TicketRush
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

            <div className="flex items-center justify-between text-sm mt-2">
              <label className="flex items-center text-text-muted cursor-pointer hover:text-text-body transition-colors">
                <input type="checkbox" className="mr-2 rounded border-bg-border text-brand-primary focus:ring-brand-primary bg-bg-base" />
                Ghi nhớ đăng nhập
              </label>
              <Link href="#" className="text-brand-primary font-medium hover:text-brand-primary-hover transition-colors">
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-brand-primary/20 text-white bg-brand-primary hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary font-bold text-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-4"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Đăng Nhập <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
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
