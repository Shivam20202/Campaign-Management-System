import type { ObjectId } from "mongodb"

// Campaign status enum
export enum CampaignStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  DELETED = "DELETED",
}

// Campaign interface
export interface Campaign {
  _id?: string | ObjectId
  name: string
  description: string
  status: CampaignStatus
  leads: string[] // Array of LinkedIn URLs
  accountIDs: string[] // Array of account IDs
  createdAt?: Date
  updatedAt?: Date
}

// LinkedIn profile interface
export interface LinkedInProfile {
  _id?: string | ObjectId
  name: string
  job_title: string
  company: string
  location: string
  summary: string
  profile_url?: string
  createdAt?: Date
  updatedAt?: Date
}

// Personalized message response
export interface PersonalizedMessageResponse {
  message: string
}

// API error response
export interface ErrorResponse {
  error: string
  status?: number
  details?: any
}
