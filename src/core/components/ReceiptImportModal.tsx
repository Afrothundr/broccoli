import { useSession } from "@blitzjs/auth"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { Box, Button, Group, Modal, Progress, Stack, Tooltip } from "@mantine/core"
import { IconCheck, IconCircleArrowLeft, IconCircleArrowRight } from "@tabler/icons-react"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import getGroceryTrip from "src/grocery-trips/queries/getGroceryTrip"
import useItemTypes from "src/items/hooks/useItemTypes"
import createItem from "src/items/mutations/createItem"
import updateItem from "src/items/mutations/updateItem"
import { UpdateItemSchema } from "src/items/schemas"
import { CombinedItemType } from "src/pages/items"
import updateReceipt from "src/receipts/mutations/updateReceipt"
import getReceipt from "src/receipts/queries/getReceipt"
import { ItemTypeGrouper } from "../utils/ItemTypeGrouper"
import { queueItemUpdates } from "../utils/QueueItemUpdates"
import { FORM_ERROR, ItemForm } from "./ItemForm"

type ReceiptImportModalProps = {
  onModalClose: () => void
  id?: number
}

type NewItemProps = {
  description?: string | undefined
  unit?: string | undefined
  name: string
  itemTypes: string[]
  groceryTripId: string
  price: number
  quantity: number
}

type UpdateItemProps = {
  importId?: string | undefined
  unit: string
  id: number
  status: "BAD" | "OLD" | "FRESH" | "EATEN" | "DISCARDED"
  name: string
  itemTypes: string[]
  groceryTripId: string
  description: string
  price: number
  quantity: number
  percentConsumed: number
}

type ImportedItemProps = {
  name?: string
  price?: number
  quantity?: number
  importId: string
  unit?: string
  itemTypes?: {
    id: number
    name: string
  }[]
}

export const ReceiptImportModal = ({ onModalClose, id }: ReceiptImportModalProps): JSX.Element => {
  const { userId } = useSession()
  const [receipt, { refetch }] = useQuery(getReceipt, { id })
  const [updateReceiptMutation] = useMutation(updateReceipt)
  const [groceryTrip] = useQuery(getGroceryTrip, {
    id: receipt.groceryTripId ?? 0,
  })
  const groceryTripsData = {
    label: `${groceryTrip.name} - ${dayjs(groceryTrip.createdAt).format("MM/DD/YY")}`,
    value: groceryTrip.id.toString(),
  }
  const [createItemMutation] = useMutation(createItem)
  const [updateItemMutation] = useMutation(updateItem)
  const [importedData, setImportedData] = useState<(CombinedItemType | ImportedItemProps)[]>([])
  const [itemIndex, setItemIndex] = useState(0)
  const itemTypes = useItemTypes()

  const nextStep = () => {
    const nextIndex = itemIndex + 1
    if (nextIndex <= importedData.length - 1) {
      setItemIndex(nextIndex)
    } else {
      onModalClose()
    }
  }
  const prevStep = () => {
    const previousIndex = itemIndex - 1
    if (itemIndex !== 0) {
      setItemIndex(previousIndex)
    }
  }

  useEffect(() => {
    const scrapedData = JSON.parse(receipt.scrapedData as string)
    if ("items" in scrapedData) {
      const mergedData = (scrapedData.items as ImportedItemProps[]).map((data) => {
        const foundSubmittedItem = receipt?.items.find((item) => item.importId === data?.importId)
        return foundSubmittedItem ? foundSubmittedItem : data
      })
      setImportedData(mergedData)
    }
  }, [receipt])

  const activeItem = importedData[itemIndex]

  const isItemSaved = !!receipt?.items.find((item) => item.importId === activeItem?.importId)

  const handleNewItemSave = async (values: NewItemProps) => {
    try {
      const itemType = itemTypes.find((item) => item.id == parseInt(values.itemTypes[0] || ""))
      const item = await createItemMutation({
        ...values,
        groceryTripId: values.groceryTripId,
        userId: userId || 0,
        reminderSpanSeconds: itemType?.suggested_life_span_seconds ?? -1,
      })
      await updateReceiptMutation({
        id: receipt.id,
        itemId: item.id,
      })
      await queueItemUpdates(item, itemType)
      await refetch()
      nextStep()
    } catch (error: any) {
      console.error(error)
      return {
        [FORM_ERROR]: error.toString(),
      }
    }
  }

  const handleItemUpdate = async (values: UpdateItemProps) => {
    try {
      await updateItemMutation({
        ...values,
      })
      await refetch()
      nextStep()
    } catch (error: any) {
      console.error(error)
      return {
        [FORM_ERROR]: error.toString(),
      }
    }
  }

  return (
    <Modal.Root
      opened={true}
      onClose={onModalClose}
      fullScreen
      radius={0}
      transitionProps={{ transition: "fade", duration: 200 }}
    >
      <Modal.Overlay />
      <Modal.Content>
        <Modal.Header style={{ display: "block" }}>
          <Progress.Root size={20} w={"100%"}>
            <Tooltip label={`${itemIndex + 1} of ${importedData.length}`}>
              <Progress.Section value={((itemIndex + 1) / importedData.length) * 100}>
                <Progress.Label>{`${itemIndex + 1} of ${importedData.length}`}</Progress.Label>
              </Progress.Section>
            </Tooltip>
          </Progress.Root>
          <Group justify="space-between" mt="lg">
            <Group>
              <Modal.CloseButton ml={0} />
              <Modal.Title>Import items from receipt</Modal.Title>
            </Group>
            <Group>
              <Button leftSection={<IconCircleArrowLeft />} variant="default" onClick={prevStep}>
                Back
              </Button>
              {itemIndex + 1 === importedData.length ? (
                <Button onClick={() => onModalClose()} rightSection={<IconCheck />}>
                  Finish
                </Button>
              ) : (
                <Button onClick={nextStep} rightSection={<IconCircleArrowRight />}>
                  Next item
                </Button>
              )}
            </Group>
          </Group>
        </Modal.Header>
        <Modal.Body>
          <Box mt="lg" h={"100%"}>
            <Stack justify="space-between">
              <Group justify="center">
                <ItemForm
                  onSubmit={isItemSaved ? handleItemUpdate : handleNewItemSave}
                  submitText={isItemSaved ? "Update Item" : "Save Item"}
                  itemTypeData={ItemTypeGrouper(itemTypes)}
                  groceryTripData={[groceryTripsData]}
                  schema={UpdateItemSchema}
                  initialValues={{
                    ...activeItem,
                    importId: activeItem?.importId || "",
                    groceryTripId: receipt.groceryTripId?.toString(),
                    itemTypes: activeItem?.itemTypes?.map((type) => type.id.toString()) ?? [],
                  }}
                />
              </Group>
            </Stack>
          </Box>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  )
}
