import { BlitzPage } from "@blitzjs/next"
import { HeroTitle } from "src/core/components/HeroTitle"

const Home: BlitzPage = () => {
  return <HeroTitle />
}

export const dynamic = "force-dynamic"

export default Home
