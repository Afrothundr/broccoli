"use client"

import { Routes } from "@blitzjs/next"
import { RouteUrlObject } from "blitz"
import Link from "next/link"
import { useCurrentUser } from "src/users/hooks/useCurrentUser"

export interface NavLink {
  route: RouteUrlObject | string
  name: string
}

export function Navigation() {
  const currentUser = useCurrentUser()
  const links: NavLink[] = [
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
      route: currentUser ? `/users/${currentUser.id}` : Routes.LoginPage(),
    },
  ]

  return (
    <>
      {links.map((link) => {
        return (
          <Link href={link.route} key={link.name}>
            {link.name}
          </Link>
        )
      })}
    </>
  )
}
