import { useSession } from "@blitzjs/auth"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { Modal, Title } from "@mantine/core"
import dayjs from "dayjs"
import { FORM_ERROR } from "final-form"
import getGroceryTrips from "src/grocery-trips/queries/getGroceryTrips"
import useItemTypes from "src/items/hooks/useItemTypes"
import createItem from "src/items/mutations/createItem"
import { CreateItemSchema } from "src/items/schemas"
import { ItemTypeGrouper } from "../utils/ItemTypeGrouper"
import { queueItemUpdates } from "../utils/QueueItemUpdates"
import { ItemForm } from "./ItemForm"

type NewItemModalProps = {
  onModalClose: () => void
  groceryTripIdDefault?: string
}

export const NewItemModal = ({
  onModalClose,
  groceryTripIdDefault,
}: NewItemModalProps): JSX.Element => {
  const { userId } = useSession()
  const itemTypes = useItemTypes()
  const [{ groceryTrips }] = useQuery(getGroceryTrips, {
    orderBy: { name: "desc" },
    where: { userId: userId ?? 0 },
  })
  const [createItemMutation] = useMutation(createItem)

  const groceryTripsData = groceryTrips.map((trip) => ({
    label: `${trip.name} - ${dayjs(trip.createdAt).format("MM/DD/YY")}`,
    value: trip.id.toString(),
  }))

  return (
    <Modal
      opened={true}
      onClose={() => onModalClose()}
      title={<Title order={3}>Add new item</Title>}
      closeOnClickOutside={false}
      transitionProps={{ transition: "fade", duration: 200, timingFunction: "ease" }}
    >
      <ItemForm
        submitText="Create Item"
        itemTypeData={ItemTypeGrouper(itemTypes)}
        groceryTripData={groceryTripsData}
        schema={CreateItemSchema.omit({
          userId: true,
          reminderSpanSeconds: true,
        })}
        initialValues={{
          groceryTripId: groceryTripIdDefault || groceryTripsData[0]?.value,
          itemTypes: [],
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
              reminderSpanSeconds: itemType?.suggested_life_span_seconds ?? -1,
            })

            await queueItemUpdates(item, itemType)

            onModalClose()
          } catch (error: any) {
            console.error(error)
            return {
              [FORM_ERROR]: error.toString(),
            }
          }
        }}
      />
    </Modal>
  )
}
