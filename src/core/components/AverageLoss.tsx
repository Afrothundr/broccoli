import { useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { usePaginatedQuery } from "@blitzjs/rpc"
import { Box, NumberFormatter, Stack, Text, Title, useMantineTheme } from "@mantine/core"
import { ItemStatusType } from "@prisma/client"
import Link from "next/link"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import getGroceryTrips from "src/grocery-trips/queries/getGroceryTrips"

export const AverageLoss = () => {
  const { userId } = useSession()
  const [{ groceryTrips }] = usePaginatedQuery(getGroceryTrips, {
    orderBy: { createdAt: "asc" },
    where: {
      userId: userId ?? undefined,
    },
    take: 10,
  })

  const data = groceryTrips.map((trip) => ({
    totalItems: trip.items.length,
    itemsConsumed: trip.items.reduce(
      (total, item) =>
        item.status === ItemStatusType.EATEN ? total + 1 : total + item.percentConsumed * 0.01,
      0
    ),
  }))
  const theme = useMantineTheme()

  const averageConsumed =
    data.reduce((acc, curr) => acc + curr.itemsConsumed / curr.totalItems, 0) / data.length

  const chartData = [
    { name: "eaten", value: averageConsumed },
    {
      name: "loss",
      value: 1 - averageConsumed,
    },
  ]

  return (
    <Stack mt="sm">
      <Title order={4} style={{ textAlign: "center" }}>
        Average percentage of items used per grocery trip:{" "}
        {<NumberFormatter suffix="%" value={Math.round(averageConsumed * 100)} />}
      </Title>
      <Box>
        {groceryTrips.length ? (
          <ResponsiveContainer width={"100%"} height={400}>
            <PieChart width={600} height={600} data={data}>
              <Pie
                dataKey="value"
                labelLine={false}
                label={renderCustomizedLabel}
                data={chartData}
                cx="50%"
                cy="50%"
                fill="#8884d8"
                outerRadius={150}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.name === "eaten" ? theme.colors.green[4] : theme.colors.red[4]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Text>
            No grocery trips yet! <Link href={Routes.GroceryTripsPage()}>Add one</Link>
          </Text>
        )}
      </Box>
    </Stack>
  )
}

const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}
