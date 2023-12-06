import { Container, Flex, Loader, SimpleGrid, Title } from "@mantine/core"
import { Suspense } from "react"
import { AverageGroceryCost } from "src/core/components/AverageGroceryCost"
import { AverageLoss } from "src/core/components/AverageLoss"
import { CurrentSavings } from "src/core/components/CurrentSavings"
import { StorageAdvice } from "src/core/components/StorageAdvice"
import Layout from "src/core/layouts/Layout"

export const Dashboard = () => {
  return (
    <Flex
      direction={{ base: "column", md: "row" }}
      gap={{ base: "sm", md: "md" }}
      justify={{ sm: "center" }}
    >
      <Container>
        <Title>Dashboards</Title>
        <SimpleGrid cols={{ base: 1, lg: 2 }}>
          <Suspense fallback={<Loader />}>
            <AverageGroceryCost />
          </Suspense>
          <Suspense fallback={<Loader />}>
            <AverageLoss />
          </Suspense>
          <Suspense fallback={<Loader />}>
            <CurrentSavings />
          </Suspense>
        </SimpleGrid>
      </Container>
      <Container size="xs">
        <Title order={2}>Storage Advice</Title>
        <Suspense fallback={<Loader />}>
          <StorageAdvice />
        </Suspense>
      </Container>
    </Flex>
  )
}

const DashboardsPage = () => {
  return <Dashboard />
}

DashboardsPage.getLayout = (page) => <Layout title="Dashboard">{page}</Layout>

export default DashboardsPage
