import express from "express";
import {
  activateAchievementHandler,
  createAchievementHandler,
  deactivateAchievementHandler,
  deleteAchievementHandler,
  getAchievementByIdHandler,
  getAchievementsByChannelIdHandler,
  updateAchievementHandler,
} from "./controllers/achievementController";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { achievementRoutes } from "./routes/achievementRoutes";
import { config } from "./config/environment";

const app = express();

app.disable("x-powered-by");
app.use(express.json());

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
    getAchievementByIdHandler,
    getAchievementsByChannelIdHandler,
    updateAchievementHandler,
  }),
);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
