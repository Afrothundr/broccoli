import Head from "next/head"
import React from "react"
import { BlitzLayout, Routes } from "@blitzjs/next"
import { ActionIcon, AppShell, Header, Navbar, useMantineColorScheme } from "@mantine/core"
import Link from "next/link"
import { NavLink, Navigation } from "../components/Navigation"

const links: NavLink[] = [
  {
    name: "Inventory",
    href: Routes.ItemsPage(),
  },
  {
    name: "Grocery Trips",
    href: Routes.GroceryTripsPage(),
  },
  {
    name: "Profile",
    href: "/",
  },
]

const Layout: BlitzLayout<{ title?: string; children?: React.ReactNode }> = ({
  title,
  children,
}) => {
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
            <Navigation navLinks={links} />
          </Navbar>
        }
        header={
          <Header height={60} p="xs">
            <Link href="/">
              <p>Broccoli App</p>
            </Link>
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
