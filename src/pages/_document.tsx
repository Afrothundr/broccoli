import { createGetInitialProps } from "@mantine/next"
import Document, { Html, Main, NextScript, Head } from "next/document"

const getInitialProps = createGetInitialProps()

class MyDocument extends Document {
  static getInitialProps = getInitialProps

  render() {
    return (
      <Html lang="en">
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
