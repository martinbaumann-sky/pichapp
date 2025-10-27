export function formatCurrencyCLP(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDecimal(value: number, options: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1, ...options }).format(value);
}

export function formatPercentage(value: number, options: Intl.NumberFormatOptions = {}): string {
  return `${formatDecimal(value * 100, { maximumFractionDigits: 1, ...options })}%`;
}
