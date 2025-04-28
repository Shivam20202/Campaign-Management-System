import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CampaignDashboard from "@/components/campaign-dashboard"
import MessageGenerator from "@/components/message-generator"
import LinkedInScraper from "@/components/linkedin-scraper"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Campaign Management System</h1>

      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="message-generator">Message Generator</TabsTrigger>
          <TabsTrigger value="linkedin-scraper">LinkedIn Scraper</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <CampaignDashboard />
        </TabsContent>

        <TabsContent value="message-generator">
          <MessageGenerator />
        </TabsContent>

        <TabsContent value="linkedin-scraper">
          <LinkedInScraper />
        </TabsContent>
      </Tabs>
    </main>
  )
}
