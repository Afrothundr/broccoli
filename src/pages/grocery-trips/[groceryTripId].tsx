import { Suspense } from "react"
import { Routes } from "@blitzjs/next"
import Head from "next/head"
import Link from "next/link"
import { useQuery } from "@blitzjs/rpc"
import { useParam } from "@blitzjs/next"

import Layout from "src/core/layouts/Layout"
import getGroceryTrip from "src/grocery-trips/queries/getGroceryTrip"
import dayjs from "dayjs"
import { Group, Table, rem } from "@mantine/core"
import { IconArrowBack } from "@tabler/icons-react"

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
        <Group mb={rem("2rem")}>
          <h1>{groceryTrip.name}</h1>
          <Link href={Routes.EditGroceryTripPage({ groceryTripId: groceryTrip.id })}>Edit</Link>
        </Group>

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
  return (
    <div>
      <Group>
        <IconArrowBack /> <Link href={Routes.GroceryTripsPage()}>Back</Link>
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
