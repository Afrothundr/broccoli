import { Routes, useParam } from "@blitzjs/next"
import { useMutation, useQuery } from "@blitzjs/rpc"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { Suspense } from "react"

import Layout from "src/core/layouts/Layout"
import { FORM_ERROR, ReceiptForm } from "src/receipts/components/ReceiptForm"
import updateReceipt from "src/receipts/mutations/updateReceipt"
import getReceipt from "src/receipts/queries/getReceipt"
import { UpdateReceiptSchema } from "src/receipts/schemas"

export const EditReceipt = () => {
  const router = useRouter()
  const receiptId = useParam("receiptId", "number")
  const [receipt, { setQueryData }] = useQuery(
    getReceipt,
    { id: receiptId },
    {
      // This ensures the query never refreshes and overwrites the form data while the user is editing.
      staleTime: Infinity,
    }
  )
  const [updateReceiptMutation] = useMutation(updateReceipt)

  return (
    <>
      <Head>
        <title>Edit Receipt {receipt.id}</title>
      </Head>

      <div>
        <h1>Edit Receipt {receipt.id}</h1>
        <pre>{JSON.stringify(receipt, null, 2)}</pre>
        <Suspense fallback={<div>Loading...</div>}>
          <ReceiptForm
            submitText="Update Receipt"
            schema={UpdateReceiptSchema}
            initialValues={receipt}
            onSubmit={async (values) => {
              try {
                const updated = await updateReceiptMutation({
                  ...values,
                  id: receipt.id,
                })
                await setQueryData(updated)
                await router.push(Routes.ShowReceiptPage({ receiptId: updated.id }))
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

const EditReceiptPage = () => {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <EditReceipt />
      </Suspense>

      <p>
        <Link href={Routes.ReceiptsPage()}>Receipts</Link>
      </p>
    </div>
  )
}

EditReceiptPage.authenticate = true
EditReceiptPage.getLayout = (page) => <Layout>{page}</Layout>

export default EditReceiptPage
