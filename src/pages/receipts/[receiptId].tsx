import { Suspense } from "react"
import { Routes } from "@blitzjs/next"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { useQuery, useMutation } from "@blitzjs/rpc"
import { useParam } from "@blitzjs/next"

import Layout from "src/core/layouts/Layout"
import getReceipt from "src/receipts/queries/getReceipt"
import deleteReceipt from "src/receipts/mutations/deleteReceipt"

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

        <Link href={Routes.EditReceiptPage({ receiptId: receipt.id })}>Edit</Link>

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
