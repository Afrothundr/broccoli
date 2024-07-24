import { useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { useQuery } from "@blitzjs/rpc"
import { ActionIcon, Group, NumberFormatter, Text, Title } from "@mantine/core"
import { ItemStatusType } from "@prisma/client"
import { IconToolsKitchen2 } from "@tabler/icons-react"
import Link from "next/link"
import getGroceryTrips from "src/grocery-trips/queries/getGroceryTrips"

export const AverageLoss = () => {
  const { userId } = useSession()
  const [{ groceryTrips }] = useQuery(getGroceryTrips, {
    orderBy: { createdAt: "asc" },
    where: {
      userId: userId ?? undefined,
    },
  })

  const data = groceryTrips.map((trip) => ({
    totalItems: trip.items.length,
    itemsConsumed: trip.items.reduce(
      (total, item) =>
        item.status === ItemStatusType.EATEN ? total + 1 : total + item.percentConsumed * 0.01,
      0
    ),
  }))

  const averageConsumed =
    data.reduce((acc, curr) => acc + curr.itemsConsumed / curr.totalItems, 0) / data.length

  console.log({ averageConsumed })
  return (
    <Group>
      <ActionIcon variant="filled" size="xl" radius="xl" aria-label="Savings" color="gray">
        <IconToolsKitchen2 style={{ width: "70%", height: "70%" }} stroke={1.5} />
      </ActionIcon>
      <div>
        <Title order={4}>Usage rate</Title>
        {groceryTrips.length ? (
          <Text
            variant="gradient"
            gradient={{ from: "green", to: "teal" }}
            fw={900}
            style={{ fontSize: "2rem" }}
          >
            <NumberFormatter suffix="%" value={Math.round(averageConsumed * 100)} />
          </Text>
        ) : (
          <Text>
            No grocery trips yet! <Link href={Routes.GroceryTripsPage()}>Add one</Link>
          </Text>
        )}
      </div>
    </Group>
  )
}
