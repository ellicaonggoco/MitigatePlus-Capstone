const express = require("express");
const axios = require("axios");

const router = express.Router();

const MANILA = { lat: 14.5995, lng: 120.9842 };

const weatherTips = {
  thunderstorm:
    "Expect lightning and sudden heavy rain. Stay indoors, avoid floodwater, and charge phones and power banks.",
  heavy_rain:
    "Flooding is possible. Clear nearby drains only if safe, avoid low roads, and prepare important documents in waterproof storage.",
  rain:
    "Bring rain protection, watch for slippery roads, and monitor drainage-prone areas.",
  heat:
    "Heat stress is possible. Drink water often, avoid long sun exposure, and check older adults and children.",
  wind:
    "Secure loose outdoor items and avoid standing near trees, posts, or weak structures.",
  normal:
    "Conditions are manageable. Keep monitoring official advisories and keep your go bag updated.",
};

const classifyWeather = (current, daily) => {
  const code = Number(current.weather_code);
  const rain = Number(current.rain || current.precipitation || 0);
  const wind = Number(current.wind_speed_10m || 0);
  const temp = Number(current.temperature_2m || 0);
  const maxRain = Math.max(...(daily.precipitation_sum || [0]).map(Number));

  if ([95, 96, 99].includes(code)) return "thunderstorm";
  if (rain >= 10 || maxRain >= 30 || [80, 81, 82].includes(code)) return "heavy_rain";
  if (rain > 0 || [51, 53, 55, 61, 63, 65].includes(code)) return "rain";
  if (temp >= 35) return "heat";
  if (wind >= 39) return "wind";
  return "normal";
};

router.get("/", async (req, res) => {
  try {
    const lat = Number(req.query.lat) || MANILA.lat;
    const lng = Number(req.query.lng) || MANILA.lng;
    const url = "https://api.open-meteo.com/v1/forecast";
    const response = await axios.get(url, {
      params: {
        latitude: lat,
        longitude: lng,
        current: "temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m",
        daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
        timezone: "Asia/Manila",
        forecast_days: 3,
      },
    });

    const current = response.data.current || {};
    const daily = response.data.daily || {};
    const condition = classifyWeather(current, daily);
    const probability = daily.precipitation_probability_max?.[0] ?? 0;

    res.json({
      success: true,
      data: {
        location: "Manila",
        temperature: Math.round(Number(current.temperature_2m || 0)),
        humidity: current.relative_humidity_2m ?? null,
        rainMm: current.rain ?? current.precipitation ?? 0,
        windKph: Math.round(Number(current.wind_speed_10m || 0)),
        condition,
        forecast: {
          rainProbability: probability,
          maxTemp: Math.round(Number(daily.temperature_2m_max?.[0] || current.temperature_2m || 0)),
          minTemp: Math.round(Number(daily.temperature_2m_min?.[0] || current.temperature_2m || 0)),
          expectedRainMm: daily.precipitation_sum?.[0] ?? 0,
          maxWindKph: Math.round(Number(daily.wind_speed_10m_max?.[0] || current.wind_speed_10m || 0)),
        },
        prediction:
          condition === "normal"
            ? "No severe weather signal from the current forecast."
            : `Weather may raise ${condition.replace("_", " ")} risk today.`,
        tip: weatherTips[condition],
      },
    });
  } catch (error) {
    console.error("Weather fetch error:", error.message);
    res.status(502).json({
      success: false,
      message: "Could not fetch weather forecast right now",
    });
  }
});

module.exports = router;
