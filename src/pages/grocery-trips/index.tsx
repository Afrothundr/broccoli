import { BlitzPage, useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { useMutation, usePaginatedQuery } from "@blitzjs/rpc"
import {
  ActionIcon,
  Container,
  Group,
  LoadingOverlay,
  Modal,
  NavLink,
  NumberFormatter,
  Text,
  Title,
  Tooltip,
} from "@mantine/core"
import { IconChevronRight, IconPlus } from "@tabler/icons-react"
import dayjs from "dayjs"
import { useRouter } from "next/router"
import { Suspense, useMemo, useState } from "react"
import { BroccoliFooter } from "src/core/components/BroccoliFooter"
import BroccoliTable from "src/core/components/BroccoliTable"
import Layout from "src/core/layouts/Layout"
import { filterDates } from "src/core/utils"
import { GroceryTripForm } from "src/grocery-trips/components/GroceryTripForm"
import createGroceryTrip from "src/grocery-trips/mutations/createGroceryTrip"
import getGroceryTrips from "src/grocery-trips/queries/getGroceryTrips"
import { CreateGroceryTripSchema } from "src/grocery-trips/schemas"

export const GroceryTripsList = () => {
  const router = useRouter()
  const { userId } = useSession()
  const [itemsPerPage, setItemsPerPage] = useState(100)
  const page = Number(router.query.page) || 0
  const [{ groceryTrips, hasMore, count }] = usePaginatedQuery(getGroceryTrips, {
    orderBy: { createdAt: "desc" },
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
        header: "Name",
        accessorKey: "name",
        cell: ({ row }) => (
          <NavLink
            label={row.original.name}
            description={row.original.description}
            rightSection={<IconChevronRight size="1rem" stroke={1.5} />}
            onClick={() =>
              router.push(
                Routes.ShowGroceryTripPage({
                  groceryTripId: row.original.id,
                })
              )
            }
          />
        ),
      },
      {
        header: "Date",
        accessorKey: "createdAt",
        cell: (value) => dayjs(value.getValue()).format("MM/D"),
        filterFn: filterDates,
      },
      {
        header: "Items",
        accessorKey: "_count.items",
      },
      {
        header: "Total Cost",
        cell: ({ row }) => {
          const totalCost = row.original.items.reduce((total, item) => total + item.price, 0)
          return (
            <Text>
              <NumberFormatter prefix="$ " value={totalCost.toFixed(2)} thousandSeparator />
            </Text>
          )
        },
      },
    ],
    [router]
  )

  return (
    <div>
      {groceryTrips.length > 0 ? (
        <>
          <BroccoliTable
            {...{
              data: groceryTrips,
              columns,
            }}
          />
          <BroccoliFooter
            {...{
              goToNextPage,
              goToPreviousPage,
              hasMore,
              itemsPerPage,
              page,
              setItemsPerPage,
              setPage,
              totalCount: count,
            }}
          />
        </>
      ) : (
        <Text>Create a grocery trip to get started!</Text>
      )}
    </div>
  )
}

const GroceryTripsPage: BlitzPage = () => {
  const [modalOpened, setModalOpened] = useState(false)
  const { userId } = useSession()
  const [createGroceryTripMutation] = useMutation(createGroceryTrip)
  const router = useRouter()

  return (
    <>
      <Container size="lg">
        <Group mb={"md"}>
          <Title order={1}>Grocery Trips</Title>
          <Tooltip label="Add new grocery trip" openDelay={500}>
            <ActionIcon
              color="green"
              variant="filled"
              onClick={() => setModalOpened(true)}
              size="l"
              radius="xl"
            >
              <IconPlus />
            </ActionIcon>
          </Tooltip>
        </Group>
        <Suspense fallback={<LoadingOverlay />}>
          <GroceryTripsList />
        </Suspense>
      </Container>
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        closeOnClickOutside={false}
        title="Create New Grocery Trip"
        transitionProps={{ transition: "fade", duration: 200, timingFunction: "ease" }}
      >
        <GroceryTripForm
          submitText="save"
          onSubmit={async (values) => {
            const formValues = CreateGroceryTripSchema.omit({ userId: true }).parse(values)
            try {
              const groceryTrip = await createGroceryTripMutation({
                ...formValues,
                userId: userId ?? 0,
              })
              await router.push(Routes.ShowGroceryTripPage({ groceryTripId: groceryTrip.id }))
            } catch (error: any) {
              console.error(error)
            }
          }}
        />
      </Modal>
    </>
  )
}

GroceryTripsPage.getLayout = (page) => <Layout title="Grocery Trips">{page}</Layout>

export default GroceryTripsPage
