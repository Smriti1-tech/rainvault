import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateWater(areaSqFt: number, rainfallMm: number): number {
  // Formula: Area (sq ft) * Rainfall (mm) * 0.0929 (sq m conversion) * Runoff (0.9)
  // Wait, the prompt says "Area x Rainfall x 0.0929 x Runoff Coefficient".
  // Usually, if area is in sq ft, and rainfall in mm:
  // 1 sq ft = 0.092903 sq meters.
  // collected (liters) = area (sq m) * rainfall (mm)
  // because 1mm over 1sqm is 1 liter.
  const runoffCoeff = 0.9; 
  const areaSqM = areaSqFt * 0.092903;
  return areaSqM * rainfallMm * runoffCoeff;
}
