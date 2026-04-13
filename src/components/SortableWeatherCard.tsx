"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import WeatherCard from "@/components/WeatherCard";
import type { SavedCity, UserPreferences } from "@/types";

interface Props {
  city: SavedCity;
  onRemove: () => void;
  ownedItems: string[];
  preferences: UserPreferences;
}

export default function SortableWeatherCard({
  city,
  onRemove,
  ownedItems,
  preferences,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: city.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.85 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <WeatherCard
        city={city}
        onRemove={onRemove}
        ownedItems={ownedItems}
        preferences={preferences}
      />
    </div>
  );
}
