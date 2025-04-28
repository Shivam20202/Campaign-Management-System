"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Search, Download, UserPlus } from "lucide-react"
import type { LinkedInProfile } from "@/lib/types"

export default function LinkedInScraper() {
  const { toast } = useToast()
  const [searchUrl, setSearchUrl] = useState<string>(
    "https://www.linkedin.com/search/results/people/?geoUrn=%5B%22103644278%22%5D&industry=%5B%221594%22%2C%221862%22%2C%2280%22%5D&keywords=%22lead%20generation%20agency%22&origin=GLOBAL_SEARCH_HEADER&sid=z%40k&titleFreeText=Founder",
  )
  const [loading, setLoading] = useState(false)
  const [profiles, setProfiles] = useState<LinkedInProfile[]>([])

  const handleSearch = async () => {
    setLoading(true)

    try {
      // In a real implementation, this would call a backend endpoint that performs the scraping
      // For this demo, we'll simulate the scraping with mock data
      const mockProfiles = generateMockProfiles(20)
      setProfiles(mockProfiles)

      toast({
        title: "Success",
        description: `Found ${mockProfiles.length} LinkedIn profiles`,
      })
    } catch (error) {
      console.error("Error scraping LinkedIn profiles:", error)
      toast({
        title: "Error",
        description: "Failed to scrape LinkedIn profiles",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfiles = async () => {
    if (profiles.length === 0) {
      toast({
        title: "Error",
        description: "No profiles to save",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profiles),
      })

      if (!response.ok) {
        throw new Error("Failed to save profiles")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: data.message,
      })
    } catch (error) {
      console.error("Error saving profiles:", error)
      toast({
        title: "Error",
        description: "Failed to save profiles to database",
        variant: "destructive",
      })
    }
  }

  const handleAddToCampaign = async (profile: LinkedInProfile) => {
    // This would open a modal to select a campaign and add the profile to it
    toast({
      title: "Info",
      description: `Added ${profile.name} to campaign (demo only)`,
    })
  }

  // Helper function to generate mock LinkedIn profiles
  const generateMockProfiles = (count: number): LinkedInProfile[] => {
    const companies = ["LeadGen Pro", "Growth Hackers", "SalesForce", "HubSpot", "Marketo"]
    const locations = ["San Francisco, CA", "New York, NY", "Austin, TX", "London, UK", "Toronto, Canada"]
    const titles = ["Founder", "CEO", "Head of Growth", "Lead Generation Specialist", "Marketing Director"]

    return Array.from({ length: count }, (_, i) => ({
      name: `Profile ${i + 1}`,
      job_title: titles[Math.floor(Math.random() * titles.length)],
      company: companies[Math.floor(Math.random() * companies.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      summary: `Experienced professional with expertise in lead generation and marketing automation.`,
      profile_url: `https://linkedin.com/in/profile-${i + 1}`,
    }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>LinkedIn Profile Scraper</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="searchUrl">LinkedIn Search URL</Label>
              <div className="flex space-x-2">
                <Input
                  id="searchUrl"
                  value={searchUrl}
                  onChange={(e) => setSearchUrl(e.target.value)}
                  placeholder="Enter LinkedIn search URL"
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={loading || !searchUrl}>
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Searching...
                    </div>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Note: This is a demo. In a real implementation, this would use a headless browser to scrape LinkedIn
                profiles.
              </p>
            </div>

            {profiles.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Found {profiles.length} Profiles</h3>
                  <Button variant="outline" onClick={handleSaveProfiles}>
                    <Download className="mr-2 h-4 w-4" />
                    Save All to Database
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {profiles.map((profile, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{profile.name}</div>
                            <div className="text-sm text-blue-500">
                              <a href={profile.profile_url} target="_blank" rel="noopener noreferrer">
                                View Profile
                              </a>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{profile.job_title}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{profile.company}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{profile.location}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button variant="ghost" size="sm" onClick={() => handleAddToCampaign(profile)}>
                              <UserPlus className="h-4 w-4 mr-1" />
                              Add to Campaign
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
