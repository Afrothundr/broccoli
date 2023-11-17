import { useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { useMutation, usePaginatedQuery, useQuery } from "@blitzjs/rpc"
import {
  ActionIcon,
  Badge,
  Card,
  CloseButton,
  Container,
  Group,
  Input,
  Menu,
  NumberFormatter,
  SimpleGrid,
  Text,
  Title,
  Tooltip,
  rem,
} from "@mantine/core"
import { Item, ItemStatusType } from "@prisma/client"
import {
  IconDots,
  IconEdit,
  IconPaperBag,
  IconPlus,
  IconSearch,
  IconShoppingCart,
  IconToolsKitchen2,
  IconTrash,
} from "@tabler/icons-react"
import { useRouter } from "next/router"
import { Suspense, useState } from "react"
import { ItemStatusBadge } from "src/core/components/ItemStatusBadge"
import { UpdateConsumedModal } from "src/core/components/UpdateConsumedModal"
import { UpdateItemModal } from "src/core/components/UpdateItemModal"
import Layout from "src/core/layouts/Layout"
import updateItem from "src/items/mutations/updateItem"
import getItems from "src/items/queries/getItems"
import styles from "src/styles/ActionItem.module.css"
import { NewItemModal } from "../../core/components/NewItemModal"

export type CombinedItemType = Item & {
  itemTypes: {
    id: number
    name: string
  }[]
}

export const ItemsList = ({
  items,
  refetch,
}: {
  items: CombinedItemType[]
  refetch: () => void
}) => {
  const [updateItemMutation] = useMutation(updateItem)
  const [percentageEatenModalOpen, setPercentageEatenModalOpen] = useState(false)
  const [updateItemModalOpened, setUpdateItemModalOpened] = useState(false)
  const [itemToUpdate, setItemToUpdate] = useState<CombinedItemType>()
  const router = useRouter()
  const handleItemEaten = async (item: CombinedItemType) => {
    await updateItemMutation({
      ...item,
      itemTypes: item.itemTypes.map((type) => type.id.toString()),
      groceryTripId: item.groceryTripId.toString(),
      status: ItemStatusType.EATEN,
    })
    refetch()
  }
  const handleItemDiscarded = async (item: CombinedItemType) => {
    await updateItemMutation({
      ...item,
      itemTypes: item.itemTypes.map((type) => type.id.toString()),
      groceryTripId: item.groceryTripId.toString(),
      status: ItemStatusType.DISCARDED,
    })
    refetch()
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} mt="lg">
      {items.map((item) => (
        <Card key={item.id} withBorder shadow="sm" radius="md">
          <Card.Section withBorder inheritPadding py="xs">
            <Group justify="space-between">
              <Text fw={500}>{item.name}</Text>
              <Group>
                <Text c="dimmed">
                  {item.quantity} {item.unit}
                </Text>{" "}
                <Menu position="bottom-end" shadow="sm">
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray">
                      <IconDots style={{ width: rem(16), height: rem(16) }} />
                    </ActionIcon>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={
                        <IconToolsKitchen2 style={{ width: rem(14), height: rem(14) }} />
                      }
                      color="green"
                      onClick={() => handleItemEaten(item)}
                    >
                      I ate all of this!
                    </Menu.Item>
                    <Menu.Item
                      onClick={() => {
                        setItemToUpdate(item)
                        setPercentageEatenModalOpen(true)
                      }}
                      leftSection={<IconPaperBag style={{ width: rem(14), height: rem(14) }} />}
                    >
                      I ate some of this.
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconTrash style={{ width: rem(14), height: rem(14) }} />}
                      color="red"
                      onClick={() => handleItemDiscarded(item)}
                    >
                      I tossed this...
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      leftSection={<IconEdit style={{ width: rem(14), height: rem(14) }} />}
                      onClick={() => {
                        setItemToUpdate(item)
                        setUpdateItemModalOpened(true)
                      }}
                    >
                      Edit Item
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconShoppingCart style={{ width: rem(14), height: rem(14) }} />}
                      onClick={() =>
                        router.push(
                          Routes.ShowGroceryTripPage({ groceryTripId: item.groceryTripId })
                        )
                      }
                    >
                      View Grocery Trip
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Group>
          </Card.Section>
          <Group>
            {item.description && (
              <Text mt="md" c="dimmed">
                {item.description}
              </Text>
            )}
          </Group>
          <Group mt="md" justify="space-between">
            <Group>
              <Text>
                <NumberFormatter prefix="$ " value={item.price} thousandSeparator />
              </Text>

              {item.itemTypes.length > 0 && (
                <Badge variant="light" color="grey">
                  {item.itemTypes[0]?.name}
                </Badge>
              )}
            </Group>
            <ItemStatusBadge status={item.status} percentConsumed={item.percentConsumed} />
          </Group>
        </Card>
      ))}
      {percentageEatenModalOpen && itemToUpdate && (
        <UpdateConsumedModal
          onModalClose={() => {
            refetch()
            setPercentageEatenModalOpen(false)
          }}
          item={itemToUpdate}
        />
      )}
      {updateItemModalOpened && itemToUpdate && (
        <UpdateItemModal
          onModalClose={() => {
            refetch()
            setUpdateItemModalOpened(false)
          }}
          item={itemToUpdate}
        />
      )}
    </SimpleGrid>
  )
}

const ItemsPage = () => {
  const [newItemModalOpened, setNewItemModalOpened] = useState(false)
  const [search, setSearch] = useState("")
  const { userId } = useSession()
  const [{ items }, { refetch }] = usePaginatedQuery(getItems, {
    where: {
      userId: userId ?? 0,
      name: {
        search,
      },
    },
    orderBy: { id: "desc" },
  })
  const [{ items: defaultItems }, { refetch: refetchDefault }] = useQuery(getItems, {
    where: {
      userId: userId ?? 0,
    },
    orderBy: { id: "desc" },
    take: 50,
  })

  const handleUpdate = async () => {
    await refetch()
    await refetchDefault()
  }
  return (
    <Container size="lg">
      <Group align="center" mb={"md"}>
        <Title order={1}>Inventory</Title>
        <Tooltip label="Add new item" openDelay={500}>
          <ActionIcon
            className={styles.paperActionButton}
            color="blue"
            size="l"
            radius="xl"
            variant="filled"
            onClick={() => setNewItemModalOpened(true)}
          >
            <IconPlus />
          </ActionIcon>
        </Tooltip>
      </Group>
      <Input
        size="lg"
        radius="xl"
        placeholder="Search your items"
        value={search}
        onChange={(e) => setSearch(e.target.value.trim())}
        leftSection={<IconSearch />}
        rightSection={search && <CloseButton onClick={() => setSearch("")} />}
      />
      <Suspense fallback={<div>Loading...</div>}>
        <ItemsList items={items.length > 0 ? items : defaultItems} refetch={handleUpdate} />
      </Suspense>
      {newItemModalOpened && (
        <Suspense fallback={<div>Loading...</div>}>
          <NewItemModal
            onModalClose={async () => {
              await handleUpdate()
              setNewItemModalOpened(false)
            }}
          />
        </Suspense>
      )}
    </Container>
  )
}

ItemsPage.getLayout = (page) => <Layout title="Inventory">{page}</Layout>

ItemsPage.authenticate = { redirectTo: Routes.LoginPage() }
export default ItemsPage
