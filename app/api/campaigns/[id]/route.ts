import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { CampaignStatus } from "@/lib/types"
import { createApiError, handleApiError, ErrorType } from "@/lib/error-handler"
import { createLogger } from "@/lib/logger"
import { memoryCache } from "@/lib/cache"

const logger = createLogger("api:campaigns:id")

// GET a single campaign by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Try to get from cache first
    const cacheKey = `campaign:${id}`
    const cachedCampaign = memoryCache.get(cacheKey)
    if (cachedCampaign) {
      logger.info({
        message: "Returning cached campaign data",
        campaignId: id,
      })
      return NextResponse.json(cachedCampaign)
    }

    if (!ObjectId.isValid(id)) {
      throw createApiError(ErrorType.VALIDATION_ERROR, "Invalid campaign ID", { id })
    }

    logger.info({
      message: "Fetching campaign by ID",
      campaignId: id,
    })

    const { db } = await connectToDatabase()
    const campaign = await db.collection("campaigns").findOne({ _id: new ObjectId(id) })

    if (!campaign) {
      throw createApiError(ErrorType.NOT_FOUND, "Campaign not found", { id })
    }

    // Cache the result for 1 minute
    memoryCache.set(cacheKey, campaign, 60 * 1000)

    return NextResponse.json(campaign)
  } catch (error: any) {
    logger.error({
      message: "Error fetching campaign",
      campaignId: params.id,
      error: error.message,
    })
    return handleApiError(error)
  }
}

// PUT update campaign details
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const id = params.id
    const updateData = await req.json()

    logger.info({
      message: "Updating campaign",
      campaignId: id,
      updateFields: Object.keys(updateData),
    })

    if (!ObjectId.isValid(id)) {
      throw createApiError(ErrorType.VALIDATION_ERROR, "Invalid campaign ID", { id })
    }

    // Validate status if provided
    if (updateData.status) {
      updateData.status = updateData.status.toUpperCase()
      if (!Object.values(CampaignStatus).includes(updateData.status)) {
        throw createApiError(ErrorType.VALIDATION_ERROR, "Invalid status value", {
          providedStatus: updateData.status,
          validValues: Object.values(CampaignStatus),
        })
      }
    }

    // Remove _id from update data if present
    if (updateData._id) {
      delete updateData._id
    }

    // Add update timestamp
    updateData.updatedAt = new Date()

    const result = await db.collection("campaigns").updateOne({ _id: new ObjectId(id) }, { $set: updateData })

    if (result.matchedCount === 0) {
      throw createApiError(ErrorType.NOT_FOUND, "Campaign not found", { id })
    }

    const updatedCampaign = await db.collection("campaigns").findOne({ _id: new ObjectId(id) })

    // Update cache and clear list cache
    memoryCache.set(`campaign:${id}`, updatedCampaign, 60 * 1000)
    memoryCache.delete("campaigns:all")

    logger.info({
      message: "Campaign updated successfully",
      campaignId: id,
    })

    return NextResponse.json(updatedCampaign)
  } catch (error: any) {
    logger.error({
      message: "Error updating campaign",
      campaignId: params.id,
      error: error.message,
    })
    return handleApiError(error)
  }
}

// DELETE soft delete a campaign
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const id = params.id

    logger.info({
      message: "Soft deleting campaign",
      campaignId: id,
    })

    if (!ObjectId.isValid(id)) {
      throw createApiError(ErrorType.VALIDATION_ERROR, "Invalid campaign ID", { id })
    }

    const result = await db.collection("campaigns").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: CampaignStatus.DELETED,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      throw createApiError(ErrorType.NOT_FOUND, "Campaign not found", { id })
    }

    // Clear caches
    memoryCache.delete(`campaign:${id}`)
    memoryCache.delete("campaigns:all")

    logger.info({
      message: "Campaign deleted successfully",
      campaignId: id,
    })

    return NextResponse.json({ message: "Campaign deleted successfully" })
  } catch (error: any) {
    logger.error({
      message: "Error deleting campaign",
      campaignId: params.id,
      error: error.message,
    })
    return handleApiError(error)
  }
}
