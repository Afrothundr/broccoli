import { BlitzPage, useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { useMutation, usePaginatedQuery } from "@blitzjs/rpc"
import {
  ActionIcon,
  Anchor,
  Button,
  Container,
  Group,
  Modal,
  NumberInput,
  Select,
  Text,
  Tooltip,
} from "@mantine/core"
import { IconShoppingCartPlus } from "@tabler/icons-react"
import dayjs from "dayjs"
import { FORM_ERROR } from "final-form"
import Link from "next/link"
import router, { useRouter } from "next/router"
import { Suspense, useMemo, useState } from "react"
import BroccoliTable from "src/core/components/BroccoliTable"
import Layout from "src/core/layouts/Layout"
import { filterDates } from "src/core/utils"
import { GroceryTripForm } from "src/grocery-trips/components/GroceryTripForm"
import createGroceryTrip from "src/grocery-trips/mutations/createGroceryTrip"
import getGroceryTrips from "src/grocery-trips/queries/getGroceryTrips"
import { CreateGroceryTripSchema } from "src/grocery-trips/schemas"
import styles from "src/styles/GroceryTripsPage.module.css"

export const GroceryTripsList = () => {
  const router = useRouter()
  const { userId } = useSession()
  const [itemsPerPage, setItemsPerPage] = useState(100)
  const page = Number(router.query.page) || 0
  const [{ groceryTrips, hasMore }] = usePaginatedQuery(getGroceryTrips, {
    orderBy: { id: "asc" },
    where: {
      userId: userId ?? undefined,
    },
    skip: itemsPerPage * page,
    take: itemsPerPage,
  })

  const goToPreviousPage = () => router.push({ query: { page: page - 1 } })
  const goToNextPage = () => router.push({ query: { page: page + 1 } })
  const setPage = (pageNumber: number) => router.push({ query: { page: pageNumber } })

  const columns = useMemo(
    () => [
      {
        header: "Date",
        accessorKey: "createdAt",
        cell: (value) => dayjs(value.getValue()).format("MM/D"),
        filterFn: filterDates,
      },
      {
        header: "Name",
        accessorKey: "name",
        cell: ({ row }) => (
          <Link
            href={Routes.ShowGroceryTripPage({
              groceryTripId: row.original.id,
            })}
          >
            <Anchor>{row.original.name}</Anchor>
          </Link>
        ),
      },
      {
        header: "Description",
        accessorKey: "description",
      },
      {
        header: "Items",
        accessorKey: "_count.items",
      },
    ],
    []
  )

  return (
    <div>
      <BroccoliTable
        {...{
          data: groceryTrips,
          columns,
        }}
      />
      <Group mt="sm" position="center">
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
      <Group position="right">
        <Text>
          Page <strong>{page + 1}</strong>
        </Text>

        <Text className="flex items-center gap-1">| Go to page:</Text>
        <NumberInput
          defaultValue={page + 1}
          onChange={(value) => {
            const page = value || 0
            return setPage(page)
          }}
        />
      </Group>
      <Group position="right" mt="sm">
        <Select
          value={itemsPerPage.toString()}
          placeholder={itemsPerPage.toString()}
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

const GroceryTripsPage: BlitzPage = () => {
  const [modalOpened, setModalOpened] = useState(false)
  const { userId } = useSession()
  const [createGroceryTripMutation] = useMutation(createGroceryTrip)

  return (
    <>
      <Container size="lg" className={styles.groceryTripsContainer}>
        <Suspense fallback={<div>Loading...</div>}>
          <GroceryTripsList />
        </Suspense>
        <Tooltip label="Add new grocery trip" openDelay={500}>
          <ActionIcon
            className={styles.actionButton}
            color="green"
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
        title="Create New Grocery Trip"
        transitionProps={{ transition: "fade", duration: 200, timingFunction: "ease" }}
      >
        <GroceryTripForm
          submitText="save"
          schema={CreateGroceryTripSchema.omit({ userId: true })}
          onSubmit={async (values) => {
            try {
              const groceryTrip = await createGroceryTripMutation({
                ...values,
                userId: userId ?? 0,
              })
              await router.push(Routes.ShowGroceryTripPage({ groceryTripId: groceryTrip.id }))
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

GroceryTripsPage.getLayout = (page) => <Layout title="Grocery Trips">{page}</Layout>

export default GroceryTripsPage
