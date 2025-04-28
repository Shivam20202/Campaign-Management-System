"use client"

import type React from "react"

import { useState } from "react"
import type { Campaign } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save } from "lucide-react"

interface CampaignFormProps {
  campaign?: Campaign | null
  onSubmit: (campaign: Campaign) => void
  onCancel: () => void
}

export default function CampaignForm({ campaign, onSubmit, onCancel }: CampaignFormProps) {
  const isEditing = !!campaign
  const { toast } = useToast()

  const [formData, setFormData] = useState<Partial<Campaign>>(
    campaign || {
      name: "",
      description: "",
      status: "ACTIVE",
      leads: [],
      accountIDs: [],
    },
  )

  const [leadsInput, setLeadsInput] = useState(campaign?.leads ? campaign.leads.join("\n") : "")

  const [accountsInput, setAccountsInput] = useState(campaign?.accountIDs ? campaign.accountIDs.join("\n") : "")

  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value as "ACTIVE" | "INACTIVE" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Process leads and accountIDs
      const leads = leadsInput
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      const accountIDs = accountsInput
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      const campaignData = {
        ...formData,
        leads,
        accountIDs,
      }

      const url = isEditing ? `/api/campaigns/${campaign._id}` : "/api/campaigns"

      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(campaignData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save campaign")
      }

      // Get the saved campaign data from the response
      const savedCampaign = await response.json()

      // Call onSubmit with the saved campaign data
      onSubmit(savedCampaign)
    } catch (error) {
      console.error("Error saving campaign:", error)
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to save campaign",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={onCancel} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>{isEditing ? "Edit Campaign" : "Create Campaign"}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter campaign name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter campaign description"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <RadioGroup value={formData.status} onValueChange={handleStatusChange} className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ACTIVE" id="active" />
                <Label htmlFor="active">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="INACTIVE" id="inactive" />
                <Label htmlFor="inactive">Inactive</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leads">LinkedIn Leads (one URL per line)</Label>
            <Textarea
              id="leads"
              value={leadsInput}
              onChange={(e) => setLeadsInput(e.target.value)}
              placeholder="https://linkedin.com/in/profile-1
https://linkedin.com/in/profile-2"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountIDs">Account IDs (one ID per line)</Label>
            <Textarea
              id="accountIDs"
              value={accountsInput}
              onChange={(e) => setAccountsInput(e.target.value)}
              placeholder="123
456"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Campaign
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
