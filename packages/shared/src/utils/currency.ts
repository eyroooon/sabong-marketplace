export function formatPHP(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactPHP(amount: number): string {
  if (amount >= 1000000) {
    return `₱${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `₱${(amount / 1000).toFixed(0)}K`;
  }
  return formatPHP(amount);
}
