"use client"
import { useSession } from "@blitzjs/auth"
import { useQuery } from "@blitzjs/rpc"
import { Sparkline } from "@mantine/charts"
import { Group, NumberFormatter, Stack, Text } from "@mantine/core"
import "chartist/dist/index.css"
import dayjs from "dayjs"
import { useMemo } from "react"
import getGroceryTrips from "src/grocery-trips/queries/getGroceryTrips"

export const AverageGroceryCost = () => {
  const { userId } = useSession()
  const [{ groceryTrips }] = useQuery(getGroceryTrips, {
    orderBy: { createdAt: "desc" },
    where: {
      userId: userId ?? undefined,
    },
  })
  const data = groceryTrips
    .reduce((acc, curr) => {
      if (curr.items.length > 0) {
        acc.push({
          createdAt: curr.createdAt,
          name: dayjs(curr.createdAt).format("MM/DD/YY"),
          cost: curr.items.reduce((acc, curr) => acc + curr.price, 0),
          id: curr.id,
        })
      }
      return acc
    }, [] as { name: string; cost: number; id: number; createdAt: Date }[])
    .reverse()

  const dataToDisplay = data.slice(-6)

  const averageCost = (data.reduce((acc, curr) => acc + curr.cost, 0) / data.length).toFixed(2)

  const percentageChange = useMemo(() => {
    const simpleMovingAverage = (prices: number[], interval: number) => {
      let index = interval - 1
      const length = prices.length + 1
      const results: number[] = []

      while (index < length) {
        index = index + 1
        const intervalSlice = prices.slice(index - interval, index)
        const sum = intervalSlice.reduce((prev, curr) => prev + curr, 0)
        results.push(sum / interval)
      }

      return results
    }

    if (data.length >= 6) {
      const rollingAverages = simpleMovingAverage(
        data.map((trip) => trip.cost),
        3
      )
      if (!rollingAverages.length) return null
      const secondToLast = rollingAverages?.[rollingAverages.length - 2]
      const last = rollingAverages?.[rollingAverages.length - 1]
      if (secondToLast && last) {
        return Math.round(((last - secondToLast) / secondToLast) * 100)
      }
    }
    return null
  }, [data])

  console.log({ percentageChange })

  return (
    <div className="row-span-full col-span-full h-full w-full px-6 md:w-1/2 lg:w-1/2 bg-green-100 p-3 rounded-lg">
      {" "}
      <Stack>
        <Group justify="space-between">
          <Group>
            <div
              className="inline-flex items-center justify-center p-1 text-sm font-medium rounded-md bg-gray-200/80 text-gray-700 gap-2 opacity-75

"
            >
              $
            </div>
            <Text c="dimmed" fw={700}>
              average trip
            </Text>
          </Group>
          {percentageChange && (
            <div className="inline-flex items-center justify-center px-3 py-1 text-sm font-medium rounded-full bg-gray-200/80 text-gray-700 gap-2 opacity-75">
              <span>{percentageChange > 0 ? "+" : "-"}</span>
              <span>{Math.abs(percentageChange)}%</span>
            </div>
          )}
        </Group>
        <Text className="pl-8 text-4xl font-black mb-[-10px]" c="#32831c">
          <NumberFormatter prefix="$" value={averageCost} thousandSeparator color="#32831c" />
        </Text>
        <Sparkline
          h={60}
          data={dataToDisplay.map((data) => data.cost)}
          curveType="linear"
          color="#32831c"
          fillOpacity={0}
          strokeWidth={4}
        />
      </Stack>
    </div>
  )
}
