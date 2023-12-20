import { Routes, useParam } from "@blitzjs/next"
import { useMutation, useQuery } from "@blitzjs/rpc"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { Suspense } from "react"

import Layout from "src/core/layouts/Layout"
import deleteReceipt from "src/receipts/mutations/deleteReceipt"
import getReceipt from "src/receipts/queries/getReceipt"

export const Receipt = () => {
  const router = useRouter()
  const receiptId = useParam("receiptId", "number")
  const [deleteReceiptMutation] = useMutation(deleteReceipt)
  const [receipt] = useQuery(getReceipt, { id: receiptId })

  return (
    <>
      <Head>
        <title>Receipt {receipt.id}</title>
      </Head>

      <div>
        <h1>Receipt {receipt.id}</h1>
        <pre>{JSON.stringify(receipt, null, 2)}</pre>

        <button
          type="button"
          onClick={async () => {
            if (window.confirm("This will be deleted")) {
              await deleteReceiptMutation({ id: receipt.id })
              await router.push(Routes.ReceiptsPage())
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

const ShowReceiptPage = () => {
  return (
    <div>
      <p>
        <Link href={Routes.ReceiptsPage()}>Receipts</Link>
      </p>

      <Suspense fallback={<div>Loading...</div>}>
        <Receipt />
      </Suspense>
    </div>
  )
}

ShowReceiptPage.authenticate = true
ShowReceiptPage.getLayout = (page) => <Layout>{page}</Layout>

export default ShowReceiptPage
