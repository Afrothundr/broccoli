import { Routes } from "@blitzjs/next"
import { Divider, Flex, Group, Loader, Stack } from "@mantine/core"
import { Suspense, useState } from "react"
import { AverageGroceryCost } from "src/core/components/AverageGroceryCost"
import { CurrentSavings } from "src/core/components/CurrentSavings"
import { FloatingUploadButton } from "src/core/components/FloatingUploadButton"
import { ItemTypeBreakdown } from "src/core/components/ItemTypeBreakdown"
import { StorageAdvice } from "src/core/components/StorageAdvice"
import { UploadModal } from "src/core/components/UploadModal"
import { UsageRate } from "src/core/components/UsageRate"
import Layout from "src/core/layouts/Layout"

export const Dashboard = () => {
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  return (
    <Flex
      direction={{ base: "column", md: "row" }}
      gap={{ base: "sm", md: "md" }}
      justify={{ md: "space-between", base: "center" }}
      p={{ base: "sm", md: "md" }}
    >
      <Stack px="md" justify="between" style={{ flexGrow: 3 }} className="relative">
        <Stack gap="md">
          <Group justify="space-between" gap="xl" grow>
            <Suspense fallback={<Loader />}>
              <CurrentSavings />
            </Suspense>
            <Suspense fallback={<Loader />}>
              <UsageRate />
            </Suspense>
          </Group>
          <Divider />
        </Stack>
        <Suspense fallback={<Loader />}>
          <AverageGroceryCost />
        </Suspense>
      </Stack>
      <Stack style={{ minWidth: "30%" }}>
        <Suspense fallback={<Loader />}>
          <ItemTypeBreakdown />
        </Suspense>
        <Suspense fallback={<Loader />}>
          <StorageAdvice />
        </Suspense>
      </Stack>
      <FloatingUploadButton handleClick={() => setIsUploadOpen(true)} />
      {isUploadOpen ? <UploadModal onModalClose={() => setIsUploadOpen(false)} /> : null}
    </Flex>
  )
}

const DashboardsPage = () => {
  return <Dashboard />
}

DashboardsPage.getLayout = (page) => <Layout title="Dashboard">{page}</Layout>
DashboardsPage.authenticate = { redirectTo: Routes.LoginPage() }

export default DashboardsPage
