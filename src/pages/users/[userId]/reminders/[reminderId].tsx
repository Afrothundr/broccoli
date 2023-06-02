import { Suspense } from "react"
import { Routes } from "@blitzjs/next"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { useQuery, useMutation } from "@blitzjs/rpc"
import { useParam } from "@blitzjs/next"

import Layout from "src/core/layouts/Layout"
import getReminder from "src/reminders/queries/getReminder"
import deleteReminder from "src/reminders/mutations/deleteReminder"

export const Reminder = () => {
  const router = useRouter()
  const reminderId = useParam("reminderId", "number")
  const userId = useParam("userId", "number")
  const [deleteReminderMutation] = useMutation(deleteReminder)
  const [reminder] = useQuery(getReminder, { id: reminderId })

  return (
    <>
      <Head>
        <title>Reminder {reminder.id}</title>
      </Head>

      <div>
        <h1>Reminder {reminder.id}</h1>
        <pre>{JSON.stringify(reminder, null, 2)}</pre>

        <Link
          href={Routes.EditReminderPage({
            userId: userId!,
            reminderId: reminder.id,
          })}
        >
          Edit
        </Link>

        <button
          type="button"
          onClick={async () => {
            if (window.confirm("This will be deleted")) {
              await deleteReminderMutation({ id: reminder.id })
              await router.push(Routes.RemindersPage({ userId: userId! }))
            }
          }}
          style={{ marginLeft: "0.5rem" }}
        >
          Delete
        </button>
      </div>
    </>
  )
}

const ShowReminderPage = () => {
  const userId = useParam("userId", "number")

  return (
    <div>
      <p>
        <Link href={Routes.RemindersPage({ userId: userId! })}>Reminders</Link>
      </p>

      <Suspense fallback={<div>Loading...</div>}>
        <Reminder />
      </Suspense>
    </div>
  )
}

ShowReminderPage.authenticate = true
ShowReminderPage.getLayout = (page) => <Layout>{page}</Layout>

export default ShowReminderPage
