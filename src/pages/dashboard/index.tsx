import { Routes } from "@blitzjs/next"
import { Loader, Stack, Text } from "@mantine/core"
import { ItemStatusType } from "@prisma/client"
import { Suspense } from "react"
import { AverageGroceryCost } from "src/core/components/AverageGroceryCost"
import { CurrentSavings } from "src/core/components/CurrentSavings"
import { ImageUpload } from "src/core/components/ImageUpload"
import { ItemTypeBreakdown } from "src/core/components/ItemTypeBreakdown"
import { UsageRate } from "src/core/components/UsageRate"
import Layout from "src/core/layouts/Layout"
import { ItemsList } from "../items"

export const Dashboard = () => {
  return (
    <Stack gap="lg">
      <Stack gap={0}>
        <Text size="xl" fw={900} variant="gradient" gradient={{ from: "green", to: "teal" }}>
          household breakdown
        </Text>
      </Stack>
      <Suspense fallback={<Loader />}>
        <ItemTypeBreakdown>
          <CurrentSavings />
        </ItemTypeBreakdown>
      </Suspense>
      <div className="flex flex-col md:flex-row gap-4 align-center mt-5">
        <Suspense fallback={<Loader />}>
          <AverageGroceryCost />
        </Suspense>
        <Suspense fallback={<Loader />}>
          <UsageRate />
        </Suspense>
      </div>
      <div className="flex flex-col gap-0">
        <Text c="dimmed" fw={700}>
          items at risk
        </Text>
        <ItemsList search="" filters={[ItemStatusType.BAD, ItemStatusType.OLD]} />
      </div>
      <div className="fixed bottom-[2rem] right-[2rem]">
        <ImageUpload style="floating" />
      </div>
    </Stack>
  )
}

const DashboardsPage = () => {
  return <Dashboard />
}

DashboardsPage.getLayout = (page) => <Layout title="Dashboard">{page}</Layout>
DashboardsPage.authenticate = { redirectTo: Routes.LoginPage() }

export default DashboardsPage
