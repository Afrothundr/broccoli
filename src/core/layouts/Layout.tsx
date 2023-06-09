import Head from "next/head"
import React from "react"
import { BlitzLayout } from "@blitzjs/next"
import { ActionIcon, AppShell, Flex, Header, Navbar, useMantineColorScheme } from "@mantine/core"
import Link from "next/link"
import { Navigation } from "../components/Navigation"
import { IconSunLow, IconMoon } from "@tabler/icons-react"

const Layout: BlitzLayout<{ title?: string; children?: React.ReactNode }> = ({
  title,
  children,
}) => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const dark = colorScheme === "dark"

  return (
    <>
      <Head>
        <title>{title || "broccoli"}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AppShell
        padding="md"
        navbar={
          <Navbar width={{ base: 300 }} p="xs">
            <Navigation />
          </Navbar>
        }
        header={
          <Header height={60} p="xs">
            <Flex justify="space-between" align="center">
              <Link href="/">
                <span>Broccoli App</span>
              </Link>
              <ActionIcon
                size="lg"
                variant="outline"
                color={dark ? "yellow" : "blue"}
                onClick={() => toggleColorScheme()}
                title="Toggle color scheme"
              >
                {dark ? <IconSunLow /> : <IconMoon />}
              </ActionIcon>
            </Flex>
          </Header>
        }
        styles={(theme) => ({
          main: {
            backgroundColor:
              theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0],
          },
        })}
      >
        {children}
      </AppShell>
    </>
  )
}
export const dynamic = "force-dynamic"

export default Layout
