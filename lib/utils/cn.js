// lib/utils/cn.js
/**
 * Utility for merging class names with Tailwind conflict resolution.
 * Combines clsx for conditional classes and tailwind-merge for deduplication.
 *
 * @param  {...any} inputs - Class values (strings, objects, arrays, undefined)
 * @returns {string} Merged class string with conflicts resolved
 *
 * @example
 * // Conditional classes
 * cn("px-4 py-2", isActive && "bg-ember-500", className)
 *
 * @example
 * // Object syntax
 * cn("text-sm", { "font-bold": isBold }, ["flex", "items-center"])
 *
 * @example
 * // Tailwind conflict resolution (later wins)
 * cn("px-4 px-6") // => "px-6"
 * cn("bg-red-500 bg-blue-500") // => "bg-blue-500"
 */
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
