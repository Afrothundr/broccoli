import { useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { useQuery } from "@blitzjs/rpc"
import { Stack, Text } from "@mantine/core"
import { ItemStatusType } from "@prisma/client"
import Link from "next/link"
import getGroceryTrips from "src/grocery-trips/queries/getGroceryTrips"
import { STEPS, colors } from "../utils/TextColors"

export const CurrentSavings = () => {
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
          cost: curr.items.reduce((acc, curr) => acc + curr.price, 0),
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
      cost: number
    }[]
  )

  const averageConsumed =
    filteredTrips.reduce(
      (acc, curr) => acc + curr.itemsConsumed / (curr.totalItems > 0 ? curr.totalItems : 1),
      0
    ) / filteredTrips.length
  const totalCost = filteredTrips.reduce((total, trip) => total + trip.cost, 0)

  const BASELINE_LOSS = (1 / 3) * -1
  const savingsPercentage = BASELINE_LOSS + averageConsumed
  const averageAmountSaved = (totalCost * savingsPercentage) / filteredTrips.length
  const getTextColor = (value: number) => {
    if (value >= 5) {
      return colors[STEPS.GOOD]
    }
    if (value < 5 && value >= 0) {
      return colors[STEPS.WARNING]
    }
    if (value < 0) {
      return colors[STEPS.BAD]
    }
  }

  const value = Number.isNaN(averageAmountSaved)
    ? 0
    : Number.parseFloat(averageAmountSaved.toFixed(2))

  return (
    <Stack align="center" justify="center" className="h-full" gap={0}>
      <Text mb="-.5rem" className="ml-[15px]" c="dimmed" fw={700}>
        total savings
      </Text>
      {filteredTrips.length ? (
        <Text
          variant="gradient"
          gradient={getTextColor(value)}
          fw={900}
          ta="center"
          className="text-5xl font-black"
        >
          ${(value > 0 ? value : 0).toFixed(2)}
        </Text>
      ) : (
        <Text>
          No grocery trips yet! <Link href={Routes.GroceryTripsPage()}>Add one</Link>
        </Text>
      )}
    </Stack>
  )
}
