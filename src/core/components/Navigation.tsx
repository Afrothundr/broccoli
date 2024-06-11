import { Routes } from "@blitzjs/next"
import { NavLink, Stack, Text } from "@mantine/core"
import { IconHome2, IconSalad, IconShoppingCart } from "@tabler/icons-react"
import { useRouter } from "next/router"
import { ReactNode } from "react"

export interface NavLinkProps {
  route: string
  name: string
  icon: ReactNode
}

export function Navigation({ handleNavClick }: { handleNavClick: () => void }) {
  const router = useRouter()
  const links: NavLinkProps[] = [
    {
      name: "Dashboard",
      route: Routes.DashboardsPage().href,
      icon: <IconHome2 size="1.5rem" stroke={1.5} />,
    },
    {
      name: "Inventory",
      route: Routes.ItemsPage().href,
      icon: <IconSalad size="1.5rem" stroke={1.5} />,
    },
    {
      name: "Grocery Trips",
      route: Routes.GroceryTripsPage().href,
      icon: <IconShoppingCart size="1.5rem" stroke={1.5} />,
    },
    // {
    //   name: "Profile",
    //   route: userId ? `/users/${userId}` : Routes.LoginPage(),
    // },
  ]

  return (
    <Stack gap="md" mt="md">
      {links.map((link) => {
        return (
          <NavLink
            onClick={async () => {
              await router.push(link.route)
              handleNavClick()
            }}
            key={link.name}
            label={<Text size="md">{link.name}</Text>}
            leftSection={link.icon}
            aria-current={router.pathname.includes(link.route) && "page"}
          />
        )
      })}
    </Stack>
  )
}
