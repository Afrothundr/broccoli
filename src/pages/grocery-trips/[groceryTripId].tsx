import { Routes, useParam } from "@blitzjs/next"
import { useMutation, useQuery } from "@blitzjs/rpc"
import Link from "next/link"
import { Suspense, useEffect, useMemo, useState } from "react"

import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Checkbox,
  Container,
  Group,
  Indicator,
  LoadingOverlay,
  Menu,
  NumberFormatter,
  Stack,
  Text,
  Title,
  Tooltip,
  rem,
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { ItemStatusType, type Receipt, ReceiptStatus } from "@prisma/client"
import {
  IconDotsVertical,
  IconPaperBag,
  IconPencil,
  IconPlus,
  IconSkull,
  IconToolsKitchen2,
  IconTrash,
} from "@tabler/icons-react"
import dayjs from "dayjs"
import pRetry from "p-retry"
import BroccoliTable from "src/core/components/BroccoliTable"
import { ConfirmationModal } from "src/core/components/ConfirmationModal"
import { ImageUpload } from "src/core/components/ImageUpload"
import { ItemStatusBadge } from "src/core/components/ItemStatusBadge"
import { ReceiptImportModal } from "src/core/components/ReceiptImportModal"
import { UpdateConsumedModal } from "src/core/components/UpdateConsumedModal"
import { UpdateItemModal } from "src/core/components/UpdateItemModal"
import Layout from "src/core/layouts/Layout"
import getGroceryTrip from "src/grocery-trips/queries/getGroceryTrip"
import deleteItems from "src/items/mutations/deleteItems"
import updatePercentage from "src/items/mutations/updatePercentage"
import updateStatus from "src/items/mutations/updateStatus"
import styles from "src/styles/ActionItem.module.css"
import { getReceiptStatusColor } from "src/utils/receiptStatusTypeHelper"
import { NewItemModal } from "../../core/components/NewItemModal"
export const GroceryTrip = () => {
  const groceryTripId = useParam("groceryTripId", "number")
  const [groceryTrip, { refetch }] = useQuery(getGroceryTrip, { id: groceryTripId })
  const [newItemModalOpen, setNewItemModalOpen] = useState(false)
  const [editItemModalOpen, setEditItemModalOpen] = useState(false)
  const [percentageEatenModalOpen, setPercentageEatenModalOpen] = useState(false)
  const [itemToUpdate, setItemToUpdate] = useState()
  const [receiptToImport, setReceiptToImport] = useState(0)
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState({})
  const [deleteItemsMutation] = useMutation(deleteItems)
  const [updatePercentages] = useMutation(updatePercentage)
  const [updateStatuses] = useMutation(updateStatus)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)

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
        header: "Cost",
        accessorKey: "price",
        cell: ({ row }) => (
          <Text>
            <NumberFormatter prefix="$ " value={row.original.price} thousandSeparator />
          </Text>
        ),
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
              <Badge variant="light" color="gray" key={itemType.name + row.original.id}>
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
          <ItemStatusBadge
            status={row.original.status}
            percentConsumed={row.original.percentConsumed}
          />
        ),
      },
      {
        id: "action",
        cell: ({ row }) => (
          <ActionsMenu
            onEditClick={() => {
              setItemToUpdate(row.original)
              setEditItemModalOpen(true)
            }}
          />
        ),
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

  const handleItemsStatusChange = async (status: ItemStatusType) => {
    const indexesToUpdate = Object.keys(rowSelection)
    const itemsToUpdate = indexesToUpdate.map((index) => groceryTrip.items[index].id)
    await updateStatuses({ ids: itemsToUpdate, status })
    await refetch()
    setRowSelection({})
  }

  const handleItemPercentageUpdate = async (percentage: number) => {
    const indexesToUpdate = Object.keys(rowSelection)
    const itemsToUpdate = indexesToUpdate.map((index) => groceryTrip.items[index].id)
    await updatePercentages({ ids: itemsToUpdate, percentConsumed: percentage })
    await refetch()
    setRowSelection({})
    setPercentageEatenModalOpen(false)
  }

  const checkReceiptStatus = async () => {
    const data = await refetch()
    if (data?.data?.receipts?.some((receipt) => receipt.status === "PROCESSING")) {
      throw new Error("Not ready")
    }
    return data
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const checkForWaitingImages = async () => {
      if (groceryTrip.receipts.some((receipt) => receipt.status === ReceiptStatus.PROCESSING)) {
        await pRetry(checkReceiptStatus, { factor: 3 })
      }
    }
    void checkForWaitingImages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalCost = groceryTrip?.items?.reduce((total, item) => total + item.price, 0) || 0

  const getImportedCount = (receipt: Receipt): number => {
    const parsed = JSON.parse(receipt.scrapedData as string)
    if (parsed && "items" in parsed) {
      return parsed?.items?.length || 0
    }
    return 0
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
        <Text
          variant="gradient"
          gradient={{ from: "green", to: "teal" }}
          fw={900}
          ta="center"
          style={{ fontSize: "3rem" }}
        >
          <NumberFormatter prefix="$" value={totalCost.toFixed(2)} />
        </Text>
      </Group>
      <Group mb="lg">
        <Text c="dimmed">{groceryTrip.description}</Text> -
        <Text c="dimmed">{dayjs(groceryTrip.createdAt).format("MM/DD")}</Text>
      </Group>
      <Stack style={{ marginBottom: "3rem", alignItems: "flex-start" }}>
        <Group align="start">
          <Title order={2}>Receipts</Title>
          <ImageUpload {...{ refetch, groceryTripId: groceryTrip.id, checkReceiptStatus }} />
        </Group>
        <Group gap="lg">
          {groceryTrip.receipts.map((receipt) => (
            <button
              type="button"
              key={receipt.id}
              onClick={() => {
                setReceiptToImport(receipt.id)
                setReceiptModalOpen(!receiptModalOpen)
              }}
              style={{ backgroundColor: "transparent", border: "none", cursor: "pointer" }}
            >
              <Tooltip
                label={
                  receipt.status === ReceiptStatus.IMPORTED
                    ? `${getImportedCount(receipt)} results`
                    : receipt.status.toLocaleLowerCase()
                }
              >
                <Indicator
                  size={16}
                  color={getReceiptStatusColor(receipt.status)}
                  key={receipt.id}
                  offset={5}
                  processing={receipt.status === ReceiptStatus.PROCESSING}
                  label={
                    receipt.status === ReceiptStatus.IMPORTED
                      ? `${getImportedCount(receipt)} results`
                      : undefined
                  }
                  onClick={() => {
                    setReceiptToImport(receipt.id)
                    setReceiptModalOpen(!receiptModalOpen)
                  }}
                >
                  <Avatar size="lg" src={receipt.url} />
                </Indicator>
              </Tooltip>
            </button>
          ))}
        </Group>
      </Stack>
      <Stack>
        <Group>
          <Title order={2}>Items</Title>
          {Object.values(rowSelection).length > 0 ? (
            <Menu>
              <Menu.Target>
                <Button variant="filled" radius="lg">
                  Update {Object.values(rowSelection).length} item(s)
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconToolsKitchen2 style={{ width: rem(14), height: rem(14) }} />}
                  color="green"
                  onClick={() => handleItemsStatusChange(ItemStatusType.EATEN)}
                >
                  I ate all of this!
                </Menu.Item>
                <Menu.Item
                  onClick={() => {
                    setPercentageEatenModalOpen(true)
                  }}
                  leftSection={<IconPaperBag style={{ width: rem(14), height: rem(14) }} />}
                >
                  I ate some of this.
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconTrash style={{ width: rem(14), height: rem(14) }} />}
                  color="red"
                  onClick={() => handleItemsStatusChange(ItemStatusType.DISCARDED)}
                >
                  I tossed this...
                </Menu.Item>
                <Menu.Label>Danger zone</Menu.Label>
                <Menu.Item
                  color="red"
                  leftSection={<IconSkull style={{ width: rem(14), height: rem(14) }} />}
                  onClick={() => setConfirmationModalOpen(true)}
                >
                  Delete {Object.values(rowSelection).length} item(s)
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
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
          )}
        </Group>
        {groceryTrip.items.length > 0 ? (
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
        ) : (
          <Text>Add some receipts or items to get started!</Text>
        )}
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
      {editItemModalOpen && itemToUpdate && (
        <Suspense fallback={<div>Loading...</div>}>
          <UpdateItemModal
            onModalClose={async () => {
              setEditItemModalOpen(false)
              await refetch()
            }}
            item={itemToUpdate}
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
      {percentageEatenModalOpen && (
        <UpdateConsumedModal
          onModalClose={async () => {
            setPercentageEatenModalOpen(false)
          }}
          onSubmit={(percentage) => handleItemPercentageUpdate(percentage)}
        />
      )}
      {receiptModalOpen && (
        <ReceiptImportModal
          id={receiptToImport}
          onModalClose={async () => {
            await refetch()
            setReceiptModalOpen(false)
          }}
        />
      )}
    </Container>
  )
}

const ActionsMenu = ({ onEditClick }: { onEditClick: () => void }) => {
  return (
    <Menu>
      <Menu.Target>
        <Button variant="transparent" color="gray">
          <IconDotsVertical />
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item onClick={onEditClick}>Edit</Menu.Item>
      </Menu.Dropdown>
    </Menu>
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
