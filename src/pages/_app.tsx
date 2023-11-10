import { AppProps, ErrorBoundary, ErrorComponent, ErrorFallbackProps } from "@blitzjs/next"
import { MantineProvider } from "@mantine/core"
import "@mantine/core/styles.css"
import "@uploadthing/react/styles.css"
import { AuthenticationError, AuthorizationError } from "blitz"
import { IKContext } from "imagekitio-react"
import { withBlitz } from "src/blitz-client"
import "src/styles/globals.css"

function RootErrorFallback({ error }: ErrorFallbackProps) {
  if (error instanceof AuthenticationError) {
    return <div>Error: You are not authenticated</div>
  } else if (error instanceof AuthorizationError) {
    return (
      <ErrorComponent
        statusCode={error.statusCode}
        title="Sorry, you are not authorized to access this"
      />
    )
  } else {
    return (
      <ErrorComponent
        statusCode={(error as any)?.statusCode || 400}
        title={error.message || error.name}
      />
    )
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  const getLayout = Component.getLayout || ((page) => page)

  return (
    <MantineProvider defaultColorScheme="light">
      <ErrorBoundary FallbackComponent={RootErrorFallback}>
        <IKContext urlEndpoint="https://ik.imagekit.io/qenlzsgdo/">
          {getLayout(<Component {...pageProps} />)}
        </IKContext>
      </ErrorBoundary>
    </MantineProvider>
  )
}

export default withBlitz(MyApp)
