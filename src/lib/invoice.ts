export type InvoiceStatus = "draft" | "pending" | "paid" | "overdue";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface Totals {
  subtotal: number;
  discount: number;
  taxable: number;
  tax: number;
  shipping: number;
  total: number;
}

export interface TotalsInput {
  items: LineItem[];
  tax_rate: number;
  discount_type: string;
  discount_value: number;
  shipping: number;
}

export function computeTotals(input: TotalsInput): Totals {
  const subtotal = input.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0,
  );
  const discountValue = Number(input.discount_value) || 0;
  const discount =
    input.discount_type === "percent" ? (subtotal * discountValue) / 100 : Math.min(discountValue, subtotal);
  const taxable = Math.max(subtotal - discount, 0);
  const tax = (taxable * (Number(input.tax_rate) || 0)) / 100;
  const shipping = Number(input.shipping) || 0;
  return {
    subtotal,
    discount,
    taxable,
    tax,
    shipping,
    total: taxable + tax + shipping,
  };
}

export const CURRENCIES = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "BDT", label: "BDT — Bangladeshi Taka" },
  { code: "INR", label: "INR — Indian Rupee" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "JPY", label: "JPY — Japanese Yen" },
  { code: "AED", label: "AED — UAE Dirham" },
];

export function formatMoney(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0);
  } catch {
    return `${currency} ${(amount || 0).toFixed(2)}`;
  }
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export const TEMPLATES = [
  { id: "modern", name: "Modern", hint: "Bold accent header" },
  { id: "classic", name: "Classic", hint: "Timeless serif layout" },
  { id: "minimal", name: "Minimal", hint: "Quiet and spacious" },
  { id: "bold", name: "Bold", hint: "High-contrast statement" },
] as const;

export const ACCENT_PRESETS = ["#4f46e5", "#2563eb", "#0ea5e9", "#059669", "#db2777", "#f97316", "#0f172a"];

export const STATUS_META: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-secondary text-secondary-foreground border-border" },
  pending: { label: "Pending", className: "bg-warning/15 text-warning-foreground border-warning/30" },
  paid: { label: "Paid", className: "bg-success/15 text-success border-success/30" },
  overdue: { label: "Overdue", className: "bg-destructive/12 text-destructive border-destructive/30" },
};

export function newLineItem(): LineItem {
  return {
    id: crypto.randomUUID(),
    description: "",
    quantity: 1,
    unit_price: 0,
  };
}

export function nextInvoiceNumber(existing: string[]): string {
  const year = new Date().getFullYear();
  const numbers = existing
    .map((value) => Number(value.split("-").pop()))
    .filter((value) => Number.isFinite(value)) as number[];
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
  return `INV-${year}-${String(next).padStart(4, "0")}`;
}
