import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";

class ApplicationError extends Error {
  public readonly statusCode: number;

  public readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    code: "not_found",
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  void next;

  if (error instanceof ApplicationError) {
    res.status(error.statusCode).json({
      code: error.code,
      message: error.message,
    });
    return;
  }

  logger.error("Unhandled request error", {
    method: req.method,
    path: req.originalUrl,
    error: error.message,
  });

  res.status(500).json({
    code: "internal_server_error",
    message: "An unexpected error occurred",
  });
}

export { ApplicationError, errorHandler, notFoundHandler };
