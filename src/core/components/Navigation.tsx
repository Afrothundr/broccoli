import { Routes } from "@blitzjs/next"
import { NavLink } from "@mantine/core"
import { useRouter } from "next/router"

export interface NavLinkProps {
  route: string
  name: string
}

export function Navigation({ handleNavClick }: { handleNavClick: () => void }) {
  const router = useRouter()
  const links: NavLinkProps[] = [
    {
      name: "Dashboard",
      route: Routes.DashboardsPage().href,
    },
    {
      name: "Inventory",
      route: Routes.ItemsPage().href,
    },
    {
      name: "Grocery Trips",
      route: Routes.GroceryTripsPage().href,
    },
    // {
    //   name: "Profile",
    //   route: userId ? `/users/${userId}` : Routes.LoginPage(),
    // },
  ]

  return (
    <>
      {links.map((link) => {
        return (
          <NavLink
            onClick={async () => {
              await router.push(link.route)
              handleNavClick()
            }}
            key={link.name}
            label={link.name}
          />
        )
      })}
    </>
  )
}
