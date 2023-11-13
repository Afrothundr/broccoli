import { Routes, useParam } from "@blitzjs/next"
import { useMutation, useQuery } from "@blitzjs/rpc"
import Link from "next/link"
import { Suspense, useMemo, useState } from "react"

import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  Container,
  Group,
  Indicator,
  LoadingOverlay,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconPencil, IconPlus } from "@tabler/icons-react"
import dayjs from "dayjs"
import BroccoliTable from "src/core/components/BroccoliTable"
import { ConfirmationModal } from "src/core/components/ConfirmationModal"
import { UploadButton } from "src/core/components/UploadThing"
import Layout from "src/core/layouts/Layout"
import { filterDates } from "src/core/utils"
import getGroceryTrip from "src/grocery-trips/queries/getGroceryTrip"
import deleteItems from "src/items/mutations/deleteItems"
import bulkCreateReceipt from "src/receipts/mutations/bulkCreateReceipts"
import styles from "src/styles/ActionItem.module.css"
import getItemStatusColor from "src/utils"
import { NewItemModal } from "../../core/components/NewItemModal"

export const GroceryTrip = () => {
  const groceryTripId = useParam("groceryTripId", "number")
  const [groceryTrip, { refetch }] = useQuery(getGroceryTrip, { id: groceryTripId })
  const [newItemModalOpen, setNewItemModalOpen] = useState(false)
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false)
  const [bulkReceiptMutation] = useMutation(bulkCreateReceipt)
  const [rowSelection, setRowSelection] = useState({})
  const [deleteItemsMutation] = useMutation(deleteItems)

  const columns = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            {...{
              checked: table.getIsAllRowsSelected(),
              indeterminate: table.getIsSomeRowsSelected(),
              onChange: table.getToggleAllRowsSelectedHandler(),
            }}
          />
        ),
        cell: ({ row }) => (
          <div className="px-1">
            <Checkbox
              {...{
                checked: row.getIsSelected(),
                disabled: !row.getCanSelect(),
                indeterminate: row.getIsSomeSelected(),
                onChange: row.getToggleSelectedHandler(),
              }}
            />
          </div>
        ),
      },
      {
        header: "Name",
        accessorKey: "name",
      },
      {
        header: "How Much",
        accessorKey: "quantity",
      },
      {
        header: "Type",
        accessorKey: "itemTypes",
        cell: ({ row }) => (
          <Group>
            {row.original.itemTypes.map((itemType) => (
              <Badge variant="light" key={itemType.name + row.original.id}>
                {itemType.name}
              </Badge>
            ))}
          </Group>
        ),
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => (
          <Badge variant="filled" color={getItemStatusColor(row.original.status)}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        header: "Date Purchased",
        accessorKey: "createdAt",
        cell: (value) => dayjs(value.getValue()).format("MM/D"),
        filterFn: filterDates,
      },
    ],
    []
  )

  const handleItemDeletion = async () => {
    const indexesToDelete = Object.keys(rowSelection)
    const itemsToDelete = indexesToDelete.map((index) => groceryTrip.items[index].id)
    await deleteItemsMutation({ ids: itemsToDelete })
    await refetch()
    setRowSelection({})
    notifications.show({
      color: "green",
      title: "Success!",
      message: `You just deleted ${itemsToDelete.length} items`,
    })
    setConfirmationModalOpen(false)
  }

  return (
    <Container size="lg">
      <Group justify="space-between">
        <Group>
          <Title order={1}>{groceryTrip.name}</Title>
          <Link href={Routes.EditGroceryTripPage({ groceryTripId: groceryTrip.id })}>
            <IconPencil />
          </Link>
        </Group>
        <Text c="dimmed">{dayjs(groceryTrip.createdAt).format("MM/DD")}</Text>
      </Group>
      <Text c="dimmed" my="lg">
        {groceryTrip.description}
      </Text>
      <Stack style={{ marginBottom: "3rem", alignItems: "flex-start" }}>
        <Title order={2}>Receipts</Title>
        <Group gap="lg">
          {groceryTrip.receipts.map((receipt) => (
            <Indicator inline label="New" size={16} key={receipt.id}>
              <Avatar size="lg" src={receipt.url} />
            </Indicator>
          ))}
          <Box ml="md">
            <UploadButton
              endpoint="imageUploader"
              content={{
                button: (
                  <>
                    <IconPlus />
                    Add new
                  </>
                ),
              }}
              onClientUploadComplete={async (res) => {
                // Do something with the response
                console.log("Files: ", res)
                await bulkReceiptMutation(
                  res?.map((image) => ({
                    url: image.url,
                    groceryTripId: groceryTrip.id,
                  }))
                )
                notifications.show({
                  color: "green",
                  title: "Success",
                  message: "File uploaded!",
                })
                await refetch()
              }}
              onUploadError={(error: Error) => {
                console.log("ERROR", error)
                notifications.show({
                  color: "red",
                  title: "Error",
                  message: error.message,
                })
              }}
            />
          </Box>
        </Group>
      </Stack>
      <Stack>
        <Group>
          <Title order={2}>Items</Title>
          <Tooltip label="Add new item" openDelay={500}>
            <ActionIcon
              className={styles.paperActionButton}
              color="blue"
              size="l"
              radius="xl"
              variant="filled"
              onClick={() => setNewItemModalOpen(true)}
            >
              <IconPlus />
            </ActionIcon>
          </Tooltip>
          {Object.values(rowSelection).length > 0 && (
            <Button onClick={() => setConfirmationModalOpen(true)}>
              Delete {Object.values(rowSelection).length} item(s)
            </Button>
          )}
        </Group>
        <BroccoliTable
          {...{
            data: groceryTrip.items,
            columns,
            rowSelection,
            handleRowSelection: (e) => {
              setRowSelection(e)
            },
          }}
        />
      </Stack>
      {newItemModalOpen && (
        <Suspense fallback={<div>Loading...</div>}>
          <NewItemModal
            onModalClose={async () => {
              setNewItemModalOpen(false)
              await refetch()
            }}
            groceryTripIdDefault={groceryTripId?.toString()}
          />
        </Suspense>
      )}
      {confirmationModalOpen && (
        <ConfirmationModal
          onModalClose={() => setConfirmationModalOpen(false)}
          onConfirmation={handleItemDeletion}
          title="Confirm deletion"
          copy={`Are you sure you want to delete ${Object.values(rowSelection).length} item(s)`}
        />
      )}
    </Container>
  )
}

const ShowGroceryTripPage = () => {
  return (
    <Suspense fallback={<LoadingOverlay visible={true} />}>
      <GroceryTrip />
    </Suspense>
  )
}

ShowGroceryTripPage.authenticate = true
ShowGroceryTripPage.getLayout = (page) => <Layout>{page}</Layout>

export default ShowGroceryTripPage
