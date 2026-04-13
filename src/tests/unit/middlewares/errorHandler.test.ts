/* global describe, expect, it, jest */
import { Request, Response } from "express";
import {
  ApplicationError,
  errorHandler,
  notFoundHandler,
} from "../../../middlewares/errorHandler";
import { logger } from "../../../utils/logger";

jest.mock("../../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("errorHandler", () => {
  it("should return application errors as-is", () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    errorHandler(
      new ApplicationError(400, "validation_error", "invalid payload"),
      {
        method: "POST",
        originalUrl: "/achievements",
      } as Request,
      response,
      jest.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      code: "validation_error",
      message: "invalid payload",
    });
  });

  it("should return application errors with details", () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    errorHandler(
      new ApplicationError(422, "business_rule", "rule violated", { field: "email" }),
      {
        method: "POST",
        originalUrl: "/achievements",
      } as Request,
      response,
      jest.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(422);
    expect(response.json).toHaveBeenCalledWith({
      code: "business_rule",
      message: "rule violated",
      details: { field: "email" },
    });
  });

  it("should log and return generic errors", () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    errorHandler(
      new Error("boom"),
      {
        method: "POST",
        originalUrl: "/achievements",
      } as Request,
      response,
      jest.fn(),
    );

    expect(logger.error).toHaveBeenCalledWith("Unhandled request error", {
      method: "POST",
      path: "/achievements",
      error: "boom",
    });
    expect(response.status).toHaveBeenCalledWith(500);
  });

  it("should return a not found payload", () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    notFoundHandler(
      {
        method: "GET",
        originalUrl: "/missing",
      } as Request,
      response,
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      code: "not_found",
      message: "Route GET /missing not found",
    });
  });
});
