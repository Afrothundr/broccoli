"use client"
import { useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { useQuery } from "@blitzjs/rpc"
import { Grid, Progress, Text } from "@mantine/core"
import Link from "next/link"
import { type ReactNode, useMemo } from "react"
import { PieChart } from "react-minimal-pie-chart"
import getItemTypes from "src/item-types/queries/getItemTypes"
import { ItemCategoryColors } from "src/utils/ItemTypeColors"

export const ItemTypeBreakdown = ({ children }: { children: ReactNode }) => {
  const { userId } = useSession()
  const [{ itemTypes }] = useQuery(getItemTypes, {
    orderBy: { createdAt: "asc" },
    where: {
      items: { every: { userId: userId ?? undefined } },
    },
  })

  const itemTypesCategories = useMemo(() => {
    const data: { labels: string[]; series: number[] } = { labels: [], series: [] }
    const pieData: { title: string; value: number; color: string }[] = []
    const itemCategoryMapper: Record<string, { name: string; value: number }[]> = {}

    for (const itemType of itemTypes) {
      if (itemType.items.length) {
        if (itemType.category && itemCategoryMapper[itemType.category]) {
          itemCategoryMapper?.[itemType.category]?.push({
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

    const totalItems = Object.values(itemCategoryMapper).reduce((acc, curr) => {
      return acc + curr.reduce((total, current) => total + current.value, 0)
    }, 0)

    for (const category in itemCategoryMapper) {
      const categoryValue =
        itemCategoryMapper?.[category]?.reduce((acc, curr) => acc + curr.value, 0) || 0
      pieData.push({
        title: category,
        value: (categoryValue / totalItems) * 100,
        color: ItemCategoryColors[category] ?? "green",
      })
      data.labels.push(category)
      data.series.push(
        itemCategoryMapper?.[category]?.reduce((acc, curr) => acc + curr.value, 0) || 0
      )
    }
    return pieData
  }, [itemTypes])

  return (
    <>
      {itemTypes.length ? (
        <>
          <div className="grid mx-auto p-lg md:w-1/2 lg:w-1/4">
            <div className="row-span-full col-span-full w-full">
              <PieChart data={itemTypesCategories} rounded lineWidth={30} />
            </div>
            <div className="row-span-full col-span-full h-full w-full">{children}</div>
          </div>
          <Grid>
            {itemTypesCategories.map((cat) => {
              return (
                <Grid.Col span={3} key={cat.title}>
                  <Text>{cat.title.toLowerCase()}</Text>
                  <Progress color={cat.color} size="xl" value={cat.value} />
                </Grid.Col>
              )
            })}
          </Grid>
        </>
      ) : (
        <Text>
          No grocery trips yet! <Link href={Routes.GroceryTripsPage()}>Add one</Link>
        </Text>
      )}
    </>
  )
}
