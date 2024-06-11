import { useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { useQuery } from "@blitzjs/rpc"
import { Card, Text, Title, useMantineTheme } from "@mantine/core"
import Link from "next/link"
import { useMemo } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
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
  const COLORS = [
    "#ff6666",
    "#2ecc70",
    "#ff9900",
    "#ffcc99",
    "#33cc33",
    "#9933ff", // Purple
    "#3366ff", // Blue
    "#6699ff", // Light Blue
    "#ff33cc", // Pink
    "#cc33ff", // Violet
    "#33ffd1", // Turquoise
    "#339999", // Teal
    "#8d6a9f", // Muted Purple
  ]

  return (
    <Card radius="md" style={{ minHeight: 150 }}>
      <Card.Section withBorder inheritPadding py="xs">
        <Title order={4}>Item purchase breakdown</Title>
      </Card.Section>
      <Card.Section>
        {itemTypes.length ? (
          <ResponsiveContainer width={"100%"} height={300}>
            <PieChart cx="70%" cy="70%">
              <Pie
                data={itemTypesCategories}
                innerRadius={30}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={3}
                dataKey="value"
                label={({ index }) => itemTypesCategories[index]?.name}
              >
                {itemTypesCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
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
