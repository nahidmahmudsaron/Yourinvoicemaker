import { computeTotals, formatDate, formatMoney, type LineItem } from "@/lib/invoice";
import { cn } from "@/lib/utils";

export interface PreviewBusiness {
  business_name?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  logo_url?: string | null;
  tax_number?: string | null;
}

export interface PreviewCustomer {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
}

export interface PreviewData {
  business: PreviewBusiness;
  customer: PreviewCustomer;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  currency: string;
  status: string;
  tax_rate: number;
  discount_type: string;
  discount_value: number;
  shipping: number;
  notes?: string | null;
  terms?: string | null;
  template: string;
  accent_color: string;
  items: LineItem[];
}

export function InvoicePreview({ data, className }: { data: PreviewData; className?: string }) {
  const totals = computeTotals(data);
  const accent = data.accent_color || "#4f46e5";
  const template = data.template || "modern";
  const serif = template === "classic";

  return (
    <div
      className={cn(
        "print-area w-full overflow-hidden rounded-xl border border-border bg-white text-[#111827] shadow-card",
        serif && "font-serif",
        className,
      )}
      style={{ ["--accent" as string]: accent }}
    >
      {template === "modern" && (
        <div className="px-8 py-7 text-white" style={{ background: `linear-gradient(100deg, ${accent}, ${accent}cc)` }}>
          <Header data={data} inverted />
        </div>
      )}
      {template === "bold" && (
        <div className="px-8 py-7" style={{ backgroundColor: "#0f172a", color: "#fff" }}>
          <Header data={data} inverted accentText={accent} />
        </div>
      )}
      {(template === "classic" || template === "minimal") && (
        <div
          className="px-8 py-7"
          style={template === "classic" ? { borderBottom: `3px double ${accent}` } : { borderBottom: "1px solid #e5e7eb" }}
        >
          <Header data={data} accentText={accent} />
        </div>
      )}

      <div className="grid gap-6 px-8 py-6 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: accent }}>
            From
          </p>
          <p className="mt-1.5 text-sm font-semibold">{data.business.business_name || "Your business"}</p>
          <Lines
            values={[data.business.address, data.business.email, data.business.phone, data.business.website,
              data.business.tax_number ? `Tax ID: ${data.business.tax_number}` : ""]}
          />
        </div>
        <div className="sm:text-right">
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: accent }}>
            Bill to
          </p>
          <p className="mt-1.5 text-sm font-semibold">{data.customer.name || "Customer name"}</p>
          <Lines
            values={[data.customer.company, data.customer.address, data.customer.email, data.customer.phone]}
          />
        </div>
      </div>

      <div className="px-8">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr
              className="text-left text-[11px] font-bold uppercase tracking-wider"
              style={
                template === "minimal"
                  ? { color: "#6b7280", borderBottom: "1px solid #e5e7eb" }
                  : { backgroundColor: `${accent}14`, color: accent }
              }
            >
              <th className="rounded-l-md px-3 py-2.5">Description</th>
              <th className="px-3 py-2.5 text-right">Qty</th>
              <th className="px-3 py-2.5 text-right">Price</th>
              <th className="rounded-r-md px-3 py-2.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(data.items.length ? data.items : [{ id: "x", description: "", quantity: 0, unit_price: 0 }]).map(
              (item) => (
                <tr key={item.id} className="border-b border-[#f1f2f6]">
                  <td className="px-3 py-3 align-top">{item.description || <span className="text-[#9ca3af]">Item description</span>}</td>
                  <td className="px-3 py-3 text-right align-top tabular-nums">{Number(item.quantity) || 0}</td>
                  <td className="px-3 py-3 text-right align-top tabular-nums">
                    {formatMoney(Number(item.unit_price) || 0, data.currency)}
                  </td>
                  <td className="px-3 py-3 text-right align-top font-medium tabular-nums">
                    {formatMoney((Number(item.quantity) || 0) * (Number(item.unit_price) || 0), data.currency)}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end px-8 py-5">
        <dl className="w-full max-w-xs space-y-1.5 text-sm">
          <Row label="Subtotal" value={formatMoney(totals.subtotal, data.currency)} />
          {totals.discount > 0 && (
            <Row
              label={`Discount${data.discount_type === "percent" ? ` (${data.discount_value}%)` : ""}`}
              value={`-${formatMoney(totals.discount, data.currency)}`}
            />
          )}
          {totals.tax > 0 && <Row label={`Tax (${data.tax_rate}%)`} value={formatMoney(totals.tax, data.currency)} />}
          {totals.shipping > 0 && <Row label="Shipping" value={formatMoney(totals.shipping, data.currency)} />}
          <div
            className="mt-2 flex items-center justify-between rounded-lg px-3 py-2.5 text-base font-bold"
            style={{ backgroundColor: `${accent}12`, color: accent }}
          >
            <span>Total</span>
            <span className="tabular-nums">{formatMoney(totals.total, data.currency)}</span>
          </div>
        </dl>
      </div>

      {(data.notes || data.terms) && (
        <div className="grid gap-5 border-t border-[#f1f2f6] px-8 py-6 sm:grid-cols-2">
          {data.notes ? (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#6b7280]">Notes</p>
              <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-[#4b5563]">{data.notes}</p>
            </div>
          ) : (
            <div />
          )}
          {data.terms && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#6b7280]">Terms</p>
              <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-[#4b5563]">{data.terms}</p>
            </div>
          )}
        </div>
      )}

      <div className="px-8 pb-6 text-center text-[11px] text-[#9ca3af]">
        Thank you for your business — generated with InvoicePro
      </div>
    </div>
  );
}

function Header({
  data,
  inverted,
  accentText,
}: {
  data: PreviewData;
  inverted?: boolean;
  accentText?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        {data.business.logo_url ? (
          <img
            src={data.business.logo_url}
            alt={`${data.business.business_name || "Business"} logo`}
            className="size-11 rounded-lg object-cover"
          />
        ) : (
          <div
            className="grid size-11 place-items-center rounded-lg text-base font-bold"
            style={
              inverted
                ? { backgroundColor: "rgba(255,255,255,0.18)", color: "#fff" }
                : { backgroundColor: `${accentText}18`, color: accentText }
            }
          >
            {(data.business.business_name || "IP").slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-lg font-bold leading-tight">{data.business.business_name || "Your business"}</p>
          <p className={cn("text-xs", inverted ? "opacity-80" : "text-[#6b7280]")}>
            {data.business.email || "hello@yourbusiness.com"}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p
          className="text-2xl font-black uppercase tracking-tight"
          style={inverted && accentText ? { color: accentText } : undefined}
        >
          Invoice
        </p>
        <p className={cn("text-sm font-semibold", inverted ? "opacity-90" : "text-[#374151]")}>
          {data.invoice_number || "INV-0001"}
        </p>
        <p className={cn("mt-1 text-xs", inverted ? "opacity-80" : "text-[#6b7280]")}>
          Issued {formatDate(data.issue_date)}
        </p>
        <p className={cn("text-xs", inverted ? "opacity-80" : "text-[#6b7280]")}>Due {formatDate(data.due_date)}</p>
      </div>
    </div>
  );
}

function Lines({ values }: { values: (string | null | undefined)[] }) {
  return (
    <div className="mt-1 space-y-0.5 text-xs leading-relaxed text-[#6b7280]">
      {values
        .filter((value) => value && String(value).trim().length > 0)
        .map((value, index) => (
          <p key={index} className="whitespace-pre-line">
            {value}
          </p>
        ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 text-[#4b5563]">
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
