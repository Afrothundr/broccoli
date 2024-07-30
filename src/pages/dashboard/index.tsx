import { Routes } from "@blitzjs/next"
import { Divider, Flex, Group, Loader, Stack, Title } from "@mantine/core"
import { Suspense } from "react"
import { AverageGroceryCost } from "src/core/components/AverageGroceryCost"
import { CurrentSavings } from "src/core/components/CurrentSavings"
import { ItemTypeBreakdown } from "src/core/components/ItemTypeBreakdown"
import { StorageAdvice } from "src/core/components/StorageAdvice"
import { UsageRate } from "src/core/components/UsageRate"
import Layout from "src/core/layouts/Layout"
import { useCurrentUser } from "src/users/hooks/useCurrentUser"

export const Dashboard = () => {
  const user = useCurrentUser()
  return (
    <Flex
      direction={{ base: "column", md: "row" }}
      gap={{ base: "sm", md: "md" }}
      justify={{ md: "space-between", base: "center" }}
      p={{ base: "sm", md: "md" }}
    >
      <Stack px="md" justify="between" style={{ flexGrow: 3 }}>
        <Title>Hello, {user?.firstName}</Title>
        <Stack gap="md" my="md">
          <Divider />
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
    </Flex>
  )
}

const DashboardsPage = () => {
  return <Dashboard />
}

DashboardsPage.getLayout = (page) => <Layout title="Dashboard">{page}</Layout>
DashboardsPage.authenticate = { redirectTo: Routes.LoginPage() }

export default DashboardsPage
