import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useTheme } from "../components/theme-provider";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * @param {string} name
 * @returns {string} The img src name with the theme in the path
 */
export function useThemedImgSrc(name) {
  const { theme } = useTheme();
  return `/${theme}/${name}`;
}
