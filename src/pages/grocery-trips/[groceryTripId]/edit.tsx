import { Routes, useParam } from "@blitzjs/next"
import { useMutation, useQuery } from "@blitzjs/rpc"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { Suspense } from "react"

import Layout from "src/core/layouts/Layout"
import { FORM_ERROR, GroceryTripForm } from "src/grocery-trips/components/GroceryTripForm"
import updateGroceryTrip from "src/grocery-trips/mutations/updateGroceryTrip"
import getGroceryTrip from "src/grocery-trips/queries/getGroceryTrip"
import { UpdateGroceryTripSchema } from "src/grocery-trips/schemas"

export const EditGroceryTrip = () => {
  const router = useRouter()
  const groceryTripId = useParam("groceryTripId", "number")
  const [groceryTrip, { setQueryData }] = useQuery(
    getGroceryTrip,
    { id: groceryTripId },
    {
      // This ensures the query never refreshes and overwrites the form data while the user is editing.
      staleTime: Infinity,
    }
  )
  const [updateGroceryTripMutation] = useMutation(updateGroceryTrip)

  return (
    <>
      <Head>
        <title>Edit GroceryTrip</title>
      </Head>

      <div>
        <h1>Edit GroceryTrip</h1>
        <Suspense fallback={<div>Loading...</div>}>
          <GroceryTripForm
            submitText="Update GroceryTrip"
            schema={UpdateGroceryTripSchema}
            initialValues={groceryTrip}
            onSubmit={async (values) => {
              try {
                const updated = await updateGroceryTripMutation({
                  ...values,
                  id: groceryTrip.id,
                })
                await setQueryData({
                  ...updated,
                  receipts: groceryTrip.receipts,
                  items: groceryTrip.items,
                })
                await router.push(Routes.ShowGroceryTripPage({ groceryTripId: updated.id }))
              } catch (error: any) {
                console.error(error)
                return {
                  [FORM_ERROR]: error.toString(),
                }
              }
            }}
          />
        </Suspense>
      </div>
    </>
  )
}

const EditGroceryTripPage = () => {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <EditGroceryTrip />
      </Suspense>

      <p>
        <Link href={Routes.GroceryTripsPage()}>GroceryTrips</Link>
      </p>
    </div>
  )
}

EditGroceryTripPage.authenticate = true
EditGroceryTripPage.getLayout = (page) => <Layout>{page}</Layout>

export default EditGroceryTripPage
