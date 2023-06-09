"use client"

import { Routes } from "@blitzjs/next"
import { ClassNames } from "@emotion/react"
import { RouteUrlObject } from "blitz"
import classNames from "classnames"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCurrentUser } from "src/users/hooks/useCurrentUser"

export interface NavLink {
  route: RouteUrlObject
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
      route: currentUser ? Routes.EditUserPage({ userId: currentUser.id }) : Routes.LoginPage(),
    },
  ]
  const pathname = usePathname()

  return (
    <>
      {links.map((link) => {
        const isActive = pathname.startsWith(link.route.href)

        return (
          <Link
            href={link.route}
            key={link.name}
            className={classNames({ ["bg-indigo-500"]: isActive })}
          >
            {link.name}
          </Link>
        )
      })}
    </>
  )
}
