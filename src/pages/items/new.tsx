import { useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { Item, ItemStatusType } from "@prisma/client"
import { CronJob } from "cron"
import dayjs from "dayjs"
import Link from "next/link"
import { useRouter } from "next/router"
import { Suspense } from "react"
import Layout from "src/core/layouts/Layout"
import getGroceryTrips from "src/grocery-trips/queries/getGroceryTrips"
import getItemTypes from "src/item-types/queries/getItemTypes"
import { FORM_ERROR, ItemForm } from "src/items/components/ItemForm"
import createItem from "src/items/mutations/createItem"
import updateItem from "src/items/mutations/updateItem"
import { CreateItemSchema } from "src/items/schemas"

const NewItemPage = () => {
  const router = useRouter()
  const [createItemMutation] = useMutation(createItem)
  const [{ itemTypes }] = useQuery(getItemTypes, {
    orderBy: { name: "asc" },
  })
  const [{ groceryTrips }] = useQuery(getGroceryTrips, {
    orderBy: { name: "desc" },
  })
  const { userId } = useSession()
  const [updateItemMutation] = useMutation(updateItem)

  const itemTypeData = itemTypes.map((item) => ({
    label: item.name,
    value: item.id.toString(),
  }))
  const groceryTripsData = groceryTrips.map((trip) => ({
    label: `${trip.name} - ${dayjs(trip.createdAt).format("MM/DD/YY")}`,
    value: trip.id.toString(),
  }))

  const createItemStatusUpdate = ({
    data,
    triggerTimeInSeconds,
  }: {
    triggerTimeInSeconds: number
    data: Item
  }) => {
    return new CronJob(
      dayjs().add(triggerTimeInSeconds, "seconds").toDate(),
      function () {
        updateItemStatusInDB(data).catch((err) => console.error(err))
      },
      () => console.log(`item ${data.id} updated`),
      true
    )
  }

  const updateItemStatusInDB = async (data) => {
    await updateItemMutation({
      ...data,
      status: "BAD",
    })
  }

  return (
    <Layout title={"Create New Item"}>
      <h1>Create New Item</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ItemForm
          submitText="Create Item"
          itemTypeData={itemTypeData}
          groceryTripData={groceryTripsData}
          schema={CreateItemSchema.omit({
            userId: true,
            reminderSpanSeconds: true,
          })}
          initialValues={{
            groceryTripId: groceryTripsData[0]?.value,
          }}
          onSubmit={async (values) => {
            try {
              const itemType = itemTypes.find(
                (item) => item.id == parseInt(values.itemTypes[0] || "")
              )
              const item = await createItemMutation({
                ...values,
                groceryTripId: values.groceryTripId,
                userId: userId || 0,
                reminderSpanSeconds: itemType?.suggested_life_span_seconds || BigInt(-1),
              })

              if (item && itemType) {
                const triggerTimeInSeconds = Number(itemType?.suggested_life_span_seconds)
                createItemStatusUpdate({
                  triggerTimeInSeconds,
                  data: { ...item, status: ItemStatusType.BAD },
                })
              }

              await router.push(Routes.ShowItemPage({ itemId: item.id }))
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
        <Link href={Routes.ItemsPage()}>Items</Link>
      </p>
    </Layout>
  )
}

NewItemPage.authenticate = true

export default NewItemPage
