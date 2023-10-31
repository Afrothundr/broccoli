import { Routes } from "@blitzjs/next"
import Link from "next/link"
import { useRouter } from "next/router"
import { useMutation } from "@blitzjs/rpc"
import Layout from "src/core/layouts/Layout"
import { CreateReceiptSchema } from "src/receipts/schemas"
import createReceipt from "src/receipts/mutations/createReceipt"
import { ReceiptForm, FORM_ERROR } from "src/receipts/components/ReceiptForm"
import { Suspense } from "react"

const NewReceiptPage = () => {
  const router = useRouter()
  const [createReceiptMutation] = useMutation(createReceipt)

  return (
    <Layout title={"Create New Receipt"}>
      <h1>Create New Receipt</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ReceiptForm
          submitText="Create Receipt"
          schema={CreateReceiptSchema}
          // initialValues={{}}
          onSubmit={async (values) => {
            try {
              const receipt = await createReceiptMutation(values)
              await router.push(Routes.ShowReceiptPage({ receiptId: receipt.id }))
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
        <Link href={Routes.ReceiptsPage()}>Receipts</Link>
      </p>
    </Layout>
  )
}

NewReceiptPage.authenticate = true

export default NewReceiptPage
