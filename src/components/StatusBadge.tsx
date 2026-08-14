import { STATUS_META, type InvoiceStatus } from "@/lib/invoice";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = STATUS_META[(status as InvoiceStatus) ?? "draft"] ?? STATUS_META.draft;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
