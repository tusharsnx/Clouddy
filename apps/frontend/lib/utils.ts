import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getURL(path: string) {
  return `${window.location.origin}${path}`;
}

export function getApiURL(path: string) {
  const host = process.env.NEXT_PUBLIC_API_HOST;
  const port = process.env.NEXT_PUBLIC_API_PORT;
  return `${host}${port ? `:${port}` : ""}${path}`;
}
