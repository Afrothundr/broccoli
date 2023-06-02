import { Suspense } from "react"
import { Routes } from "@blitzjs/next"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { useQuery, useMutation } from "@blitzjs/rpc"
import { useParam } from "@blitzjs/next"

import Layout from "src/core/layouts/Layout"
import { UpdateGroceryTripSchema } from "src/grocery-trips/schemas"
import getGroceryTrip from "src/grocery-trips/queries/getGroceryTrip"
import updateGroceryTrip from "src/grocery-trips/mutations/updateGroceryTrip"
import { GroceryTripForm, FORM_ERROR } from "src/grocery-trips/components/GroceryTripForm"

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
        <title>Edit GroceryTrip {groceryTrip.id}</title>
      </Head>

      <div>
        <h1>Edit GroceryTrip {groceryTrip.id}</h1>
        <pre>{JSON.stringify(groceryTrip, null, 2)}</pre>
        <Suspense fallback={<div>Loading...</div>}>
          <GroceryTripForm
            submitText="Update GroceryTrip"
            schema={UpdateGroceryTripSchema}
            initialValues={groceryTrip}
            onSubmit={async (values) => {
              try {
                const updated = await updateGroceryTripMutation({
                  id: groceryTrip.id,
                  ...values,
                })
                await setQueryData(updated)
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
