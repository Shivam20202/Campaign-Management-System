import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { CampaignStatus } from "@/lib/types"
import { createLogger } from "@/lib/logger"
import { memoryCache } from "@/lib/cache"
import { createApiError, handleApiError, ErrorType } from "@/lib/error-handler"

const logger = createLogger("api:campaigns")

// GET all campaigns (excluding DELETED)
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(req.url)
    const status = url.searchParams.get("status")
    const limit = Number.parseInt(url.searchParams.get("limit") || "100")
    const skip = Number.parseInt(url.searchParams.get("skip") || "0")

    // Create cache key based on query parameters
    const cacheKey = `campaigns:${status || "all"}:${limit}:${skip}`

    // Try to get from cache first
    const cachedData = memoryCache.get(cacheKey)
    if (cachedData) {
      logger.info("Returning cached campaigns data")
      return NextResponse.json(cachedData)
    }

    const { db } = await connectToDatabase()

    // Build query
    const query: any = { status: { $ne: CampaignStatus.DELETED } }

    // Filter by status if provided
    if (status && Object.values(CampaignStatus).includes(status as CampaignStatus)) {
      query.status = status
    }

    logger.info({
      message: "Fetching campaigns",
      query,
      limit,
      skip,
    })

    // Execute query with pagination
    const campaigns = await db
      .collection("campaigns")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get total count for pagination
    const total = await db.collection("campaigns").countDocuments(query)

    const result = {
      campaigns,
      pagination: {
        total,
        limit,
        skip,
        hasMore: total > skip + limit,
      },
    }

    // Cache the result for 1 minute
    memoryCache.set(cacheKey, result, 60 * 1000)

    return NextResponse.json(result)
  } catch (error: any) {
    logger.error({
      message: "Error fetching campaigns",
      error: error.message,
      stack: error.stack,
    })
    return handleApiError(error)
  }
}

// POST create a new campaign
export async function POST(req: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const campaign = await req.json()

    logger.info({
      message: "Creating new campaign",
      campaignName: campaign.name,
    })

    // Validate required fields
    if (!campaign.name || !campaign.description) {
      throw createApiError(ErrorType.VALIDATION_ERROR, "Missing required fields", "Name and description are required")
    }

    // Validate and normalize status
    if (campaign.status) {
      campaign.status = campaign.status.toUpperCase()
      if (!Object.values(CampaignStatus).includes(campaign.status)) {
        throw createApiError(
          ErrorType.VALIDATION_ERROR,
          "Invalid status",
          `Status must be one of: ${Object.values(CampaignStatus).join(", ")}`,
        )
      }
    } else {
      campaign.status = CampaignStatus.ACTIVE
    }

    // Set default values if not provided
    campaign.leads = Array.isArray(campaign.leads) ? campaign.leads : []
    campaign.accountIDs = Array.isArray(campaign.accountIDs) ? campaign.accountIDs : []

    // Add timestamps
    const now = new Date()
    campaign.createdAt = now
    campaign.updatedAt = now

    const result = await db.collection("campaigns").insertOne(campaign)

    // Clear cache after creating a new campaign
    memoryCache.delete("campaigns:all")

    logger.info({
      message: "Campaign created successfully",
      campaignId: result.insertedId.toString(),
    })

    return NextResponse.json(
      {
        _id: result.insertedId,
        ...campaign,
      },
      { status: 201 },
    )
  } catch (error: any) {
    logger.error({
      message: "Error creating campaign",
      error: error.message,
      stack: error.stack,
    })
    return handleApiError(error)
  }
}
