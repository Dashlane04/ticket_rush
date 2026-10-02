"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function GoBackButton() {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => router.back()}
      className="inline-flex items-center justify-center gap-2 rounded-xl border-bg-border bg-bg-surface/80 px-6 py-3 h-auto text-text-body font-medium hover:border-brand-primary/40 transition-colors w-full sm:w-auto shadow-none"
    >
      <ArrowLeft className="h-4 w-4" />
      Quay lại
    </Button>
  );
}
