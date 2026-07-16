import cron from "node-cron";
import { WeatherService } from "@gql-prisma-api/services/weather.service.js";
import { logger } from "@gql-prisma-api/utils/logger.js";

const weather = new WeatherService();

let lastLog = "";

export function startWeatherCron(): void {
  cron.schedule("* * * * *", async () => {
    const data = await weather.fetchCurrent();
    if (!data) return;

    const line = `Weather | ${data.temperature}°C | ${data.humidity}% | ${data.weatherDescription}`;
    if (line !== lastLog) {
      logger.info(line, {
        temp: data.temperature.toFixed(1),
        humidity: data.humidity,
        code: data.weatherCode,
      });
      lastLog = line;
    }
  });

  logger.info("Weather cron started (every 1 minute)");
}
