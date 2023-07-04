import { Routes, useParam } from "@blitzjs/next"
import { useQuery } from "@blitzjs/rpc"
import Head from "next/head"
import Link from "next/link"
import { Suspense } from "react"

import { Group, NavLink, Table, Text, Title } from "@mantine/core"
import { IconArrowBack } from "@tabler/icons-react"
import dayjs from "dayjs"
import { useRouter } from "next/router"
import Layout from "src/core/layouts/Layout"
import getGroceryTrip from "src/grocery-trips/queries/getGroceryTrip"

export const GroceryTrip = () => {
  const groceryTripId = useParam("groceryTripId", "number")
  const [groceryTrip] = useQuery(getGroceryTrip, { id: groceryTripId })

  const rows = groceryTrip.items.map((item) => (
    <tr key={item.id}>
      <td>
        <Link href={Routes.ShowItemPage({ itemId: item.id })}>{item.name}</Link>
      </td>
      <td>{item.quantity}</td>
      <td>{item.itemTypes.map((type) => type.name).join(",")}</td>
      <td>{item.status}</td>
      <td>{dayjs(item.createdAt).format("M/D")}</td>
    </tr>
  ))

  return (
    <>
      <Head>
        <title>Grocery Trip: {groceryTrip.id}</title>
      </Head>

      <div>
        <Group>
          <Title order={1}>
            {dayjs(groceryTrip.createdAt).format("M/D")} - {groceryTrip.name}
          </Title>
          <Link href={Routes.EditGroceryTripPage({ groceryTripId: groceryTrip.id })}>Edit</Link>
        </Group>
        <Text c="dimmed" my="sm">
          {groceryTrip.description}
        </Text>

        <div>
          <Table>
            <thead>
              <tr>
                <th></th>
                <th>How Much</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date Purchased</th>
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </Table>
        </div>
      </div>
    </>
  )
}

const ShowGroceryTripPage = () => {
  const router = useRouter()

  return (
    <div>
      <Group>
        <NavLink
          label="Back"
          onClick={() => router.push(Routes.GroceryTripsPage())}
          icon={<IconArrowBack size="1rem" stroke={1.5} />}
        />
      </Group>

      <Suspense fallback={<div>Loading...</div>}>
        <GroceryTrip />
      </Suspense>
    </div>
  )
}

ShowGroceryTripPage.authenticate = true
ShowGroceryTripPage.getLayout = (page) => <Layout>{page}</Layout>

export default ShowGroceryTripPage
