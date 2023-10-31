import { Routes, useParam } from "@blitzjs/next"
import { useQuery } from "@blitzjs/rpc"
import Link from "next/link"
import { Suspense, useMemo, useState } from "react"

import {
  ActionIcon,
  Badge,
  Group,
  LoadingOverlay,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconPencil, IconShoppingCartPlus } from "@tabler/icons-react"
import dayjs from "dayjs"
import BroccoliTable from "src/core/components/BroccoliTable"
import { UploadDropzone } from "src/core/components/UploadThing"
import Layout from "src/core/layouts/Layout"
import { filterDates } from "src/core/utils"
import getGroceryTrip from "src/grocery-trips/queries/getGroceryTrip"
import styles from "src/styles/ActionItem.module.css"
import getItemStatusColor from "src/utils"
import { NewItemModal } from "../items/components/NewItemModal"

export const GroceryTrip = () => {
  const groceryTripId = useParam("groceryTripId", "number")
  const [groceryTrip, { refetch }] = useQuery(getGroceryTrip, { id: groceryTripId })
  const [modalOpened, setModalOpened] = useState(false)

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
      <Group>
        <Title order={1}>
          {dayjs(groceryTrip.createdAt).format("M/D")} - {groceryTrip.name}
        </Title>
        <Link href={Routes.EditGroceryTripPage({ groceryTripId: groceryTrip.id })}>
          <IconPencil />
        </Link>
      </Group>
      <Text c="dimmed" my="sm">
        {groceryTrip.description}
      </Text>
      <Stack sx={{ marginBottom: "3rem" }}>
        <Title order={2}>Receipts</Title>
        <UploadDropzone
          endpoint="imageUploader"
          onClientUploadComplete={(res) => {
            // Do something with the response
            console.log("Files: ", res)
            notifications.show({
              color: "green",
              title: "Success",
              message: "File uploaded!",
            })
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
      </Stack>
      <Stack>
        <Group position="apart">
          <Title order={2}>Items</Title>
          <Tooltip label="Add new item" openDelay={500}>
            <ActionIcon
              className={styles.paperActionButton}
              color="blue"
              size="xl"
              radius="xl"
              variant="filled"
              onClick={() => setModalOpened(true)}
            >
              <IconShoppingCartPlus />
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
