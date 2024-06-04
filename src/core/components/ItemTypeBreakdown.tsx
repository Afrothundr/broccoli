import { useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { useQuery } from "@blitzjs/rpc"
import { Card, Text, Title, useMantineTheme } from "@mantine/core"
import Link from "next/link"
import { useMemo } from "react"
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts"
import getItemTypes from "src/item-types/queries/getItemTypes"

export const ItemTypeBreakdown = () => {
  const { userId } = useSession()
  const [{ itemTypes }] = useQuery(getItemTypes, {
    orderBy: { createdAt: "asc" },
    where: {
      items: { every: { userId: userId ?? undefined } },
    },
  })
  const itemTypesCategories = useMemo<{ name: string; value: number }[]>(() => {
    const categoryCounts: { name: string; value: number }[] = []
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
      categoryCounts.push({
        name: category,
        value: itemCategoryMapper[category].reduce((acc, curr) => (acc += curr.value), 0),
      })
    }
    return categoryCounts
  }, [itemTypes])

  const theme = useMantineTheme()

  return (
    <Card mt="sm" withBorder shadow="sm" radius="md" style={{ minHeight: 150 }}>
      <Card.Section withBorder inheritPadding py="xs">
        <Title order={4} style={{ textAlign: "center" }}>
          Item type breakdown
        </Title>
      </Card.Section>
      <Card.Section>
        {itemTypes.length ? (
          <ResponsiveContainer width={"100%"} height={400}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={itemTypesCategories}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis />
              <Radar
                dataKey="value"
                stroke={theme.colors.green[8]}
                fill={theme.colors.green[2]}
                fillOpacity={0.6}
              />
            </RadarChart>
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
