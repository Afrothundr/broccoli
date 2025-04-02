import { useSession } from "@blitzjs/auth"
import { useQuery } from "@blitzjs/rpc"
import { Card, Divider, Group, Stack, Text, Title } from "@mantine/core"
import { ItemStatusType } from "@prisma/client"
import { IconBulb } from "@tabler/icons-react"
import { IKImage } from "imagekitio-react"
import { useState } from "react"
import getItems from "src/items/queries/getItems"
import { NON_PERISHABLE_TYPE } from "../types"

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
      name: { not: NON_PERISHABLE_TYPE },
    },
    orderBy: { createdAt: "asc" },
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
    <Stack>
      <Divider
        my="xs"
        label={<Title order={4}>Item storage advice</Title>}
        labelPosition="center"
      />
      {!Object.values(storageAdvice).length && (
        <Text>Add some items to get some handy advice!</Text>
      )}
      {Object.values(storageAdvice).map((storageAdvice) => (
        <Card radius="md" withBorder key={storageAdvice.id} style={{ minWidth: "70%" }}>
          <Group>
            <Stack bg="#f4f4f4" align="center">
              <IKImage
                urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL}
                path={`/icons/${storageAdvice.name}.png`}
                height={50}
                lqip={{ active: true, quality: 20 }}
              />
            </Stack>
            <Group justify="space-between" mb="xs" className="grow">
              <Stack justify="space-around">
                <Text fw={500}>{storageAdvice.name}</Text>
                <Text size="sm" c="dimmed">
                  {storageAdvice.advice.toLowerCase()}
                </Text>
              </Stack>
              <IconBulb />
            </Group>
          </Group>
        </Card>
      ))}
    </Stack>
  )
}
