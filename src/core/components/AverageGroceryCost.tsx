"use client"
import { useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { useQuery } from "@blitzjs/rpc"
import { Card, NumberFormatter, Text, Title, useMantineColorScheme } from "@mantine/core"
import { LineChart, type LineChartOptions, type ResponsiveOptions } from "chartist"
import "chartist/dist/index.css"
import dayjs from "dayjs"
import Link from "next/link"
import { useEffect, useRef } from "react"
import getGroceryTrips from "src/grocery-trips/queries/getGroceryTrips"
import { broccoliGreen } from "src/pages/_app"

export const AverageGroceryCost = () => {
  const { userId } = useSession()
  const [{ groceryTrips }] = useQuery(getGroceryTrips, {
    orderBy: { createdAt: "asc" },
    where: {
      userId: userId ?? undefined,
    },
    take: 5,
  })
  const chart = useRef(null)
  const data = groceryTrips.map((trip) => ({
    name: dayjs(trip.createdAt).format("MM/DD/YY"),
    cost: trip.items.reduce((acc, curr) => acc + curr.price, 0).toFixed(2),
    id: trip.id,
  }))
  const { colorScheme } = useMantineColorScheme()

  const averageCost = (
    data.reduce((acc, curr) => acc + Number.parseFloat(curr.cost), 0) / data.length
  ).toFixed(2)

  useEffect(() => {
    const lineColor = broccoliGreen[6]
    const areaColor = broccoliGreen[4]
    const pointColor = broccoliGreen[broccoliGreen.length - 1]
    if (chart.current) {
      const labels: string[] = []
      const series: string[] = []
      for (const trip of groceryTrips) {
        labels.push(dayjs(trip.createdAt).format("MMM D"))
        series.push(trip.items.reduce((acc, curr) => acc + curr.price, 0).toFixed(2))
      }
      const responsiveOptions: ResponsiveOptions<LineChartOptions> = [
        [
          "screen and (min-width: 640px)",
          {
            chartPadding: {
              right: 90,
            },
            axisY: {
              onlyInteger: true,
            },
          },
        ],
        [
          "screen and (min-width: 1024px)",
          {
            chartPadding: {
              right: 120,
            },
            axisY: {
              onlyInteger: true,
            },
          },
        ],
      ]
      const chart = new LineChart(
        "#chart",
        {
          labels,
          series: [series],
        },
        {
          low: 0,
          showArea: true,
          showPoint: true,
          fullWidth: true,
          chartPadding: {
            right: 40,
          },
        },
        responsiveOptions
      )
      // Apply custom styles
      chart.on("draw", (context) => {
        if (context.type === "line") {
          context.element.attr({
            style: `stroke: ${lineColor};`,
          })
        }
        if (context.type === "area") {
          context.element.attr({
            style: `fill: ${areaColor};`,
          })
        }
        if (context.type === "point") {
          context.element.attr({
            style: `stroke: ${pointColor};`,
          })
        }
        if (context.type === "label") {
          context.element.attr({
            style: `color: ${
              colorScheme === "light" ? "black" : "rgb(201, 201, 201)"
            }; font-size: 1rem;`,
          })
          if (context.x === 10) {
            context.element.addClass("custom-y-axis-label")
          }
        }
        if (context.type === "grid") {
          context.element.attr({
            style: `stroke: ${colorScheme === "light" ? "rgb(222, 226, 230)" : "#828282"};`,
          })
        }
      })
    }
  }, [groceryTrips, colorScheme])

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
          <div id="chart" ref={chart} style={{ height: "50vh" }} />
        ) : (
          <Text>
            No grocery trips yet! <Link href={Routes.GroceryTripsPage()}>Add one</Link>
          </Text>
        )}
      </Card.Section>
    </Card>
  )
}
