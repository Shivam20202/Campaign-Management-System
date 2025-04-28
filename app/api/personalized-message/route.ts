import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { createLogger } from "@/lib/logger"
import { createApiError, handleApiError, ErrorType } from "@/lib/error-handler"

const logger = createLogger("api:personalized-message")

// Template-based message generation (no OpenAI dependency)
function generatePersonalizedMessage(profileData: any): string {
  const templates = [
    `Hi ${profileData.name},

I noticed your impressive work as ${profileData.job_title} at ${profileData.company}. Your experience in ${profileData.location} caught my attention, especially your background in "${profileData.summary.substring(0, 30)}...".

Our campaign management and outreach automation tool has helped professionals like you improve lead generation by up to 40%. Would you be open to a quick chat about how we could help streamline your outreach efforts?

Looking forward to connecting,
[Your Name]`,

    `Hello ${profileData.name},

I came across your profile and was impressed by your role as ${profileData.job_title} at ${profileData.company}. Your experience in ${profileData.location} is exactly the kind of background we've seen success with.

I'm reaching out because our campaign management platform has been helping professionals in ${profileData.company.split(" ")[0]} improve their lead generation and outreach efforts. Based on your focus on "${profileData.summary.substring(0, 25)}...", I think you might find our automation tools particularly valuable.

Would you be interested in a brief conversation about how we might help?

Best regards,
[Your Name]`,

    `${profileData.name},

Your work as ${profileData.job_title} at ${profileData.company} caught my attention. I'm particularly impressed by your experience in ${profileData.location} and your focus on "${profileData.summary.substring(0, 35)}...".

I lead growth at a company that provides campaign management and outreach automation tools specifically designed for professionals in your industry. Our clients typically see a 35% increase in response rates within the first month.

Would you be open to a 15-minute call to explore if our solution might be valuable for your team at ${profileData.company}?

Warm regards,
[Your Name]`,
  ]

  // Select a random template
  const randomIndex = Math.floor(Math.random() * templates.length)
  return templates[randomIndex]
}

export async function POST(req: NextRequest) {
  try {
    const profileData = await req.json()

    // Validate required fields
    const requiredFields = ["name", "job_title", "company", "location", "summary"]
    const missingFields = requiredFields.filter((field) => !profileData[field])

    if (missingFields.length > 0) {
      throw createApiError(
        ErrorType.VALIDATION_ERROR,
        "Missing required fields",
        `Missing fields: ${missingFields.join(", ")}`,
      )
    }

    logger.info({
      message: "Generating personalized message",
      profileName: profileData.name,
      company: profileData.company,
    })

    // Generate personalized message using templates instead of AI
    const message = generatePersonalizedMessage(profileData)

    // Save the generated message to the database for analytics (optional)
    try {
      const { db } = await connectToDatabase()
      await db.collection("generated_messages").insertOne({
        profileData,
        generatedMessage: message,
        createdAt: new Date(),
      })

      logger.info({
        message: "Saved generated message to database",
        profileName: profileData.name,
      })
    } catch (dbError) {
      // Log error but don't fail the request
      logger.error({
        message: "Error saving generated message to database",
        error: dbError,
      })
    }

    return NextResponse.json({ message })
  } catch (error: any) {
    logger.error({
      message: "Error generating personalized message",
      error: error.message,
      stack: error.stack,
    })

    return handleApiError(error)
  }
}
