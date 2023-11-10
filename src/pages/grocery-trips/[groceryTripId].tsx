import { Routes, useParam } from "@blitzjs/next"
import { useMutation, useQuery } from "@blitzjs/rpc"
import Link from "next/link"
import { Suspense, useMemo, useState } from "react"

import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Group,
  Indicator,
  LoadingOverlay,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconPencil, IconPlus } from "@tabler/icons-react"
import dayjs from "dayjs"
import BroccoliTable from "src/core/components/BroccoliTable"
import { UploadButton } from "src/core/components/UploadThing"
import Layout from "src/core/layouts/Layout"
import { filterDates } from "src/core/utils"
import getGroceryTrip from "src/grocery-trips/queries/getGroceryTrip"
import bulkCreateReceipt from "src/receipts/mutations/bulkCreateReceipts"
import styles from "src/styles/ActionItem.module.css"
import getItemStatusColor from "src/utils"
import { NewItemModal } from "../../core/components/NewItemModal"

export const GroceryTrip = () => {
  const groceryTripId = useParam("groceryTripId", "number")
  const [groceryTrip, { refetch }] = useQuery(getGroceryTrip, { id: groceryTripId })
  const [modalOpened, setModalOpened] = useState(false)
  const [bulkReceiptMutation] = useMutation(bulkCreateReceipt)

  const columns = useMemo(
    () => [
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

  return (
    <Paper shadow="xs" p="xl">
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
              onClick={() => setModalOpened(true)}
            >
              <IconPlus />
            </ActionIcon>
          </Tooltip>
        </Group>
        <BroccoliTable
          {...{
            data: groceryTrip.items,
            columns,
          }}
        />
      </Stack>
      {modalOpened && (
        <Suspense fallback={<div>Loading...</div>}>
          <NewItemModal
            onModalClose={async () => {
              setModalOpened(false)
              await refetch()
            }}
            groceryTripIdDefault={groceryTripId?.toString()}
          />
        </Suspense>
      )}
    </Paper>
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
