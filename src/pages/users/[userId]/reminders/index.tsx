import { Suspense } from "react"
import { Routes } from "@blitzjs/next"
import Head from "next/head"
import Link from "next/link"
import { usePaginatedQuery } from "@blitzjs/rpc"
import { useParam } from "@blitzjs/next"
import { useRouter } from "next/router"

import Layout from "src/core/layouts/Layout"
import getReminders from "src/reminders/queries/getReminders"

const ITEMS_PER_PAGE = 100

export const RemindersList = () => {
  const router = useRouter()
  const page = Number(router.query.page) || 0
  const userId = useParam("userId", "number")
  const [{ reminders, hasMore }] = usePaginatedQuery(getReminders, {
    where: { user: { id: userId! } },
    orderBy: { id: "asc" },
    skip: ITEMS_PER_PAGE * page,
    take: ITEMS_PER_PAGE,
  })

  const goToPreviousPage = () => router.push({ query: { page: page - 1 } })
  const goToNextPage = () => router.push({ query: { page: page + 1 } })

  return (
    <div>
      <ul>
        {reminders.map((reminder) => (
          <li key={reminder.id}>
            <Link href={Routes.ShowReminderPage({ reminderId: reminder.id })}>{reminder.name}</Link>
          </li>
        ))}
      </ul>

      <button disabled={page === 0} onClick={goToPreviousPage}>
        Previous
      </button>
      <button disabled={!hasMore} onClick={goToNextPage}>
        Next
      </button>
    </div>
  )
}

const RemindersPage = () => {
  const userId = useParam("userId", "number")

  return (
    <Layout>
      <Head>
        <title>Reminders</title>
      </Head>

      <div>
        <p>
          <Link href={Routes.NewReminderPage({ userId: userId! })}>Create Reminder</Link>
        </p>

        <Suspense fallback={<div>Loading...</div>}>
          <RemindersList />
        </Suspense>
      </div>
    </Layout>
  )
}

export default RemindersPage
