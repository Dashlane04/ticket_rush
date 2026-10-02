import Link from "next/link";
import { AdminSeatTemplatesTable } from "@/components/concur/AdminSeatTemplatesTable";
import { SeatBlueprintEditor } from "@/components/concur/SeatBlueprintEditor";
import { Button } from "@/components/ui/button";

export default async function AdminSeatTemplatesPage(props: {
  searchParams?: Promise<{ edit?: string; new?: string }>;
}) {
  const searchParams = await props.searchParams;
  const editTemplateId = searchParams?.edit;
  const createRequested = searchParams?.new === "1";
  const hubListToolbar = !editTemplateId?.trim() && !createRequested;

  return (
    <div className="cam-seat-templates-hub w-full space-y-8 text-[var(--text-main)]">
      {hubListToolbar ? (
        <div className="flex justify-end">
          <Button type="button" asChild className="shrink-0 border-0 shadow-none">
            <Link href="/admin/seat-templates?new=1">Tạo blueprint mới</Link>
          </Button>
        </div>
      ) : null}

      <SeatBlueprintEditor
        hubMode
        createRequested={createRequested}
        editTemplateId={editTemplateId}
      />
      <AdminSeatTemplatesTable
        variant="page"
        appearance="concur"
        createNewHref="/admin/seat-templates?new=1"
      />
    </div>
  );
}
