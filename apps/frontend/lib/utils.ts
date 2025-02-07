import { type ClassValue, clsx } from "clsx";
import { use } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getURL(path: string) {
  return `${window.location.origin}${path}`;
}

export function getApiURL(path: string) {
  return `${process.env.NEXT_PUBLIC_BE}${path}`;
}


export function createNeverResolvingPromise<T>() {
  return new Promise<T>(() => { })
};

export function suspend(): never {
  use(createNeverResolvingPromise());
  throw new Error("This error is not expected. There is a bug in suspend().");
}