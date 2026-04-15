import express from "express";
import {
  activateAchievementHandler,
  createAchievementHandler,
  deactivateAchievementHandler,
  deleteAchievementHandler,
  generateAchievementSuggestionHandler,
  getAchievementLeaderboardByChannelIdHandler,
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

function resolveAllowedCorsOrigin(origin: string): string | null {
  const configuredOrigin = config.cors.allowedOrigins.find(
    (allowedOrigin) => allowedOrigin === origin,
  );

  if (configuredOrigin) {
    return configuredOrigin;
  }

  return (
    config.cors.twitchExtensionOrigins.find(
      (allowedOrigin) => allowedOrigin === origin,
    ) ?? null
  );
}

app.disable("x-powered-by");
app.use(express.json());
app.use((req, res, next) => {
  const origin = req.headers.origin;

  res.setHeader("Vary", "Origin");

  const allowedOrigin = origin ? resolveAllowedCorsOrigin(origin) : null;

  if (allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
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
    getAchievementLeaderboardByChannelIdHandler,
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
