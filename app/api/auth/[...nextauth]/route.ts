import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { connectToDatabase } from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import { createLogger } from "@/lib/logger"

const logger = createLogger("api:auth")

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const { db } = await connectToDatabase()

          logger.info({
            message: "Attempting login",
            email: credentials.email,
          })

          const user = await db.collection("users").findOne({ email: credentials.email })

          if (!user) {
            logger.warn({
              message: "Login failed - user not found",
              email: credentials.email,
            })
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            logger.warn({
              message: "Login failed - invalid password",
              email: credentials.email,
            })
            return null
          }

          logger.info({
            message: "Login successful",
            email: credentials.email,
            userId: user._id.toString(),
          })

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role || "user",
          }
        } catch (error) {
          logger.error({
            message: "Auth error",
            error: error,
          })
          return null
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
