import { useSession } from "@blitzjs/auth"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { Modal } from "@mantine/core"
import dayjs from "dayjs"
import { FORM_ERROR } from "final-form"
import getGroceryTrips from "src/grocery-trips/queries/getGroceryTrips"
import useItemTypes from "src/items/hooks/useItemTypes"
import updateItem from "src/items/mutations/updateItem"
import { UpdateItemSchema } from "src/items/schemas"
import { CombinedItemType } from "src/pages/items"
import { ItemTypeGrouper } from "../utils/ItemTypeGrouper"
import { ItemForm } from "./ItemForm"

type UpdateItemModalProps = {
  onModalClose: () => void
  item: CombinedItemType
}

export const UpdateItemModal = ({ onModalClose, item }: UpdateItemModalProps): JSX.Element => {
  const { userId } = useSession()
  const itemTypes = useItemTypes()

  const [{ groceryTrips }] = useQuery(getGroceryTrips, {
    orderBy: { name: "desc" },
    where: { userId: userId ?? 0 },
  })
  const [updateItemMutation] = useMutation(updateItem)

  const groceryTripsData = groceryTrips.map((trip) => ({
    label: `${trip.name} - ${dayjs(trip.createdAt).format("MM/DD/YY")}`,
    value: trip.id.toString(),
  }))

  return (
    <Modal
      opened={true}
      onClose={() => onModalClose()}
      title={"Update item"}
      closeOnClickOutside={false}
      transitionProps={{ transition: "fade", duration: 200, timingFunction: "ease" }}
    >
      <ItemForm
        submitText="Update Item"
        itemTypeData={ItemTypeGrouper(itemTypes)}
        groceryTripData={groceryTripsData}
        schema={UpdateItemSchema}
        initialValues={{
          ...item,
          groceryTripId: item.groceryTripId.toString(),
          itemTypes: item.itemTypes.map((type) => type.id.toString()),
        }}
        onSubmit={async (values) => {
          try {
            await updateItemMutation({
              ...values,
            })
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
