"use client"

import { useState, useEffect } from "react"
import type { Campaign } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Edit, Trash2, RefreshCw } from "lucide-react"
import CampaignForm from "./campaign-form"
import { useToast } from "@/hooks/use-toast"

export default function CampaignDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/campaigns")
      if (!response.ok) {
        throw new Error("Failed to fetch campaigns")
      }
      const data = await response.json()
      setCampaigns(data.campaigns || data)
    } catch (error) {
      console.error("Error fetching campaigns:", error)
      toast({
        title: "Error",
        description: "Failed to fetch campaigns",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const refreshCampaigns = () => {
    setRefreshing(true)
    fetchCampaigns()
  }

  const handleCreateCampaign = () => {
    setEditingCampaign(null)
    setShowForm(true)
  }

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setShowForm(true)
  }

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) {
      return
    }

    try {
      // Optimistic update - remove from UI immediately
      setCampaigns(campaigns.filter((campaign) => campaign._id !== id))

      // Show toast
      toast({
        title: "Deleting campaign...",
        description: "Please wait while we process your request",
      })

      const response = await fetch(`/api/campaigns/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete campaign")
      }

      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting campaign:", error)
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      })
      // Revert optimistic update
      fetchCampaigns()
    }
  }

  const handleToggleStatus = async (campaign: Campaign) => {
    try {
      const newStatus = campaign.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"

      // Optimistic update - update status in UI immediately
      setCampaigns(campaigns.map((c) => (c._id === campaign._id ? { ...c, status: newStatus } : c)))

      const response = await fetch(`/api/campaigns/${campaign._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update campaign status")
      }

      toast({
        title: "Success",
        description: `Campaign ${newStatus === "ACTIVE" ? "activated" : "deactivated"} successfully`,
      })
    } catch (error) {
      console.error("Error updating campaign status:", error)
      toast({
        title: "Error",
        description: "Failed to update campaign status",
        variant: "destructive",
      })
      // Revert optimistic update
      fetchCampaigns()
    }
  }

  const handleFormSubmit = (campaign: Campaign) => {
    setShowForm(false)

    // Optimistic update - add or update campaign in UI immediately
    if (editingCampaign) {
      // Update existing campaign
      setCampaigns(campaigns.map((c) => (c._id === campaign._id ? campaign : c)))
    } else {
      // Add new campaign
      setCampaigns([campaign, ...campaigns])
    }

    toast({
      title: "Success",
      description: `Campaign ${editingCampaign ? "updated" : "created"} successfully`,
    })
  }

  const handleFormCancel = () => {
    setShowForm(false)
  }

  if (showForm) {
    return <CampaignForm campaign={editingCampaign} onSubmit={handleFormSubmit} onCancel={handleFormCancel} />
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Campaign Management</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={refreshCampaigns} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={handleCreateCampaign}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-600">No campaigns found</h3>
          <p className="text-gray-500 mt-2">Create your first campaign to get started</p>
          <Button onClick={handleCreateCampaign} className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <Card key={campaign._id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{campaign.name}</CardTitle>
                  <Badge
                    variant={campaign.status === "ACTIVE" ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => handleToggleStatus(campaign)}
                  >
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{campaign.description}</p>
                <div className="text-sm text-gray-500 mb-2">
                  <span className="font-medium">Leads:</span> {campaign.leads?.length || 0}
                </div>
                <div className="text-sm text-gray-500 mb-4">
                  <span className="font-medium">Accounts:</span> {campaign.accountIDs?.length || 0}
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleEditCampaign(campaign)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteCampaign(campaign._id as string)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
