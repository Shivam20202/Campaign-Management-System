import { NextResponse } from "next/server"

// Error types
export enum ErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  DATABASE_ERROR = "DATABASE_ERROR",
  AI_SERVICE_ERROR = "AI_SERVICE_ERROR",
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

// Error response interface
export interface ApiError {
  type: ErrorType
  message: string
  status: number
  details?: any
}

// Map error types to HTTP status codes
const errorStatusMap: Record<ErrorType, number> = {
  [ErrorType.VALIDATION_ERROR]: 400,
  [ErrorType.NOT_FOUND]: 404,
  [ErrorType.UNAUTHORIZED]: 401,
  [ErrorType.FORBIDDEN]: 403,
  [ErrorType.DATABASE_ERROR]: 500,
  [ErrorType.AI_SERVICE_ERROR]: 503,
  [ErrorType.EXTERNAL_API_ERROR]: 502,
  [ErrorType.INTERNAL_SERVER_ERROR]: 500,
}

/**
 * Create an API error with the specified type and message
 */
export function createApiError(type: ErrorType, message: string, details?: any): ApiError {
  return {
    type,
    message,
    status: errorStatusMap[type],
    details,
  }
}

/**
 * Generate a NextResponse object for an API error
 */
export function handleApiError(error: Error | ApiError): NextResponse {
  // If it's already an ApiError, use it
  if ((error as ApiError).type) {
    const apiError = error as ApiError

    // Log the error (in a real app, you'd use a proper logging service)
    console.error(`[${apiError.type}] ${apiError.message}`, apiError.details || "")

    return NextResponse.json(
      {
        error: apiError.message,
        type: apiError.type,
        details: apiError.details,
      },
      { status: apiError.status },
    )
  }

  // Otherwise, treat it as an internal server error
  console.error("[INTERNAL_SERVER_ERROR]", error)

  // Don't expose internal error details in production
  const message = process.env.NODE_ENV === "production" ? "An unexpected error occurred" : error.message

  return NextResponse.json(
    {
      error: message,
      type: ErrorType.INTERNAL_SERVER_ERROR,
    },
    { status: 500 },
  )
}
