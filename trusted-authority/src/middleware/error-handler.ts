import type { ErrorRequestHandler } from "express";

import { HttpError } from "../errors/http-error.js";

interface BodyParserError extends Error {
  status?: number;
  type?: string;
}

function isBodyParserError(error: unknown): error is BodyParserError {
  return error instanceof Error && "type" in error;
}

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  request,
  response,
  next,
) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof HttpError) {
    const body: {
      error: {
        code: string;
        message: string;
        details?: readonly { field: string; message: string }[];
      };
    } = {
      error: {
        code: error.code,
        message: error.message,
      },
    };

    if (error.details !== undefined) {
      body.error.details = error.details;
    }

    response.status(error.statusCode).json(body);
    return;
  }

  if (isBodyParserError(error) && error.type === "entity.parse.failed") {
    response.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "The request body must contain valid JSON.",
      },
    });
    return;
  }

  if (isBodyParserError(error) && error.type === "entity.too.large") {
    response.status(413).json({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "The request body is too large.",
      },
    });
    return;
  }

  console.error("Unhandled request error", {
    method: request.method,
    path: request.path,
    errorName: error instanceof Error ? error.name : "UnknownError",
  });

  response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
    },
  });
};

