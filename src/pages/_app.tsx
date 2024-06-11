import {
  ErrorBoundary,
  ErrorComponent,
  Routes,
  type AppProps,
  type ErrorFallbackProps,
} from "@blitzjs/next"
import { MantineColorsTuple, MantineProvider, createTheme } from "@mantine/core"
import "@mantine/core/styles.css"
import { Notifications } from "@mantine/notifications"
import "@mantine/notifications/styles.css"
import "@uploadthing/react/styles.css"
import { AuthenticationError, AuthorizationError } from "blitz"
import { IKContext } from "imagekitio-react"
import { useRouter } from "next/navigation"
import { withBlitz } from "src/blitz-client"
import "src/styles/globals.css"

const broccoliGreen: MantineColorsTuple = [
  "#effbeb",
  "#e3f2dc",
  "#c6e1ba",
  "#a7d095",
  "#8cc275",
  "#7cb960",
  "#72b455",
  "#609e45",
  "#538c3b",
  "#447a2f",
]

const theme = createTheme({
  colors: {
    broccoliGreen,
  },
  primaryColor: "broccoliGreen",
  primaryShade: 7,
})
function RootErrorFallback({ error }: ErrorFallbackProps) {
  const router = useRouter()
  if (error instanceof AuthenticationError) {
    router.push(Routes.LoginPage().href)
    return <ErrorComponent statusCode={error.statusCode} title="Unauthorized" />
  }

  if (error instanceof AuthorizationError) {
    return (
      <ErrorComponent
        statusCode={error.statusCode}
        title="Sorry, you are not authorized to access this"
      />
    )
  }
  return (
    <ErrorComponent statusCode={error?.statusCode || 400} title={error.message || error.name} />
  )
}

function MyApp({ Component, pageProps }: AppProps) {
  const getLayout = Component.getLayout || ((page) => page)

  return (
    <MantineProvider theme={theme}>
      <Notifications />
      <ErrorBoundary FallbackComponent={RootErrorFallback}>
        <IKContext urlEndpoint="https://ik.imagekit.io/qenlzsgdo/">
          {getLayout(<Component {...pageProps} />)}
        </IKContext>
      </ErrorBoundary>
    </MantineProvider>
  )
}

export default withBlitz(MyApp)
