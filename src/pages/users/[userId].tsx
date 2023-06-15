import { Suspense } from "react"
import { Routes } from "@blitzjs/next"
import Link from "next/link"
import { useQuery } from "@blitzjs/rpc"
import { useParam } from "@blitzjs/next"

import Layout from "src/core/layouts/Layout"
import getUser from "src/users/queries/getUser"
import { IconEditCircle } from "@tabler/icons-react"
import styles from "src/styles/ShowUserPage.module.css"
import { Button } from "@mantine/core"

export const User = () => {
  const userId = useParam("userId", "number")
  const [user] = useQuery(getUser, { id: userId })

  return (
    <div>
      <div className={styles.headerContainer}>
        <h1 className={styles.header}>Welcome back, {user.firstName}!</h1>
        <Link href={Routes.EditUserPage({ userId: user.id })}>
          <Button leftIcon={<IconEditCircle />} variant="default">
            Edit
          </Button>
        </Link>
      </div>
    </div>
  )
}

const ShowUserPage = () => {
  return (
    <Layout>
      <Suspense fallback={<div>Loading...</div>}>
        <User />
      </Suspense>
    </Layout>
  )
}

ShowUserPage.authenticate = true

export default ShowUserPage
