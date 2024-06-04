import { useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { useQuery } from "@blitzjs/rpc"
import { Card, NumberFormatter, Text, Title, useMantineTheme } from "@mantine/core"
import { ItemStatusType } from "@prisma/client"
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
    <Card mt="sm" withBorder shadow="sm" radius="md" style={{ minHeight: 150 }}>
      <Card.Section withBorder inheritPadding py="xs">
        <Title order={4} style={{ textAlign: "center" }}>
          Percentage of items used per grocery trip
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
            <NumberFormatter suffix="%" value={Math.round(averageConsumed * 100)} />
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
