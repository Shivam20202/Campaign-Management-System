import { getServerSession } from "next-auth/next"
import { createApiError, ErrorType } from "./error-handler"

// Define user roles
export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

// Check if user is authenticated
export async function isAuthenticated() {
  const session = await getServerSession()

  if (!session || !session.user) {
    throw createApiError(ErrorType.UNAUTHORIZED, "Authentication required", {
      message: "You must be signed in to access this resource",
    })
  }

  return session
}

// Check if user has required role
export async function hasRole(requiredRole: UserRole) {
  const session = await getServerSession()

  if (!session || !session.user) {
    throw createApiError(ErrorType.UNAUTHORIZED, "Authentication required", {
      message: "You must be signed in to access this resource",
    })
  }

  if (session.user.role !== requiredRole) {
    throw createApiError(ErrorType.FORBIDDEN, "Insufficient permissions", {
      message: "You don't have permission to access this resource",
      requiredRole,
      userRole: session.user.role,
    })
  }

  return session
}
