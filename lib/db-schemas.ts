import { CampaignStatus } from "./types"

/**
 * MongoDB schema validation for the campaigns collection
 */
export const campaignsSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "description", "status", "leads", "accountIDs", "createdAt"],
      properties: {
        name: {
          bsonType: "string",
          description: "Campaign name is required",
        },
        description: {
          bsonType: "string",
          description: "Campaign description is required",
        },
        status: {
          enum: Object.values(CampaignStatus),
          description: "Status must be one of the allowed values",
        },
        leads: {
          bsonType: "array",
          description: "Leads must be an array of strings",
          items: {
            bsonType: "string",
          },
        },
        accountIDs: {
          bsonType: "array",
          description: "Account IDs must be an array of strings",
          items: {
            bsonType: "string",
          },
        },
        createdAt: {
          bsonType: "date",
          description: "Creation timestamp is required",
        },
        updatedAt: {
          bsonType: "date",
          description: "Update timestamp",
        },
      },
    },
  },
}

/**
 * MongoDB schema validation for the linkedin_profiles collection
 */
export const linkedinProfilesSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "job_title", "company", "location", "summary", "createdAt"],
      properties: {
        name: {
          bsonType: "string",
          description: "Full name is required",
        },
        job_title: {
          bsonType: "string",
          description: "Job title is required",
        },
        company: {
          bsonType: "string",
          description: "Company name is required",
        },
        location: {
          bsonType: "string",
          description: "Location is required",
        },
        summary: {
          bsonType: "string",
          description: "Profile summary is required",
        },
        profile_url: {
          bsonType: "string",
          description: "LinkedIn profile URL",
        },
        createdAt: {
          bsonType: "date",
          description: "Creation timestamp is required",
        },
        updatedAt: {
          bsonType: "date",
          description: "Update timestamp",
        },
      },
    },
  },
}
