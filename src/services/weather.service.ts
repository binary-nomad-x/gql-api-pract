import { request } from "node:https";
import { logger } from "@gql-prisma-api/utils/logger.js";

const BASE_URL = "https://api.open-meteo.com/v1/forecast";
const LAT = 31.5204;
const LON = 74.3587;

const WMO_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

function httpGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    request(url, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf-8");
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Weather API returned ${res.statusCode}: ${body}`));
        } else {
          resolve(body);
        }
      });
    })
      .on("error", reject)
      .end();
  });
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  weatherCode: number;
  weatherDescription: string;
  hourlyTemps: number[];
}

export class WeatherService {
  async fetchCurrent(): Promise<WeatherData | null> {
    try {
      const url = `${BASE_URL}?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,weather_code&hourly=temperature_2m&forecast_days=3`;
      const body = await httpGet(url);
      const data = JSON.parse(body) as Record<string, any>;

      const current = data.current as Record<string, any> | undefined;
      if (!current) {
        logger.warning("Weather API returned no current data");
        return null;
      }

      const weatherCode = current.weather_code as number;
      const hourly = data.hourly as Record<string, any> | undefined;

      return {
        temperature: current.temperature_2m as number,
        humidity: current.relative_humidity_2m as number,
        weatherCode,
        weatherDescription: WMO_CODES[weatherCode] ?? `Unknown (${weatherCode})`,
        hourlyTemps: (hourly?.temperature_2m as number[]) ?? [],
      };

    } catch (err) {
      logger.error("Weather fetch failed", { error: String(err) });
      return null;
    }
  }
}
