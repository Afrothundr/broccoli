import { useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { useMutation, usePaginatedQuery, useQuery } from "@blitzjs/rpc"
import {
  ActionIcon,
  Badge,
  Button,
  Container,
  Group,
  Modal,
  NumberInput,
  Select,
  Text,
  Tooltip,
} from "@mantine/core"
import { Item, ItemStatusType } from "@prisma/client"
import { IconShoppingCartPlus } from "@tabler/icons-react"
import { CronJob } from "cron"
import dayjs from "dayjs"
import router, { useRouter } from "next/router"
import { Suspense, useMemo, useState } from "react"
import BroccoliTable from "src/core/components/BroccoliTable"
import Layout from "src/core/layouts/Layout"
import { filterDates } from "src/core/utils"
import getGroceryTrips from "src/grocery-trips/queries/getGroceryTrips"
import getItemTypes from "src/item-types/queries/getItemTypes"
import { FORM_ERROR, ItemForm } from "src/items/components/ItemForm"
import createItem from "src/items/mutations/createItem"
import updateItem from "src/items/mutations/updateItem"
import getItems from "src/items/queries/getItems"
import { CreateItemSchema } from "src/items/schemas"
import styles from "src/styles/ActionItem.module.css"

export const ItemsList = () => {
  const router = useRouter()
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const page = Number(router.query.page) || 0
  const { userId } = useSession()
  const [{ items, hasMore }] = usePaginatedQuery(getItems, {
    where: {
      userId: userId ?? 0,
    },
    orderBy: { id: "asc" },
    skip: itemsPerPage * page,
    take: itemsPerPage,
  })

  const goToPreviousPage = () => router.push({ query: { page: page - 1 } })
  const goToNextPage = () => router.push({ query: { page: page + 1 } })
  const setPage = (pageNumber: number) => router.push({ query: { page: pageNumber } })

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
              <Badge variant="filled" key={itemType.name + row.original.id}>
                {itemType.name}
              </Badge>
            ))}
          </Group>
        ),
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => {
          return (
            <Badge variant="filled" color={row.original.status === "BAD" ? "red" : "green"}>
              {row.original.status}
            </Badge>
          )
        },
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
    <div>
      <BroccoliTable
        {...{
          data: items,
          columns,
        }}
      />
      <Group position="apart" mt="md">
        <Group>
          <Button variant="subtle" radius="xl" onClick={() => setPage(0)} disabled={page === 0}>
            {"<<"}
          </Button>
          <Button
            variant="subtle"
            radius="xl"
            onClick={() => goToPreviousPage()}
            disabled={page === 0}
          >
            {"<"}
          </Button>
          <Button variant="subtle" radius="xl" onClick={() => goToNextPage()} disabled={!hasMore}>
            {">"}
          </Button>
          <Button
            variant="subtle"
            radius="xl"
            // onClick={() => setPage(table.getPageCount() - 1)}
            disabled={!hasMore}
          >
            {">>"}
          </Button>
        </Group>
        <Group>
          <Text>
            Page <strong>{page + 1}</strong>
          </Text>

          <Text className="flex items-center gap-1">| Go to page:</Text>
          <NumberInput
            min={1}
            defaultValue={page + 1}
            onChange={(value) => {
              const page = value || 1
              return setPage(page - 1)
            }}
          />
        </Group>
        <Select
          placeholder={`${itemsPerPage} Items Per Page`}
          value={itemsPerPage.toString()}
          data={[10, 20, 30, 40, 50].map((pageSize) => ({
            label: `Show ${pageSize}`,
            value: pageSize.toString(),
          }))}
          onChange={(value) => {
            setItemsPerPage(Number(value))
          }}
        />
      </Group>
    </div>
  )
}

const ItemsPage = () => {
  const [modalOpened, setModalOpened] = useState(false)
  const [createItemMutation] = useMutation(createItem)
  const [{ itemTypes }] = useQuery(getItemTypes, {
    orderBy: { name: "asc" },
  })
  const [{ groceryTrips }] = useQuery(getGroceryTrips, {
    orderBy: { name: "desc" },
  })
  const { userId } = useSession()
  const [updateItemMutation] = useMutation(updateItem)

  const itemTypeData = itemTypes.map((item) => ({
    label: item.name,
    value: item.id.toString(),
  }))
  const groceryTripsData = groceryTrips.map((trip) => ({
    label: `${trip.name} - ${dayjs(trip.createdAt).format("MM/DD/YY")}`,
    value: trip.id.toString(),
  }))

  const createItemStatusUpdate = ({
    data,
    triggerTimeInSeconds,
  }: {
    triggerTimeInSeconds: number
    data: Item
  }) => {
    return new CronJob(
      dayjs().add(triggerTimeInSeconds, "seconds").toDate(),
      function () {
        updateItemStatusInDB(data).catch((err) => console.error(err))
      },
      () => console.log(`item ${data.id} updated`),
      true
    )
  }

  const updateItemStatusInDB = async (data) => {
    await updateItemMutation({
      ...data,
      status: "BAD",
    })
  }

  return (
    <>
      <Container size="lg">
        <Suspense fallback={<div>Loading...</div>}>
          <ItemsList />
        </Suspense>
        <Tooltip label="Add new item" openDelay={500}>
          <ActionIcon
            className={styles.actionButton}
            color="blue"
            size="xl"
            radius="xl"
            variant="filled"
            onClick={() => setModalOpened(true)}
          >
            <IconShoppingCartPlus />
          </ActionIcon>
        </Tooltip>
      </Container>
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title="Add new item"
        transitionProps={{ transition: "fade", duration: 200, timingFunction: "ease" }}
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
            groceryTripId: groceryTripsData[0]?.value,
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

              if (item && itemType) {
                const triggerTimeInSeconds = Number(itemType?.suggested_life_span_seconds)
                createItemStatusUpdate({
                  triggerTimeInSeconds,
                  data: { ...item, status: ItemStatusType.BAD },
                })
              }

              await router.push(Routes.ShowItemPage({ itemId: item.id }))
            } catch (error: any) {
              console.error(error)
              return {
                [FORM_ERROR]: error.toString(),
              }
            }
          }}
        />
      </Modal>
    </>
  )
}

ItemsPage.getLayout = (page) => <Layout title="Items">{page}</Layout>

ItemsPage.authenticate = { redirectTo: Routes.LoginPage() }
export default ItemsPage
