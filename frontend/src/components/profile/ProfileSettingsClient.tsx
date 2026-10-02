"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Save } from "lucide-react";

export default function ProfileSettingsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER" | "">("");
  const [dob, setDob] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/user/profile", { credentials: "include" });
        if (!res.ok) throw new Error("Lỗi tải thông tin");
        const data = await res.json();
        
        setEmail(data.email || "");
        setName(data.name || "");
        setPhone(data.phone || "");
        setGender(data.gender || "");
        
        if (data.date_of_birth) {
          const d = new Date(data.date_of_birth);
          setDob(d.toISOString().split("T")[0]);
        }
      } catch {
        toast.error("Không thể tải thông tin cá nhân");
      } finally {
        setLoading(false);
      }
    }
    void loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Tên không được để trống");
      return;
    }

    setSaving(true);
    try {
      const payload: { name: string; phone?: string; gender?: string; date_of_birth?: string } = { name: name.trim() };
      if (phone.trim()) payload.phone = phone.trim();
      if (gender) payload.gender = gender;
      if (dob) payload.date_of_birth = new Date(dob).toISOString();

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Cập nhật thất bại");
      }
      toast.success("Cập nhật thông tin thành công");
    } catch (err: any) {
      toast.error(err.message || "Không thể cập nhật thông tin cá nhân");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-rose-600" />
          <span className="text-sm font-medium text-slate-500">Đang tải thông tin...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="h-16 w-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <User className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Thông tin cá nhân</h2>
          <p className="text-slate-500 text-sm mt-1">Cập nhật thông tin để chúng tôi phục vụ bạn tốt hơn</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-500">Email (Không thể thay đổi)</Label>
            <Input id="email" value={email} disabled className="bg-slate-50 dark:bg-slate-800/50" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Họ và Tên</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập họ và tên" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Nhập số điện thoại" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Giới tính</Label>
            <Select value={gender} onValueChange={(v: string) => setGender(v as "" | "MALE" | "FEMALE" | "OTHER")}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="Chọn giới tính" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Nam</SelectItem>
                <SelectItem value="FEMALE">Nữ</SelectItem>
                <SelectItem value="OTHER">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="dob">Ngày sinh</Label>
            <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="max-w-[280px]" />
          </div>
        </div>

        <div className="pt-6">
          <Button type="submit" disabled={saving} className="bg-rose-600 hover:bg-rose-700 text-white gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </div>
  );
}
