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
  IconPaperBag,
  IconSearch,
  IconShoppingCartPlus,
  IconToolsKitchen2,
  IconTrash,
} from "@tabler/icons-react"
import { Suspense, useState } from "react"
import Layout from "src/core/layouts/Layout"
import updateItem from "src/items/mutations/updateItem"
import getItems from "src/items/queries/getItems"
import styles from "src/styles/ActionItem.module.css"
import getItemStatusColor from "src/utils/ItemStatusTypeHelpers"
import { NewItemModal } from "../../core/components/NewItemModal"

type combinedItemType = Item & {
  itemTypes: {
    name: string
    storage_advice: string
  }[]
}

export const ItemsList = ({
  items,
  refetch,
}: {
  items: combinedItemType[]
  refetch: () => void
}) => {
  const [updateItemMutation] = useMutation(updateItem)

  const handleItemEaten = async (item: Item) => {
    await updateItemMutation({ ...item, status: ItemStatusType.EATEN })
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
                <Menu withinPortal position="bottom-end" shadow="sm">
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
                      leftSection={<IconPaperBag style={{ width: rem(14), height: rem(14) }} />}
                    >
                      I ate some of this.
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconTrash style={{ width: rem(14), height: rem(14) }} />}
                      color="red"
                    >
                      I tossed this...
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Group>
          </Card.Section>
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
            <Badge variant="light" color={getItemStatusColor(item.status)}>
              {item.status}
            </Badge>
          </Group>
        </Card>
      ))}
    </SimpleGrid>
  )
}

const ItemsPage = () => {
  const [modalOpened, setModalOpened] = useState(false)
  const [search, setSearch] = useState("")
  const { userId } = useSession()
  const [{ items }, { refetch }] = usePaginatedQuery(getItems, {
    where: {
      userId: userId ?? 0,
      name: {
        search,
      },
    },
    orderBy: { id: "asc" },
  })
  const [{ items: defaultItems }, { refetch: refetchDefault }] = useQuery(getItems, {
    where: {
      userId: userId ?? 0,
    },
    orderBy: { id: "asc" },
    take: 50,
  })

  const handleUpdate = async () => {
    await refetch()
    await refetchDefault()
  }
  return (
    <Container size="lg">
      <Title order={1} mb={"md"}>
        Inventory
      </Title>
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
