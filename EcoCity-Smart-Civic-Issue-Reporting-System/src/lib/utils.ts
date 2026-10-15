import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { 
  Calendar, Waves, TreePine, Shirt, Utensils, Droplet, PawPrint, Recycle, Megaphone, Trash2, Leaf
} from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getEventIcon(category: string) {
  const lowercaseCat = category.toLowerCase();
  
  if (lowercaseCat.includes("beach") || lowercaseCat.includes("water")) return Waves;
  if (lowercaseCat.includes("tree") || lowercaseCat.includes("plant") || lowercaseCat.includes("green")) return TreePine;
  if (lowercaseCat.includes("garbage") || lowercaseCat.includes("clean") || lowercaseCat.includes("waste")) return Trash2;
  if (lowercaseCat.includes("cloth") || lowercaseCat.includes("donation")) return Shirt;
  if (lowercaseCat.includes("food")) return Utensils;
  if (lowercaseCat.includes("blood")) return Droplet;
  if (lowercaseCat.includes("animal") || lowercaseCat.includes("pet")) return PawPrint;
  if (lowercaseCat.includes("recycle")) return Recycle;
  if (lowercaseCat.includes("awareness") || lowercaseCat.includes("campaign")) return Megaphone;
  if (lowercaseCat.includes("sustain") || lowercaseCat.includes("eco")) return Leaf;

  return Calendar;
}

export function getCategoryStyle(category: string) {
  const lowercaseCat = category.toLowerCase();
  
  if (lowercaseCat.includes("beach")) return "bg-sky-50 text-sky-600";
  if (lowercaseCat.includes("water")) return "bg-blue-50 text-blue-600";
  if (lowercaseCat.includes("tree") || lowercaseCat.includes("plant")) return "bg-sage/10 text-sage";
  if (lowercaseCat.includes("garbage") || lowercaseCat.includes("clean") || lowercaseCat.includes("waste")) return "bg-teal/10 text-teal";
  if (lowercaseCat.includes("cloth")) return "bg-orange-50 text-orange-600";
  if (lowercaseCat.includes("food")) return "bg-amber-50 text-amber-600";
  if (lowercaseCat.includes("blood")) return "bg-rose-50 text-rose-600";
  if (lowercaseCat.includes("animal") || lowercaseCat.includes("pet")) return "bg-yellow-50 text-yellow-600";
  if (lowercaseCat.includes("recycle")) return "bg-emerald-50 text-emerald-600";
  if (lowercaseCat.includes("sustain") || lowercaseCat.includes("eco")) return "bg-sage/10 text-sage";

  return "bg-charcoal/5 text-charcoal";
}
