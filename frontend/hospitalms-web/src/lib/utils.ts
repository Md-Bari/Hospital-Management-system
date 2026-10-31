import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "BDT"): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 2,
  }).format(amount).replace("BDT", "৳");
}

