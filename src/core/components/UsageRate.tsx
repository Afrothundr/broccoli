import { useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { useQuery } from "@blitzjs/rpc"
import { ActionIcon, Group, NumberFormatter, Text, Title } from "@mantine/core"
import { type GroceryTrip, ItemStatusType } from "@prisma/client"
import { IconPaperBag } from "@tabler/icons-react"
import Link from "next/link"
import getGroceryTrips from "src/grocery-trips/queries/getGroceryTrips"
import { STEPS, colors } from "../utils/TextColors"

type TripType = GroceryTrip & {
  items: {
    status: ItemStatusType
    price: number
    percentConsumed: number
  }[]
  _count: {
    items: number
  }
}
export const UsageRate = () => {
  const { userId } = useSession()
  const [{ groceryTrips }] = useQuery(getGroceryTrips, {
    orderBy: { createdAt: "asc" },
    where: {
      userId: userId ?? undefined,
    },
  })

  const filteredTrips = groceryTrips.reduce(
    (acc, curr) => {
      if (curr.items.length > 0) {
        acc.push({
          totalItems: curr.items.length,
          itemsConsumed: curr.items.reduce(
            (total, item) =>
              item.status === ItemStatusType.EATEN
                ? total + 1
                : total + item.percentConsumed * 0.01,
            0
          ),
        })
      }
      return acc
    },
    [] as {
      totalItems: number
      itemsConsumed: number
    }[]
  )

  const getTextColor = (value: number) => {
    if (value >= 33) {
      return colors[STEPS.GOOD]
    }
    if (value < 33 && value >= 23) {
      return colors[STEPS.WARNING]
    }
    if (value < 23) {
      return colors[STEPS.BAD]
    }
  }

  const averageConsumed =
    filteredTrips.reduce(
      (acc, curr) => acc + curr.itemsConsumed / (curr.totalItems > 0 ? curr.totalItems : 1),
      0
    ) / filteredTrips.length

  return (
    <Group>
      <ActionIcon variant="filled" size="xl" radius="xl" aria-label="Savings" color="gray">
        <IconPaperBag style={{ width: "70%", height: "70%" }} stroke={1.5} />
      </ActionIcon>
      <div>
        <Title order={4}>Usage rate</Title>
        {filteredTrips.length ? (
          <Text
            variant="gradient"
            gradient={getTextColor(Math.round(averageConsumed * 100))}
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
