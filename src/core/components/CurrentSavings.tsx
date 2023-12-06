import { useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { useQuery } from "@blitzjs/rpc"
import { Card, Text, Title } from "@mantine/core"
import { ItemStatusType } from "@prisma/client"
import Link from "next/link"
import getGroceryTrips from "src/grocery-trips/queries/getGroceryTrips"

export const CurrentSavings = () => {
  const { userId } = useSession()
  const [{ groceryTrips }] = useQuery(getGroceryTrips, {
    orderBy: { createdAt: "asc" },
    where: {
      userId: userId ?? undefined,
    },
  })

  const data = groceryTrips.map((trip) => ({
    totalItems: trip.items.length,
    cost: trip.items.reduce((acc, curr) => acc + curr.price, 0),
    itemsConsumed: trip.items.reduce(
      (total, item) =>
        item.status === ItemStatusType.EATEN ? total + 1 : total + item.percentConsumed * 0.01,
      0
    ),
  }))

  const averageConsumed =
    data.reduce((acc, curr) => acc + curr.itemsConsumed / curr.totalItems, 0) / data.length
  const totalCost = data.reduce((total, trip) => total + trip.cost, 0)

  const BASELINE_LOSS = (1 / 3) * -1
  const savingsPercentage = BASELINE_LOSS + averageConsumed
  const averageAmountSaved = (totalCost * savingsPercentage) / data.length

  return (
    <Card withBorder shadow="sm" radius="md" style={{ minHeight: 150 }}>
      <Card.Section withBorder inheritPadding py="xs">
        <Title order={4} style={{ textAlign: "center" }}>
          Average Savings compared to typical household
        </Title>
      </Card.Section>
      <Card.Section>
        {groceryTrips.length ? (
          <Text
            variant="gradient"
            gradient={{ from: "green", to: "teal" }}
            fw={900}
            ta="center"
            style={{ fontSize: "3rem" }}
          >
            ${isNaN(averageAmountSaved) ? 0 : averageAmountSaved.toFixed(2)}
          </Text>
        ) : (
          <Text>
            No grocery trips yet! <Link href={Routes.GroceryTripsPage()}>Add one</Link>
          </Text>
        )}
      </Card.Section>
    </Card>
  )
}
