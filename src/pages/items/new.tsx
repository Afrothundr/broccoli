import { Routes } from "@blitzjs/next"
import Link from "next/link"
import { useRouter } from "next/router"
import { useMutation, useQuery } from "@blitzjs/rpc"
import Layout from "src/core/layouts/Layout"
import { CreateItemSchema } from "src/items/schemas"
import createItem from "src/items/mutations/createItem"
import { ItemForm, FORM_ERROR } from "src/items/components/ItemForm"
import { Suspense } from "react"
import { useCurrentUser } from "src/users/hooks/useCurrentUser"
import getItemTypes from "src/item-types/queries/getItemTypes"

const NewItemPage = () => {
  const router = useRouter()
  const [createItemMutation] = useMutation(createItem)
  const [{ itemTypes }] = useQuery(getItemTypes, {
    orderBy: { name: "asc" },
  })
  const user = useCurrentUser()

  const itemTypeData = itemTypes.map((item) => ({
    label: item.name,
    value: item.id.toString(),
  }))

  return (
    <Layout title={"Create New Item"}>
      <h1>Create New Item</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ItemForm
          submitText="Create Item"
          itemTypeData={itemTypeData}
          schema={CreateItemSchema.omit({
            userId: true,
            groceryTripId: true,
            reminderSpanSeconds: true,
          })}
          // initialValues={{}}
          onSubmit={async (values) => {
            console.log(values, "values")
            try {
              const item = await createItemMutation({
                ...values,
                // TODO: Add grocery trip selection to form
                groceryTripId: 2,
                userId: user?.id || 0,
                reminderSpanSeconds:
                  itemTypes.find((item) => item.id == parseInt(values.itemTypes[0] || ""))
                    ?.suggested_life_span_seconds || BigInt(-1),
              })
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
