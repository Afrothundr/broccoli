"use client"
import { useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { useQuery } from "@blitzjs/rpc"
import { Card, Text, Title, useMantineColorScheme } from "@mantine/core"
import { PieChart, type PieChartOptions, type ResponsiveOptions } from "chartist"
import Link from "next/link"
import { useEffect, useMemo, useRef } from "react"
import getItemTypes from "src/item-types/queries/getItemTypes"

export const ItemTypeBreakdown = () => {
  const { userId } = useSession()
  const [{ itemTypes }] = useQuery(getItemTypes, {
    orderBy: { createdAt: "asc" },
    where: {
      items: { every: { userId: userId ?? undefined } },
    },
  })
  const chart = useRef<HTMLDivElement>(null)
  const { colorScheme } = useMantineColorScheme()
  const itemTypesCategories = useMemo(() => {
    const data: { labels: string[]; series: number[] } = { labels: [], series: [] }
    const itemCategoryMapper = {}

    for (const itemType of itemTypes) {
      if (itemType.items.length) {
        if (itemCategoryMapper[itemType.category]) {
          itemCategoryMapper[itemType.category].push({
            name: itemType.name,
            value: itemType.items.length,
          })
        } else {
          itemCategoryMapper[itemType.category] = [
            { name: itemType.name, value: itemType.items.length },
          ]
        }
      }
    }

    for (const category in itemCategoryMapper) {
      data.labels.push(category)
      data.series.push(itemCategoryMapper[category].reduce((acc, curr) => acc + curr.value, 0))
    }
    return data
  }, [itemTypes])

  useEffect(() => {
    if (chart.current) {
      const options: PieChartOptions = {
        donut: true,
        donutWidth: 60,
        startAngle: 270,
        chartPadding: 20,
        labelOffset: 50,
      }

      const responsiveOptions: ResponsiveOptions<PieChartOptions> = [
        [
          "screen and (min-width: 640px)",
          {
            chartPadding: 20,
            labelOffset: 50,
            labelDirection: "explode",
          },
        ],
        [
          "screen and (min-width: 1024px)",
          {
            labelOffset: 40,
            labelDirection: "explode",
            chartPadding: 20,
          },
        ],
      ]
      const pie = new PieChart("#pie", itemTypesCategories, options, responsiveOptions)
      pie.on("draw", (context) => {
        if (context.type === "label") {
          context.element.attr({
            style: `fill: ${
              colorScheme === "light" ? "#495057" : "rgb(201, 201, 201)"
            }; font-size: .75rem;`,
          })
        }
      })
    }
  }, [itemTypesCategories, colorScheme])

  return (
    <Card radius="md" style={{ minHeight: 150 }}>
      <Card.Section withBorder inheritPadding py="xs">
        <Title order={4}>Item purchase breakdown</Title>
      </Card.Section>
      <Card.Section>
        {itemTypes.length ? (
          <div ref={chart} id="pie" style={{ height: "25vh" }} />
        ) : (
          <Text>
            No grocery trips yet! <Link href={Routes.GroceryTripsPage()}>Add one</Link>
          </Text>
        )}
      </Card.Section>
    </Card>
  )
}
