"use client";

import { useState, useRef } from "react";
import { City } from "@/types";

interface CitySearchProps {
  onAdd: (city: City) => void;
}

export default function CitySearch({ onAdd }: CitySearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  function handleChange(value: string) {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setShowDropdown(true);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }

  function handleSelect(city: City) {
    onAdd(city);
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  }

  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        placeholder="Search for a city..."
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-800"
      />
      {isSearching && (
        <div className="absolute right-3 top-3.5 text-sm text-gray-400">
          Searching...
        </div>
      )}
      {showDropdown && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
          {results.map((city, i) => (
            <li key={`${city.latitude}-${city.longitude}-${i}`}>
              <button
                type="button"
                onClick={() => handleSelect(city)}
                className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 first:rounded-t-xl last:rounded-b-xl"
              >
                <span className="font-medium">{city.name}</span>
                <span className="ml-1 text-gray-500 dark:text-gray-400">
                  {city.admin1 ? `${city.admin1}, ` : ""}
                  {city.country}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {showDropdown && results.length === 0 && !isSearching && query.length >= 2 && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-lg dark:border-gray-600 dark:bg-gray-800">
          No cities found
        </div>
      )}
    </div>
  );
}
