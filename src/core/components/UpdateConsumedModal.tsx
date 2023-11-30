import { useMutation } from "@blitzjs/rpc"
import { Box, Modal, Title } from "@mantine/core"
import { FORM_ERROR } from "final-form"
import updateItem from "src/items/mutations/updateItem"
import { UpdateItemSchema } from "src/items/schemas"
import { CombinedItemType } from "src/pages/items"
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
          schema={UpdateItemSchema.pick({
            percentConsumed: true,
          })}
          initialValues={{
            percentConsumed: item?.percentConsumed,
          }}
          onSubmit={async (values) => {
            if (item) {
              try {
                await updateItemMutation({
                  ...item,
                  ...values,
                  itemTypes: item.itemTypes.map((item) => item.id.toString()),
                  groceryTripId: item.groceryTripId.toString(),
                })
                onModalClose()
              } catch (error: any) {
                console.error(error)
                return {
                  [FORM_ERROR]: error.toString(),
                }
              }
            }
            if (onSubmit) {
              onSubmit(values.percentConsumed)
            }
          }}
        />
      </Box>
    </Modal>
  )
}
