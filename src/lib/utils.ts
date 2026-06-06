import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBRL(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatNumber(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString("pt-BR");
}
