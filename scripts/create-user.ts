import { connectToDatabase } from "../lib/mongodb"
import { UserRole } from "../lib/auth"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

async function createUser() {
  // Get user details from command line args
  const args = process.argv.slice(2)

  if (args.length < 3) {
    console.error("Usage: npm run create-user <name> <email> <password> [role]")
    process.exit(1)
  }

  const [name, email, password] = args
  const role = args[3] || UserRole.USER

  // Validate role
  if (!Object.values(UserRole).includes(role as UserRole)) {
    console.error(`Invalid role: ${role}. Valid roles are: ${Object.values(UserRole).join(", ")}`)
    process.exit(1)
  }

  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email })

    if (existingUser) {
      console.error(`User with email ${email} already exists`)
      process.exit(1)
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create user
    const result = await db.collection("users").insertOne({
      name,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date(),
    })

    console.log(`User created successfully with ID: ${result.insertedId}`)
    process.exit(0)
  } catch (error) {
    console.error("Error creating user:", error)
    process.exit(1)
  }
}

createUser().catch(console.error)
