import { Suspense } from "react"

import Layout from "src/core/layouts/Layout"
import styles from "src/styles/ShowUserPage.module.css"
import { useCurrentUser } from "src/users/hooks/useCurrentUser"

export const User = () => {
  const user = useCurrentUser()

  return (
    <div className={styles.headerContainer}>
      <h1 className={styles.header}>Welcome back, {user?.firstName}!</h1>
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

export default ShowUserPage
