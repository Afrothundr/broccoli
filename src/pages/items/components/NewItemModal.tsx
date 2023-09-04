import { useSession } from "@blitzjs/auth"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { Modal, Title, useMantineTheme } from "@mantine/core"
import dayjs from "dayjs"
import { FORM_ERROR } from "final-form"
import getGroceryTrips from "src/grocery-trips/queries/getGroceryTrips"
import getItemTypes from "src/item-types/queries/getItemTypes"
import createItem from "src/items/mutations/createItem"
import { CreateItemSchema } from "src/items/schemas"
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
  const [{ itemTypes }] = useQuery(getItemTypes, {
    orderBy: { name: "asc" },
  })
  const [{ groceryTrips }] = useQuery(getGroceryTrips, {
    orderBy: { name: "desc" },
  })
  const [createItemMutation] = useMutation(createItem)

  const itemTypeData = itemTypes.map((type) => ({
    label: type.name,
    value: type.id.toString(),
    group: type.category,
  }))
  const groceryTripsData = groceryTrips.map((trip) => ({
    label: `${trip.name} - ${dayjs(trip.createdAt).format("MM/DD/YY")}`,
    value: trip.id.toString(),
  }))
  const theme = useMantineTheme()

  return (
    <Modal
      opened={true}
      onClose={() => onModalClose()}
      title={<Title order={2}>Add new item</Title>}
      closeOnClickOutside={false}
      transitionProps={{ transition: "fade", duration: 200, timingFunction: "ease" }}
      overlayProps={{
        color: theme.colorScheme === "dark" ? theme.colors.dark[9] : theme.colors.gray[2],
        opacity: 0.55,
        blur: 3,
      }}
    >
      <ItemForm
        submitText="Create Item"
        itemTypeData={itemTypeData}
        groceryTripData={groceryTripsData}
        schema={CreateItemSchema.omit({
          userId: true,
          reminderSpanSeconds: true,
        })}
        initialValues={{
          groceryTripId: groceryTripIdDefault || groceryTripsData[0]?.value,
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
