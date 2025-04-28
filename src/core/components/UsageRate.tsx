import { useSession } from "@blitzjs/auth"
import { useQuery } from "@blitzjs/rpc"
import { Text } from "@mantine/core"
import { ItemStatusType } from "@prisma/client"
import { PieChart } from "react-minimal-pie-chart"
import getGroceryTrips from "src/grocery-trips/queries/getGroceryTrips"
import { STEPS, colors } from "../utils/TextColors"

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

  const averageConsumed = Math.round(
    (filteredTrips.reduce(
      (acc, curr) => acc + curr.itemsConsumed / (curr.totalItems > 0 ? curr.totalItems : 1),
      0
    ) /
      filteredTrips.length) *
      100
  )

  return (
    <div className="grid mx-auto p-lg md:w-1/2 lg:w-1/4">
      <div className="row-span-full col-span-full w-full">
        <PieChart
          background="#e9ecef"
          data={[{ value: averageConsumed, color: getTextColor(averageConsumed)?.to || "grey" }]}
          totalValue={100}
          label={({ dataEntry }) => `${dataEntry.value}%`}
          lineWidth={20}
          labelStyle={{
            fontSize: "20px",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji",
            fontWeight: "600",
            fill: getTextColor(averageConsumed)?.to,
          }}
          labelPosition={0}
          style={{ height: "200px" }}
        />
      </div>
      <div className="row-span-full col-span-full w-full h-full content-center justify-items-center">
        <Text c="dimmed" fw={700} className="mb-[75px] text-center">
          usage rate
        </Text>
      </div>
    </div>
  )
}
