import { Suspense } from "react"
import { Routes } from "@blitzjs/next"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { useQuery, useMutation } from "@blitzjs/rpc"
import { useParam } from "@blitzjs/next"

import Layout from "src/core/layouts/Layout"
import getGroceryTrip from "src/grocery-trips/queries/getGroceryTrip"
import deleteGroceryTrip from "src/grocery-trips/mutations/deleteGroceryTrip"

export const GroceryTrip = () => {
  const router = useRouter()
  const groceryTripId = useParam("groceryTripId", "number")
  const [deleteGroceryTripMutation] = useMutation(deleteGroceryTrip)
  const [groceryTrip] = useQuery(getGroceryTrip, { id: groceryTripId })

  return (
    <>
      <Head>
        <title>GroceryTrip {groceryTrip.id}</title>
      </Head>

      <div>
        <h1>GroceryTrip {groceryTrip.id}</h1>
        <pre>{JSON.stringify(groceryTrip, null, 2)}</pre>

        <Link href={Routes.EditGroceryTripPage({ groceryTripId: groceryTrip.id })}>Edit</Link>

        <button
          type="button"
          onClick={async () => {
            if (window.confirm("This will be deleted")) {
              await deleteGroceryTripMutation({ id: groceryTrip.id })
              await router.push(Routes.GroceryTripsPage())
            }
          }}
          style={{ marginLeft: "0.5rem" }}
        >
          Delete
        </button>
      </div>
    </>
  )
}

const ShowGroceryTripPage = () => {
  return (
    <div>
      <p>
        <Link href={Routes.GroceryTripsPage()}>GroceryTrips</Link>
      </p>

      <Suspense fallback={<div>Loading...</div>}>
        <GroceryTrip />
      </Suspense>
    </div>
  )
}

ShowGroceryTripPage.authenticate = true
ShowGroceryTripPage.getLayout = (page) => <Layout>{page}</Layout>

export default ShowGroceryTripPage
