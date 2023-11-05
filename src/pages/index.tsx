import { BlitzPage, Routes } from "@blitzjs/next"
import { HeroTitle } from "src/core/components/HeroTitle"

const Home: BlitzPage = () => {
  return <HeroTitle />
}
Home.redirectAuthenticatedTo = Routes.DashboardsPage()
export default Home
