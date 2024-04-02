import { useMutation } from "@blitzjs/rpc"
import { Box, Modal, Title } from "@mantine/core"
import updateItem from "src/items/mutations/updateItem"
import { UpdateItemSchema } from "src/items/schemas"
import type { CombinedItemType } from "src/pages/items"
import { UpdateConsumedForm } from "./UpdateConsumedForm"

type UpdateConsumedModalProps = {
  onModalClose: () => void
  item?: CombinedItemType
  onSubmit?: (percentage: number) => void
}

export const UpdateConsumedModal = ({
  onModalClose,
  onSubmit,
  item,
}: UpdateConsumedModalProps): JSX.Element => {
  const [updateItemMutation] = useMutation(updateItem)

  return (
    <Modal
      opened={true}
      onClose={() => onModalClose()}
      title={<Title order={3}>How much did you eat?</Title>}
      closeOnClickOutside={false}
      transitionProps={{ transition: "fade", duration: 200, timingFunction: "ease" }}
    >
      <Box mt="lg">
        <UpdateConsumedForm
          submitText="Update!"
          initialValues={{
            percentConsumed: item?.percentConsumed,
          }}
          onSubmit={async (values) => {
            const formValues = UpdateItemSchema.pick({
              percentConsumed: true,
            }).parse(values)
            if (item) {
              try {
                await updateItemMutation({
                  ...item,
                  ...formValues,
                  itemTypes: item.itemTypes.map((item) => item.id.toString()),
                  groceryTripId: item.groceryTripId.toString(),
                })
                onModalClose()
              } catch (err) {
                console.error(err)
              }
            }
            if (onSubmit) {
              onSubmit(formValues.percentConsumed)
            }
          }}
        />
      </Box>
    </Modal>
  )
}
