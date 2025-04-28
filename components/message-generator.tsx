"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Wand2 } from "lucide-react"

export default function MessageGenerator() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [generatedMessage, setGeneratedMessage] = useState("")

  const [formData, setFormData] = useState({
    name: "John Doe",
    job_title: "Software Engineer",
    company: "TechCorp",
    location: "San Francisco, CA",
    summary: "Experienced in AI & ML with 5+ years of experience building scalable applications.",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/personalized-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate message")
      }

      const data = await response.json()
      setGeneratedMessage(data.message)
    } catch (error) {
      console.error("Error generating message:", error)
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to generate message",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>LinkedIn Profile Data</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                name="job_title"
                value={formData.job_title}
                onChange={handleChange}
                placeholder="Software Engineer"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="TechCorp"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="San Francisco, CA"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Profile Summary</Label>
              <Textarea
                id="summary"
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                placeholder="Experienced in AI & ML..."
                rows={3}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </div>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Personalized Message
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Message</CardTitle>
        </CardHeader>
        <CardContent>
          {generatedMessage ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="whitespace-pre-wrap">{generatedMessage}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigator.clipboard.writeText(generatedMessage)}
                className="w-full"
              >
                Copy to Clipboard
              </Button>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">
                Fill in the LinkedIn profile details and click "Generate Personalized Message" to create an AI-powered
                outreach message.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
