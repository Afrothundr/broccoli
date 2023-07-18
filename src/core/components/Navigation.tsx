"use client"

import { useSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { NavLink } from "@mantine/core"
import { RouteUrlObject } from "blitz"
import Link from "next/link"

export interface NavLinkProps {
  route: RouteUrlObject | string
  name: string
}

export function Navigation() {
  const { userId } = useSession()
  const links: NavLinkProps[] = [
    {
      name: "Dashboard",
      route: Routes.DashboardsPage(),
    },
    {
      name: "Inventory",
      route: Routes.ItemsPage(),
    },
    {
      name: "Grocery Trips",
      route: Routes.GroceryTripsPage(),
    },
    {
      name: "Profile",
      route: userId ? `/users/${userId}` : Routes.LoginPage(),
    },
  ]

  return (
    <>
      {links.map((link) => {
        return (
          <Link href={link.route} key={link.name}>
            <NavLink label={link.name} />
          </Link>
        )
      })}
    </>
  )
}
