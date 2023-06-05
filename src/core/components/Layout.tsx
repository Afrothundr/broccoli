import { Routes } from "@blitzjs/next"
import { AppShell, Navbar, Header, ActionIcon, useMantineColorScheme } from "@mantine/core"
import Link from "next/link"
import { NavLink, Navigation } from "src/core/components/Navigation"

export default function DefaultLayout({ children }) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()

  const dark = colorScheme === "dark"
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
  return (
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
            <ActionIcon
              size="lg"
              variant="outline"
              color={dark ? "yellow" : "blue"}
              onClick={() => toggleColorScheme()}
              title="Toggle color scheme"
            >
              {dark ? <span>light</span> : <span>dark</span>}
            </ActionIcon>
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
  )
}
