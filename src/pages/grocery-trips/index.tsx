import { Suspense } from "react"
import { Routes } from "@blitzjs/next"
import Head from "next/head"
import Link from "next/link"
import { usePaginatedQuery } from "@blitzjs/rpc"
import { useRouter } from "next/router"
import Layout from "src/core/layouts/Layout"
import getGroceryTrips from "src/grocery-trips/queries/getGroceryTrips"

const ITEMS_PER_PAGE = 100

export const GroceryTripsList = () => {
  const router = useRouter()
  const page = Number(router.query.page) || 0
  const [{ groceryTrips, hasMore }] = usePaginatedQuery(getGroceryTrips, {
    orderBy: { id: "asc" },
    skip: ITEMS_PER_PAGE * page,
    take: ITEMS_PER_PAGE,
  })

  const goToPreviousPage = () => router.push({ query: { page: page - 1 } })
  const goToNextPage = () => router.push({ query: { page: page + 1 } })

  return (
    <div>
      <ul>
        {groceryTrips.map((groceryTrip) => (
          <li key={groceryTrip.id}>
            <Link
              href={Routes.ShowGroceryTripPage({
                groceryTripId: groceryTrip.id,
              })}
            >
              {groceryTrip.name}
            </Link>
          </li>
        ))}
      </ul>

      <button disabled={page === 0} onClick={goToPreviousPage}>
        Previous
      </button>
      <button disabled={!hasMore} onClick={goToNextPage}>
        Next
      </button>
    </div>
  )
}

const GroceryTripsPage = () => {
  return (
    <Layout>
      <Head>
        <title>GroceryTrips</title>
      </Head>

      <div>
        <p>
          <Link href={Routes.NewGroceryTripPage()}>Create GroceryTrip</Link>
        </p>

        <Suspense fallback={<div>Loading...</div>}>
          <GroceryTripsList />
        </Suspense>
      </div>
    </Layout>
  )
}

export default GroceryTripsPage
