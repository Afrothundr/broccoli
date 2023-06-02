import { Routes } from "@blitzjs/next"
import Link from "next/link"
import { useRouter } from "next/router"
import { useMutation } from "@blitzjs/rpc"
import Layout from "src/core/layouts/Layout"
import { CreateGroceryTripSchema } from "src/grocery-trips/schemas"
import createGroceryTrip from "src/grocery-trips/mutations/createGroceryTrip"
import { GroceryTripForm, FORM_ERROR } from "src/grocery-trips/components/GroceryTripForm"
import { Suspense } from "react"

const NewGroceryTripPage = () => {
  const router = useRouter()
  const [createGroceryTripMutation] = useMutation(createGroceryTrip)

  return (
    <Layout title={"Create New GroceryTrip"}>
      <h1>Create New GroceryTrip</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <GroceryTripForm
          submitText="Create GroceryTrip"
          schema={CreateGroceryTripSchema}
          // initialValues={{}}
          onSubmit={async (values) => {
            try {
              const groceryTrip = await createGroceryTripMutation(values)
              await router.push(Routes.ShowGroceryTripPage({ groceryTripId: groceryTrip.id }))
            } catch (error: any) {
              console.error(error)
              return {
                [FORM_ERROR]: error.toString(),
              }
            }
          }}
        />
      </Suspense>
      <p>
        <Link href={Routes.GroceryTripsPage()}>GroceryTrips</Link>
      </p>
    </Layout>
  )
}

NewGroceryTripPage.authenticate = true

export default NewGroceryTripPage
