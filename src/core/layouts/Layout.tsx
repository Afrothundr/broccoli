import { type BlitzLayout, Routes } from "@blitzjs/next"
import { useMutation } from "@blitzjs/rpc"
import {
  ActionIcon,
  AppShell,
  Box,
  Burger,
  Group,
  Image,
  Loader,
  LoadingOverlay,
  NavLink,
  Stack,
  useMantineColorScheme,
} from "@mantine/core"
import "@mantine/dates/styles.css"
import { useDisclosure } from "@mantine/hooks"
import { IconLogout2, IconMoon, IconSunLow } from "@tabler/icons-react"
import Head from "next/head"
import Link from "next/link"
import type React from "react"
import { Suspense } from "react"
import logout from "src/auth/mutations/logout"
import loaderStyles from "src/styles/Loader.module.css"
import { UserProvider } from "src/users/hooks/useCurrentUser"
import { Navigation } from "../components/Navigation"

const Layout: BlitzLayout<{ title?: string; children?: React.ReactNode }> = ({
  title,
  children,
}) => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const dark = colorScheme === "dark"
  const [opened, { toggle }] = useDisclosure()
  const [logoutMutation] = useMutation(logout)

  return (
    <>
      <Head>
        <title>{title || "broccoli"}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Suspense
        fallback={
          <LoadingOverlay
            visible={true}
            zIndex={1000}
            overlayProps={{
              radius: "sm",
              blur: 2,
            }}
            loaderProps={{ children: <div className={loaderStyles.loader} /> }}
          />
        }
      >
        <UserProvider>
          <AppShell
            header={{ height: 60 }}
            navbar={{ width: 200, breakpoint: "sm", collapsed: { mobile: !opened } }}
            padding="md"
          >
            <AppShell.Header>
              <Group h="100%" px="md" justify="space-between">
                <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                <Link href={Routes.DashboardsPage()}>
                  <Image src="/logo.png" alt="Broccoli logo" className="w-[8rem] md:w-32 lg:w-48" />
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
              </Group>
            </AppShell.Header>
            <AppShell.Navbar p="md">
              <Stack justify="space-between" h={"100%"}>
                <Box>
                  <Suspense fallback={<Loader />}>
                    <Navigation handleNavClick={() => toggle()} />
                  </Suspense>
                </Box>
                <NavLink
                  onClick={async () => await logoutMutation()}
                  label="Log Out"
                  leftSection={<IconLogout2 />}
                />
              </Stack>
            </AppShell.Navbar>
            <AppShell.Main>{children}</AppShell.Main>
          </AppShell>
        </UserProvider>
      </Suspense>
    </>
  )
}

Layout.authenticate = { redirectTo: Routes.LoginPage().href }

export default Layout
