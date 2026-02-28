import {
  Wifi,
  Thermometer,
  Utensils,
  Car,
  Waves,
  Home,
  Wind,
  Tv,
  Bath,
  Coffee,
  Dumbbell,
  Tag,
  Sun,
  Snowflake,
  ParkingSquare,
  Flame,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  wifi: Wifi,
  thermometer: Thermometer,
  utensils: Utensils,
  car: Car,
  waves: Waves,
  home: Home,
  wind: Wind,
  tv: Tv,
  bath: Bath,
  coffee: Coffee,
  dumbbell: Dumbbell,
  sun: Sun,
  snowflake: Snowflake,
  "parking-square": ParkingSquare,
  flame: Flame,
};

export function AmenityChip({ icon, name }: { icon: string; name: string }) {
  const Icon = ICON_MAP[icon] ?? Tag;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-stone-500">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {name}
    </span>
  );
}
