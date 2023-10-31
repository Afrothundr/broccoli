import Layout from "src/core/layouts/Layout"

export const Dashboard = () => {
  return <div>Dashboards!</div>
}

const DashboardsPage = () => {
  return <Dashboard />
}

DashboardsPage.getLayout = (page) => <Layout title="Dashboard">{page}</Layout>

export default DashboardsPage
