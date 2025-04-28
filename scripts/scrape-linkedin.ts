// This script is designed to be run locally and NOT in production environment
// It requires local authentication with LinkedIn
import { chromium } from "playwright"
import fs from "fs"
import path from "path"
import { MongoClient } from "mongodb"
import dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env.local" })

// Configuration
const CONFIG = {
  // LinkedIn login credentials (from .env file or replace with your credentials)
  email: process.env.LINKEDIN_EMAIL || "",
  password: process.env.LINKEDIN_PASSWORD || "",

  // Number of profiles to scrape
  maxProfiles: 20,

  // Search URL
  searchUrl:
    process.env.LINKEDIN_SEARCH_URL ||
    "https://www.linkedin.com/search/results/people/?geoUrn=%5B%22103644278%22%5D&industry=%5B%221594%22%2C%221862%22%2C%2280%22%5D&keywords=%22lead%20generation%20agency%22&origin=GLOBAL_SEARCH_HEADER&sid=z%40k&titleFreeText=Founder",

  // Delay between actions to prevent rate limiting (in ms)
  delay: {
    min: 2000,
    max: 5000,
  },

  // Database connection
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/campaign-manager",
    dbName: process.env.MONGODB_DB || "campaign-manager",
    collection: "linkedin_profiles",
  },

  // Output directory for JSON file
  outputDir: path.join(process.cwd(), "data"),
}

// Helper function to delay execution
const randomDelay = async () => {
  const delay = Math.floor(Math.random() * (CONFIG.delay.max - CONFIG.delay.min + 1)) + CONFIG.delay.min
  console.log(`Waiting for ${delay}ms...`)
  await new Promise((resolve) => setTimeout(resolve, delay))
}

// Main scraping function
async function scrapeLinkedInProfiles() {
  // Validate configuration
  if (!CONFIG.email || !CONFIG.password) {
    console.error("LinkedIn email and password are required. Please add them to your .env.local file.")
    process.exit(1)
  }

  console.log("Starting LinkedIn profile scraper...")
  const browser = await chromium.launch({ headless: false }) // Set to true for headless mode
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    viewport: { width: 1280, height: 720 },
  })

  const page = await context.newPage()

  try {
    // Login to LinkedIn
    console.log("Logging in to LinkedIn...")
    await page.goto("https://www.linkedin.com/login")
    await page.fill("input#username", CONFIG.email)
    await page.fill("input#password", CONFIG.password)
    await page.click('button[type="submit"]')

    // Wait for login to complete
    await page.waitForNavigation({ waitUntil: "networkidle" })

    // Check if login was successful
    const currentUrl = page.url()
    if (currentUrl.includes("checkpoint") || currentUrl.includes("login")) {
      console.error("Login failed or additional verification required. Please try again manually.")
      await browser.close()
      process.exit(1)
    }

    console.log("Successfully logged in to LinkedIn")
    await randomDelay()

    // Navigate to search URL
    console.log("Navigating to search results...")
    await page.goto(CONFIG.searchUrl)
    await page.waitForLoadState("networkidle")
    await randomDelay()

    // Extract profile links from search results
    console.log("Extracting profile links...")
    const profileUrls = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a.app-aware-link"))
        .filter((link) => link.href.includes("/in/"))
        .map((link) => link.href.split("?")[0]) // Remove query parameters

      // Remove duplicates
      return [...new Set(links)]
    })

    console.log(`Found ${profileUrls.length} profile links`)

    // Limit the number of profiles to scrape
    const limitedProfileUrls = profileUrls.slice(0, CONFIG.maxProfiles)

    // Array to store scraped profile data
    const profiles = []

    // Visit each profile and extract data
    for (let i = 0; i < limitedProfileUrls.length; i++) {
      const profileUrl = limitedProfileUrls[i]
      console.log(`Scraping profile ${i + 1}/${limitedProfileUrls.length}: ${profileUrl}`)

      await page.goto(profileUrl)
      await page.waitForLoadState("networkidle")
      await randomDelay()

      // Extract profile data
      const profileData = await page.evaluate(() => {
        // Name
        const nameElement = document.querySelector("h1.text-heading-xlarge")
        const name = nameElement ? nameElement.textContent.trim() : null

        // Title
        const titleElement = document.querySelector("div.text-body-medium")
        const jobTitle = titleElement ? titleElement.textContent.trim() : null

        // Company
        const companyElement = document.querySelector(".inline-show-more-text")
        const company = companyElement ? companyElement.textContent.trim() : null

        // Location
        const locationElement = document.querySelector(".text-body-small.inline.t-black--light.break-words")
        const location = locationElement ? locationElement.textContent.trim() : null

        // Summary (About section)
        const summaryElement = document.querySelector(".pv-shared-text-with-see-more div.inline-show-more-text")
        const summary = summaryElement ? summaryElement.textContent.trim() : null

        return {
          name,
          job_title: jobTitle,
          company,
          location,
          summary: summary || "No summary available",
        }
      })

      // Add profile URL
      profileData.profile_url = profileUrl
      profileData.createdAt = new Date()

      // Add to profiles array
      profiles.push(profileData)
      console.log(`Successfully scraped: ${profileData.name} - ${profileData.job_title}`)
    }

    // Save profiles to file
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true })
    }

    const outputFile = path.join(CONFIG.outputDir, `linkedin_profiles_${Date.now()}.json`)
    fs.writeFileSync(outputFile, JSON.stringify(profiles, null, 2))
    console.log(`Saved ${profiles.length} profiles to ${outputFile}`)

    // Save to MongoDB
    console.log("Saving profiles to MongoDB...")
    const client = new MongoClient(CONFIG.mongodb.uri)
    await client.connect()

    const db = client.db(CONFIG.mongodb.dbName)
    const collection = db.collection(CONFIG.mongodb.collection)

    // Insert profiles
    if (profiles.length > 0) {
      const result = await collection.insertMany(profiles)
      console.log(`Successfully saved ${result.insertedCount} profiles to MongoDB`)
    }

    await client.close()

    console.log("LinkedIn profile scraping completed successfully!")
  } catch (error) {
    console.error("Error during scraping:", error)
  } finally {
    await browser.close()
  }
}

// Run the scraper
scrapeLinkedInProfiles().catch(console.error)
