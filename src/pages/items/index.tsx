import { useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { usePaginatedQuery } from "@blitzjs/rpc"
import { ActionIcon, Badge, Container, Group, Title, Tooltip } from "@mantine/core"
import { IconShoppingCartPlus } from "@tabler/icons-react"
import dayjs from "dayjs"
import { useRouter } from "next/router"
import { Suspense, useMemo, useState } from "react"
import { BroccoliFooter } from "src/core/components/BroccoliFooter"
import BroccoliTable from "src/core/components/BroccoliTable"
import Layout from "src/core/layouts/Layout"
import { filterDates } from "src/core/utils"
import getItems from "src/items/queries/getItems"
import styles from "src/styles/ActionItem.module.css"
import getItemStatusColor from "src/utils/ItemStatusTypeHelpers"
import { NewItemModal } from "./components/NewItemModal"

export const ItemsList = () => {
  const router = useRouter()
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const page = Number(router.query.page) || 0
  const { userId } = useSession()
  const [{ items, hasMore, count }, refetch] = usePaginatedQuery(getItems, {
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
    <div>
      <BroccoliTable
        {...{
          data: items,
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

const ItemsPage = () => {
  const [modalOpened, setModalOpened] = useState(false)
  return (
    <Container size="lg">
      <Title order={1} mb={"md"}>
        Inventory
      </Title>
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
      {modalOpened && (
        <Suspense fallback={<div>Loading...</div>}>
          <NewItemModal onModalClose={() => setModalOpened(false)} />
        </Suspense>
      )}
    </Container>
  )
}

ItemsPage.getLayout = (page) => <Layout title="Inventory">{page}</Layout>

ItemsPage.authenticate = { redirectTo: Routes.LoginPage() }
export default ItemsPage
