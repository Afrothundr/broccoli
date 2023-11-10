import { useSession } from "@blitzjs/auth"
import { Routes, useParam } from "@blitzjs/next"
import { useMutation, useQuery } from "@blitzjs/rpc"
import dayjs from "dayjs"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { Suspense } from "react"

import { FORM_ERROR, ItemForm } from "src/core/components/ItemForm"
import Layout from "src/core/layouts/Layout"
import { ItemTypeGrouper } from "src/core/utils/ItemTypeGrouper"
import getGroceryTrips from "src/grocery-trips/queries/getGroceryTrips"
import getItemTypes from "src/item-types/queries/getItemTypes"
import updateItem from "src/items/mutations/updateItem"
import getItem from "src/items/queries/getItem"
import { UpdateItemSchema } from "src/items/schemas"

export const EditItem = () => {
  const router = useRouter()
  const { userId } = useSession()
  const itemId = useParam("itemId", "number")
  const [item, { setQueryData }] = useQuery(
    getItem,
    { id: itemId },
    {
      // This ensures the query never refreshes and overwrites the form data while the user is editing.
      staleTime: Infinity,
    }
  )
  const [updateItemMutation] = useMutation(updateItem)
  const [{ itemTypes }] = useQuery(getItemTypes, {
    orderBy: { name: "asc" },
  })
  const [{ groceryTrips }] = useQuery(getGroceryTrips, {
    orderBy: { name: "desc" },
    where: { userId: userId ?? 0 },
  })

  const groceryTripsData = groceryTrips.map((trip) => ({
    label: `${trip.name} - ${dayjs(trip.createdAt).format("MM/DD/YY")}`,
    value: trip.id.toString(),
  }))

  return (
    <>
      <Head>
        <title>Edit Item {item.id}</title>
      </Head>

      <div>
        <h1>Edit Item {item.id}</h1>
        <pre>{JSON.stringify(item, null, 2)}</pre>
        <Suspense fallback={<div>Loading...</div>}>
          <ItemForm
            submitText="Update Item"
            itemTypeData={ItemTypeGrouper(itemTypes)}
            groceryTripData={groceryTripsData}
            schema={UpdateItemSchema}
            initialValues={item}
            onSubmit={async (values) => {
              try {
                const updated = await updateItemMutation({
                  ...values,
                  id: item.id,
                })
                await setQueryData(updated)
                await router.push(Routes.ShowItemPage({ itemId: updated.id }))
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

const EditItemPage = () => {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <EditItem />
      </Suspense>

      <p>
        <Link href={Routes.ItemsPage()}>Items</Link>
      </p>
    </div>
  )
}

EditItemPage.authenticate = true
EditItemPage.getLayout = (page) => <Layout>{page}</Layout>

export default EditItemPage
