import { Routes } from "@blitzjs/next"
import { usePaginatedQuery } from "@blitzjs/rpc"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { Suspense } from "react"
import Layout from "src/core/layouts/Layout"
import getReceipts from "src/receipts/queries/getReceipts"

const ITEMS_PER_PAGE = 100

export const ReceiptsList = () => {
  const router = useRouter()
  const page = Number(router.query.page) || 0
  const [{ receipts, hasMore }] = usePaginatedQuery(getReceipts, {
    orderBy: { id: "asc" },
    skip: ITEMS_PER_PAGE * page,
    take: ITEMS_PER_PAGE,
  })

  const goToPreviousPage = () => router.push({ query: { page: page - 1 } })
  const goToNextPage = () => router.push({ query: { page: page + 1 } })

  return (
    <div>
      <ul>
        {receipts.map((receipt) => (
          <li key={receipt.id}>
            <Link href={Routes.ShowReceiptPage({ receiptId: receipt.id })}>{receipt.url}</Link>
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

const ReceiptsPage = () => {
  return (
    <Layout>
      <Head>
        <title>Receipts</title>
      </Head>

      <div>
        <Suspense fallback={<div>Loading...</div>}>
          <ReceiptsList />
        </Suspense>
      </div>
    </Layout>
  )
}

export default ReceiptsPage
