import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { createLogger } from "@/lib/logger"
import { createApiError, handleApiError, ErrorType } from "@/lib/error-handler"

const logger = createLogger("api:leads")

// GET all scraped LinkedIn profiles
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(req.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "50")
    const skip = Number.parseInt(url.searchParams.get("skip") || "0")
    const search = url.searchParams.get("search") || ""

    logger.info({
      message: "Fetching LinkedIn profiles",
      limit,
      skip,
      search: search ? "yes" : "no",
    })

    const { db } = await connectToDatabase()

    // Build query
    const query: any = {}

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { job_title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ]
    }

    const profiles = await db
      .collection("linkedin_profiles")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get total count for pagination
    const total = await db.collection("linkedin_profiles").countDocuments(query)

    return NextResponse.json({
      profiles,
      pagination: {
        total,
        limit,
        skip,
        hasMore: total > skip + limit,
      },
    })
  } catch (error: any) {
    logger.error({
      message: "Error fetching LinkedIn profiles",
      error: error.message,
      stack: error.stack,
    })
    return handleApiError(error)
  }
}

// POST store scraped LinkedIn profiles
export async function POST(req: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const profiles = await req.json()

    if (!Array.isArray(profiles) || profiles.length === 0) {
      throw createApiError(ErrorType.VALIDATION_ERROR, "Invalid profiles data", "Expected an array of profiles")
    }

    logger.info({
      message: "Storing LinkedIn profiles",
      count: profiles.length,
    })

    // Add timestamp to each profile
    const profilesWithTimestamp = profiles.map((profile) => ({
      ...profile,
      createdAt: new Date(),
    }))

    const result = await db.collection("linkedin_profiles").insertMany(profilesWithTimestamp)

    logger.info({
      message: "LinkedIn profiles stored successfully",
      count: result.insertedCount,
    })

    return NextResponse.json(
      {
        message: `${result.insertedCount} profiles stored successfully`,
        insertedIds: result.insertedIds,
      },
      { status: 201 },
    )
  } catch (error: any) {
    logger.error({
      message: "Error storing LinkedIn profiles",
      error: error.message,
      stack: error.stack,
    })
    return handleApiError(error)
  }
}
