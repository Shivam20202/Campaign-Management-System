import { connectToDatabase } from "./mongodb"
import { CampaignStatus } from "./types"
import { campaignsSchema, linkedinProfilesSchema } from "./db-schemas"

/**
 * Initialize the database with required collections, schemas and indexes
 */
export async function initializeDatabase() {
  console.log("Initializing database...")
  const { db } = await connectToDatabase()

  // Create collections if they don't exist
  const collections = await db.listCollections().toArray()
  const collectionNames = collections.map((c) => c.name)

  // Setup campaigns collection
  if (!collectionNames.includes("campaigns")) {
    console.log("Creating campaigns collection with schema validation...")
    await db.createCollection("campaigns", campaignsSchema)
  } else {
    // Update the schema validation for existing collection
    console.log("Updating campaigns collection schema validation...")
    await db.command({
      collMod: "campaigns",
      validator: campaignsSchema.validator,
    })
  }

  // Create indexes for campaigns
  console.log("Setting up campaigns indexes...")
  await db.collection("campaigns").createIndexes([
    { key: { name: 1 }, name: "name_idx" },
    { key: { status: 1 }, name: "status_idx" },
    { key: { createdAt: -1 }, name: "createdAt_idx" },
  ])

  // Setup linkedin_profiles collection
  if (!collectionNames.includes("linkedin_profiles")) {
    console.log("Creating linkedin_profiles collection with schema validation...")
    await db.createCollection("linkedin_profiles", linkedinProfilesSchema)
  } else {
    // Update the schema validation for existing collection
    console.log("Updating linkedin_profiles collection schema validation...")
    await db.command({
      collMod: "linkedin_profiles",
      validator: linkedinProfilesSchema.validator,
    })
  }

  // Create indexes for linkedin_profiles
  console.log("Setting up linkedin_profiles indexes...")
  await db.collection("linkedin_profiles").createIndexes([
    { key: { name: 1 }, name: "name_idx" },
    { key: { company: 1 }, name: "company_idx" },
    { key: { profile_url: 1 }, name: "profile_url_idx", unique: true, sparse: true },
    { key: { createdAt: -1 }, name: "createdAt_idx" },
  ])

  // Optional: Create sample data
  const campaignsCount = await db.collection("campaigns").countDocuments()
  if (campaignsCount === 0) {
    console.log("Adding sample campaign data...")
    await db.collection("campaigns").insertOne({
      name: "Sample Campaign",
      description: "This is a sample campaign created during initialization",
      status: CampaignStatus.ACTIVE,
      leads: ["https://linkedin.com/in/sample-profile-1", "https://linkedin.com/in/sample-profile-2"],
      accountIDs: ["123", "456"],
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  console.log("Database initialization complete!")
}

// Run the initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log("Database initialization script completed successfully")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Error initializing database:", error)
      process.exit(1)
    })
}
