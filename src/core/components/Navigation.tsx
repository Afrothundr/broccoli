"use client"

import { RouteUrlObject } from "blitz"
import Link from "next/link"
import { usePathname } from "next/navigation"

export interface NavLink {
  href: RouteUrlObject | string
  name: string
}

interface NavigationProps {
  navLinks: NavLink[]
}

export function Navigation({ navLinks }: NavigationProps) {
  const pathname = usePathname()

  return (
    <>
      {navLinks.map((link) => {
        // const isActive = pathname.startsWith(link.href)

        return (
          <Link href={link.href} key={link.name}>
            {link.name}
          </Link>
        )
      })}
    </>
  )
}
