import { BlitzPage, useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { useMutation, usePaginatedQuery } from "@blitzjs/rpc"
import {
  ActionIcon,
  Anchor,
  Container,
  Modal,
  Title,
  Tooltip,
  useMantineTheme,
} from "@mantine/core"
import { IconShoppingCartPlus } from "@tabler/icons-react"
import dayjs from "dayjs"
import { FORM_ERROR } from "final-form"
import router, { useRouter } from "next/router"
import { Suspense, useMemo, useState } from "react"
import { BroccoliFooter } from "src/core/components/BroccoliFooter"
import BroccoliTable from "src/core/components/BroccoliTable"
import Layout from "src/core/layouts/Layout"
import { filterDates } from "src/core/utils"
import { GroceryTripForm } from "src/grocery-trips/components/GroceryTripForm"
import createGroceryTrip from "src/grocery-trips/mutations/createGroceryTrip"
import getGroceryTrips from "src/grocery-trips/queries/getGroceryTrips"
import { CreateGroceryTripSchema } from "src/grocery-trips/schemas"
import actionStyles from "src/styles/ActionItem.module.css"
import styles from "src/styles/GroceryTripsPage.module.css"

export const GroceryTripsList = () => {
  const router = useRouter()
  const { userId } = useSession()
  const [itemsPerPage, setItemsPerPage] = useState(100)
  const page = Number(router.query.page) || 0
  const [{ groceryTrips, hasMore, count }] = usePaginatedQuery(getGroceryTrips, {
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
          <Anchor
            onClick={() =>
              router.push(
                Routes.ShowGroceryTripPage({
                  groceryTripId: row.original.id,
                })
              )
            }
          >
            {row.original.name}
          </Anchor>
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
    [router]
  )

  return (
    <div>
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
    </div>
  )
}

const GroceryTripsPage: BlitzPage = () => {
  const [modalOpened, setModalOpened] = useState(false)
  const { userId } = useSession()
  const [createGroceryTripMutation] = useMutation(createGroceryTrip)
  const theme = useMantineTheme()

  return (
    <>
      <Container size="lg" className={styles.groceryTripsContainer}>
        <Title order={1} mb={"md"}>
          Grocery Trips
        </Title>
        <Suspense fallback={<div>Loading...</div>}>
          <GroceryTripsList />
        </Suspense>
        <Tooltip label="Add new grocery trip" openDelay={500}>
          <ActionIcon
            className={actionStyles.actionButton}
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
        closeOnClickOutside={false}
        title="Create New Grocery Trip"
        transitionProps={{ transition: "fade", duration: 200, timingFunction: "ease" }}
        overlayProps={{
          color: theme.colorScheme === "dark" ? theme.colors.dark[9] : theme.colors.gray[2],
          opacity: 0.55,
          blur: 3,
        }}
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
