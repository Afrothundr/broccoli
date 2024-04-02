import { useSession } from "@blitzjs/auth"
import { useQuery } from "@blitzjs/rpc"
import { Card, Group, Stack, Text } from "@mantine/core"
import { ItemStatusType } from "@prisma/client"
import { IconBulb } from "@tabler/icons-react"
import { useState } from "react"
import getItems from "src/items/queries/getItems"

type Advice = {
  id: number
  advice: string
  name: string
}

export const StorageAdvice = () => {
  const { userId } = useSession()
  const [{ items }] = useQuery(getItems, {
    where: {
      userId: userId ?? 0,
    },
    orderBy: { id: "desc" },
  })
  const [storageAdvice, setStorageAdvice] = useState<Record<number, Advice>>({})

  const currentItems = items.filter((item) => {
    const validTypes: ItemStatusType[] = [
      ItemStatusType.FRESH,
      ItemStatusType.OLD,
      ItemStatusType.BAD,
    ]
    return validTypes.includes(item.status)
  })

  for (const item of currentItems) {
    const itemTypeId = item.itemTypes[0]?.id
    const itemTypeName = item.itemTypes[0]?.name
    const itemTypeStorageAdvice = item.itemTypes[0]?.storage_advice
    if (itemTypeId && itemTypeName && itemTypeStorageAdvice) {
      if (!storageAdvice[itemTypeId]) {
        setStorageAdvice((storageAdvice) => ({
          ...storageAdvice,
          [itemTypeId]: {
            id: item.id,
            advice: itemTypeStorageAdvice,
            name: itemTypeName,
          },
        }))
      }
    }
  }

  return (
    <Stack mt={"lg"}>
      {!Object.values(storageAdvice).length && (
        <Text>Add some items to get some handy advice!</Text>
      )}
      {Object.values(storageAdvice).map((storageAdvice) => (
        <Card shadow="sm" radius="md" withBorder key={storageAdvice.id}>
          <Group justify="space-between" mb="xs">
            <Text fw={500}>Did You Know?</Text>
            <IconBulb />
          </Group>

          <Text size="sm" c="dimmed">
            {storageAdvice.name} can last longer if you {storageAdvice.advice.toLowerCase()}
          </Text>
        </Card>
      ))}
    </Stack>
  )
}
