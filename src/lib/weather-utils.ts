// WMO Weather interpretation codes → labels and emoji
const weatherDescriptions: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear sky", icon: "☀️" },
  1: { label: "Mainly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Foggy", icon: "🌫️" },
  48: { label: "Icy fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Heavy drizzle", icon: "🌧️" },
  61: { label: "Light rain", icon: "🌧️" },
  63: { label: "Rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  66: { label: "Freezing rain", icon: "🌨️" },
  67: { label: "Heavy freezing rain", icon: "🌨️" },
  71: { label: "Light snow", icon: "🌨️" },
  73: { label: "Snow", icon: "❄️" },
  75: { label: "Heavy snow", icon: "❄️" },
  77: { label: "Snow grains", icon: "❄️" },
  80: { label: "Light showers", icon: "🌦️" },
  81: { label: "Showers", icon: "🌧️" },
  82: { label: "Heavy showers", icon: "🌧️" },
  85: { label: "Light snow showers", icon: "🌨️" },
  86: { label: "Heavy snow showers", icon: "❄️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm with hail", icon: "⛈️" },
  99: { label: "Thunderstorm with heavy hail", icon: "⛈️" },
};

export function getWeatherDescription(code: number) {
  return weatherDescriptions[code] ?? { label: "Unknown", icon: "❓" };
}

export function getClothingAdvice(
  temp: number,
  weatherCode: number
): string {
  const isRainy = [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode);
  const isSnowy = [71, 73, 75, 77, 85, 86].includes(weatherCode);

  if (temp >= 85) return "Shorts and a tank top — stay hydrated!";
  if (temp >= 70) return isRainy ? "Light layers with a rain jacket" : "T-shirt and shorts weather";
  if (temp >= 55) return isRainy ? "Jacket and an umbrella" : "Long sleeves or a light jacket";
  if (temp >= 40) return isSnowy ? "Heavy coat, boots, and warm layers" : "Warm jacket and pants";
  if (temp >= 25) return "Bundle up — heavy coat, hat, and gloves";
  return "Stay inside if you can — extreme cold gear required";
}
