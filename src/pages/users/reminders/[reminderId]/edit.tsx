import { Routes, useParam } from "@blitzjs/next"
import { useMutation, useQuery } from "@blitzjs/rpc"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { Suspense } from "react"

import Layout from "src/core/layouts/Layout"
import { FORM_ERROR, ReminderForm } from "src/reminders/components/ReminderForm"
import updateReminder from "src/reminders/mutations/updateReminder"
import getReminder from "src/reminders/queries/getReminder"
import { UpdateReminderSchema } from "src/reminders/schemas"

export const EditReminder = () => {
  const router = useRouter()
  const reminderId = useParam("reminderId", "number")
  const userId = useParam("userId", "number")
  const [reminder, { setQueryData }] = useQuery(
    getReminder,
    { id: reminderId },
    {
      // This ensures the query never refreshes and overwrites the form data while the user is editing.
      staleTime: Infinity,
    }
  )
  const [updateReminderMutation] = useMutation(updateReminder)

  return (
    <>
      <Head>
        <title>Edit Reminder {reminder.id}</title>
      </Head>

      <div>
        <h1>Edit Reminder {reminder.id}</h1>
        <pre>{JSON.stringify(reminder, null, 2)}</pre>
        <Suspense fallback={<div>Loading...</div>}>
          <ReminderForm
            submitText="Update Reminder"
            schema={UpdateReminderSchema}
            initialValues={reminder}
            onSubmit={async (values) => {
              try {
                const updated = await updateReminderMutation({
                  ...values,
                  id: reminder.id,
                })
                await setQueryData(updated)
                await router.push(
                  Routes.ShowReminderPage({
                    userId: userId!,
                    reminderId: updated.id,
                  })
                )
              } catch (error: any) {
                console.error(error)
                return {
                  [FORM_ERROR]: error.toString(),
                }
              }
            }}
          />
        </Suspense>
      </div>
    </>
  )
}

const EditReminderPage = () => {
  const userId = useParam("userId", "number")

  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <EditReminder />
      </Suspense>

      <p>
        <Link href={Routes.RemindersPage({ userId: userId! })}>Reminders</Link>
      </p>
    </div>
  )
}

EditReminderPage.authenticate = true
EditReminderPage.getLayout = (page) => <Layout>{page}</Layout>

export default EditReminderPage
