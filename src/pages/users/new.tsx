import { Routes } from "@blitzjs/next"
import Link from "next/link"
import { useRouter } from "next/router"
import { useMutation } from "@blitzjs/rpc"
import Layout from "src/core/layouts/Layout"
import { CreateUserSchema } from "src/users/schemas"
import createUser from "src/users/mutations/createUser"
import { UserForm, FORM_ERROR } from "src/users/components/UserForm"
import { Suspense } from "react"

const NewUserPage = () => {
  const router = useRouter()
  const [createUserMutation] = useMutation(createUser)

  return (
    <Layout title={"Create New User"}>
      <h1>Create New User</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <UserForm
          submitText="Create User"
          schema={CreateUserSchema}
          // initialValues={{}}
          onSubmit={async (values) => {
            try {
              const user = await createUserMutation(values)
              await router.push(Routes.ShowUserPage({ userId: user.id }))
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
        <Link href={Routes.UsersPage()}>Users</Link>
      </p>
    </Layout>
  )
}

NewUserPage.authenticate = true

export default NewUserPage
