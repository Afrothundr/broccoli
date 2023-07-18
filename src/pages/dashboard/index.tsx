import { Suspense } from "react"
import Layout from "src/core/layouts/Layout"

export const Dashboard = () => {
  return <div>Dashboards!</div>
}

const DashboardsPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Dashboard />
    </Suspense>
  )
}

DashboardsPage.getLayout = (page) => <Layout title="Dashboard">{page}</Layout>

export default DashboardsPage
