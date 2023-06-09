import { BlitzLayout } from "@blitzjs/next"
import {
  ActionIcon,
  AppShell,
  Burger,
  Flex,
  Header,
  Loader,
  MediaQuery,
  Navbar,
  useMantineColorScheme,
  useMantineTheme,
} from "@mantine/core"
import { IconMoon, IconSunLow } from "@tabler/icons-react"
import Head from "next/head"
import Link from "next/link"
import React, { Suspense, useState } from "react"
import { Navigation } from "../components/Navigation"

const Layout: BlitzLayout<{ title?: string; children?: React.ReactNode }> = ({
  title,
  children,
}) => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const theme = useMantineTheme()
  const dark = colorScheme === "dark"
  const [opened, setOpened] = useState(false)

  return (
    <>
      <Head>
        <title>{title || "broccoli"}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AppShell
        padding="sm"
        navbar={
          <Navbar p="md" hiddenBreakpoint="sm" hidden={!opened} width={{ sm: 200, lg: 300 }}>
            <Suspense fallback={<Loader />}>
              <Navigation />
            </Suspense>
          </Navbar>
        }
        header={
          <Header height={60} p="xs">
            <Flex justify="space-between" align="center">
              <MediaQuery largerThan="sm" styles={{ display: "none" }}>
                <Burger
                  opened={opened}
                  onClick={() => setOpened((o) => !o)}
                  size="sm"
                  color={theme.colors.gray[6]}
                  mr="xl"
                />
              </MediaQuery>
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
        navbarOffsetBreakpoint="sm"
        asideOffsetBreakpoint="sm"
        fixed
      >
        {children}
      </AppShell>
    </>
  )
}
export const dynamic = "force-dynamic"

export default Layout
