import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const formClasses = {
  input: "w-full px-3 py-2 bg-earth-800 border border-earth-700 text-sand-100 rounded-none focus:outline-none focus:ring-1 focus:ring-sand-400",
  label: "block text-sm font-medium text-sand-300 mb-2",
  error: "mt-1 text-sm text-red-500",
  iconWrapper: "absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-sand-400",
};