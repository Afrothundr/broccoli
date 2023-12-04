import { Container, Loader, SimpleGrid, Title } from "@mantine/core"
import { Suspense } from "react"
import { AverageGroceryCost } from "src/core/components/AverageGroceryCost"
import { AverageLoss } from "src/core/components/AverageLoss"
import Layout from "src/core/layouts/Layout"

export const Dashboard = () => {
  return (
    <Container size="lg">
      <Title>Dashboards</Title>
      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Suspense fallback={<Loader />}>
          <AverageGroceryCost />
        </Suspense>
        <Suspense fallback={<Loader />}>
          <AverageLoss />
        </Suspense>
      </SimpleGrid>
    </Container>
  )
}

const DashboardsPage = () => {
  return <Dashboard />
}

DashboardsPage.getLayout = (page) => <Layout title="Dashboard">{page}</Layout>

export default DashboardsPage
