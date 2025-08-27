import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
// Simple utility functions for class name management

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
