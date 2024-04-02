import { Routes } from "@blitzjs/next"
import { useMutation } from "@blitzjs/rpc"
import Link from "next/link"
import { useRouter } from "next/router"
import { Suspense } from "react"
import Layout from "src/core/layouts/Layout"
import { GroceryTripForm } from "src/grocery-trips/components/GroceryTripForm"
import createGroceryTrip from "src/grocery-trips/mutations/createGroceryTrip"
import { CreateGroceryTripSchema } from "src/grocery-trips/schemas"
import { useCurrentUser } from "src/users/hooks/useCurrentUser"

const NewGroceryTripPage = () => {
  const router = useRouter()
  const user = useCurrentUser()
  const [createGroceryTripMutation] = useMutation(createGroceryTrip)

  return (
    <Layout title={"Create New Grocery Trip"}>
      <h1>Create New GroceryTrip</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <GroceryTripForm
          submitText="save"
          onSubmit={async (values) => {
            try {
              const formValues = CreateGroceryTripSchema.omit({ userId: true }).parse(values)
              const groceryTrip = await createGroceryTripMutation({
                ...formValues,
                userId: user?.id || 0,
              })
              await router.push(Routes.ShowGroceryTripPage({ groceryTripId: groceryTrip.id }))
            } catch (error: any) {
              console.error(error)
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
