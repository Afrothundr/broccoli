import { Routes } from "@blitzjs/next"
import Link from "next/link"
import { useParam } from "@blitzjs/next"
import { useRouter } from "next/router"
import { useMutation } from "@blitzjs/rpc"
import Layout from "src/core/layouts/Layout"
import { CreateReminderSchema } from "src/reminders/schemas"
import createReminder from "src/reminders/mutations/createReminder"
import { ReminderForm, FORM_ERROR } from "src/reminders/components/ReminderForm"
import { Suspense } from "react"

const NewReminderPage = () => {
  const router = useRouter()
  const userId = useParam("userId", "number")
  const [createReminderMutation] = useMutation(createReminder)

  return (
    <Layout title={"Create New Reminder"}>
      <h1>Create New Reminder</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ReminderForm
          submitText="Create Reminder"
          schema={CreateReminderSchema}
          // initialValues={{}}
          onSubmit={async (values) => {
            try {
              const reminder = await createReminderMutation({
                ...values,
                userId: userId!,
              })
              await router.push(
                Routes.ShowReminderPage({
                  userId: userId!,
                  reminderId: reminder.id,
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
      <p>
        <Link href={Routes.RemindersPage({ userId: userId! })}>Reminders</Link>
      </p>
    </Layout>
  )
}

NewReminderPage.authenticate = true

export default NewReminderPage
