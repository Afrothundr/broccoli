"use client"

import { Routes } from "@blitzjs/next"
import { ClassNames } from "@emotion/react"
import { Loader } from "@mantine/core"
import { RouteUrlObject } from "blitz"
import classNames from "classnames"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense } from "react"
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
    <Suspense fallback={<Loader />}>
      {links.map((link) => {
        return (
          <Link href={link.route} key={link.name}>
            {link.name}
          </Link>
        )
      })}
    </Suspense>
  )
}
