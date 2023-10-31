import { AppProps, ErrorBoundary, ErrorComponent, ErrorFallbackProps } from "@blitzjs/next"
import { ColorScheme, ColorSchemeProvider, MantineProvider } from "@mantine/core"
import "@uploadthing/react/styles.css"
import { AuthenticationError, AuthorizationError } from "blitz"
import { IKContext } from "imagekitio-react"
import { useState } from "react"
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
  const [colorScheme, setColorScheme] = useState<ColorScheme>("light")
  const getLayout = Component.getLayout || ((page) => page)
  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"))
  return (
    <ErrorBoundary FallbackComponent={RootErrorFallback}>
      <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
        <MantineProvider withGlobalStyles withNormalizeCSS theme={{ colorScheme }}>
          <IKContext urlEndpoint="https://ik.imagekit.io/qenlzsgdo/">
            {getLayout(<Component {...pageProps} />)}
          </IKContext>
        </MantineProvider>
      </ColorSchemeProvider>
    </ErrorBoundary>
  )
}

export default withBlitz(MyApp)
