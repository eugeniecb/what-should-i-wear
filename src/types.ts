export interface City {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string; // state/region
}

export interface SavedCity extends City {
  id: string;
}

export interface WeatherData {
  city: City;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  daily: {
    tempMax: number;
    tempMin: number;
  };
}
