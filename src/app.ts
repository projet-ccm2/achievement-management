/* global URL */
import express from "express";
import {
  activateAchievementHandler,
  createAchievementHandler,
  deactivateAchievementHandler,
  deleteAchievementHandler,
  generateAchievementSuggestionHandler,
  getAchievementByIdHandler,
  getAchievementsByChannelIdHandler,
  getAchievementsByUserIdHandler,
  getAchievementsByUserIdAndChannelIdHandler,
  getPublicAchievementsHandler,
  updateAchievementHandler,
} from "./controllers/achievementController";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { achievementRoutes } from "./routes/achievementRoutes";
import { config } from "./config/environment";

const app = express();
const allowedMethods = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const allowedHeaders = "Content-Type, Authorization";

function isAllowedTwitchExtensionOrigin(origin: string): boolean {
  try {
    const parsedOrigin = new URL(origin);

    return (
      parsedOrigin.protocol === "https:" &&
      parsedOrigin.hostname.endsWith(".ext-twitch.tv")
    );
  } catch {
    return false;
  }
}

function isAllowedCorsOrigin(origin: string): boolean {
  return (
    config.cors.allowedOrigins.includes(origin) ||
    isAllowedTwitchExtensionOrigin(origin)
  );
}

app.disable("x-powered-by");
app.use(express.json());
app.use((req, res, next) => {
  const origin = req.headers.origin;

  res.setHeader("Vary", "Origin");

  if (origin && isAllowedCorsOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", allowedMethods);
    res.setHeader("Access-Control-Allow-Headers", allowedHeaders);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

app.use(
  "/achievements",
  achievementRoutes({
    activateAchievementHandler,
    createAchievementHandler,
    deactivateAchievementHandler,
    deleteAchievementHandler,
    generateAchievementSuggestionHandler,
    getAchievementByIdHandler,
    getAchievementsByChannelIdHandler,
    getAchievementsByUserIdHandler,
    getAchievementsByUserIdAndChannelIdHandler,
    getPublicAchievementsHandler,
    updateAchievementHandler,
  }),
);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
