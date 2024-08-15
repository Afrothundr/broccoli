import { useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { useQuery } from "@blitzjs/rpc"
import { Card, NumberFormatter, Text, Title, useMantineTheme } from "@mantine/core"
import dayjs from "dayjs"
import Link from "next/link"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import getGroceryTrips from "src/grocery-trips/queries/getGroceryTrips"

export const AverageGroceryCost = () => {
  const { userId } = useSession()
  const [{ groceryTrips }] = useQuery(getGroceryTrips, {
    orderBy: { createdAt: "asc" },
    where: {
      userId: userId ?? undefined,
    },
    take: 10,
  })

  const data = groceryTrips.map((trip) => ({
    name: dayjs(trip.createdAt).format("MM/DD/YY"),
    cost: trip.items.reduce((acc, curr) => acc + curr.price, 0).toFixed(2),
    id: trip.id,
  }))
  const theme = useMantineTheme()

  const averageCost = (
    data.reduce((acc, curr) => acc + Number.parseFloat(curr.cost), 0) / data.length
  ).toFixed(2)
  const regressionLine = calculateLineOfBestFit(data)
  return (
    <Card mt="sm" radius="md" style={{ minHeight: 150 }}>
      <Card.Section withBorder inheritPadding py="xs">
        <Title order={4}>
          Average Grocery Trip Cost:{" "}
          {<NumberFormatter prefix="$" value={averageCost} thousandSeparator />}
        </Title>
      </Card.Section>
      <Card.Section mt="sm">
        {groceryTrips.length ? (
          <ResponsiveContainer width={"100%"} height={400}>
            <AreaChart
              width={500}
              height={250}
              data={data}
              margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis unit="$" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="cost"
                stroke={theme.colors.green[8]}
                fill={theme.colors.green[2]}
                dot={<CustomizedDot />}
              />
              <ReferenceLine
                stroke={theme.colors.pink[4]}
                segment={[
                  { x: data[0]?.name, y: regressionLine(0) },
                  { x: data[data.length - 1]?.name, y: regressionLine(data.length - 1) },
                ]}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Text>
            No grocery trips yet! <Link href={Routes.GroceryTripsPage()}>Add one</Link>
          </Text>
        )}
      </Card.Section>
    </Card>
  )
}

// Function to calculate the linear regression line
export const calculateLineOfBestFit = (data) => {
  const n = data.length

  // Calculate mean of x and y values
  const meanX = data.reduce((sum, _, index) => sum + index, 0) / n
  const meanY = data.reduce((sum, point) => sum + point.cost, 0) / n

  // Calculate slope and y-intercept of the regression line
  const numerator = data.reduce(
    (sum, point, index) => sum + (index - meanX) * (point.cost - meanY),
    0
  )
  const denominator = data.reduce((sum, _, index) => sum + (index - meanX) ** 2, 0)

  const slope = numerator / denominator
  const yIntercept = meanY - slope * meanX

  // Return the regression line function
  return (x) => slope * x + yIntercept
}

const CustomizedDot = (props) => {
  const { cx, cy, payload } = props
  const theme = useMantineTheme()
  return (
    <Link href={Routes.ShowGroceryTripPage({ groceryTripId: payload.id })}>
      <svg
        x={cx - 10}
        y={cy - 10}
        width={150}
        height={150}
        fill={theme.colors.green[6]}
        viewBox="0 0 1024 1024"
      >
        <path
          d="M75,1
             a 74,74 0 1,0 0,148
             a 74,74 0 1,0 0,-148"
        />
      </svg>
    </Link>
  )
}
