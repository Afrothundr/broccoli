import { Routes } from "@blitzjs/next"
import { Button, Container, Group, Text } from "@mantine/core"
import Link from "next/link"
import classes from "src/styles/HeroTitle.module.css"

export function HeroTitle() {
  return (
    <div className={classes.wrapper}>
      <Container size={700} className={classes.inner}>
        <h1 className={classes.title}>
          <Text
            component="span"
            variant="gradient"
            gradient={{ from: "green", to: "teal" }}
            inherit
          >
            Broccoli
          </Text>{" "}
        </h1>
        <h2 className={classes.subTitle}>
          <Text
            component="span"
            variant="gradient"
            gradient={{ from: "red", to: "orange" }}
            inherit
            mt="md"
          >
            maximize
          </Text>{" "}
          your kitchen,
        </h2>
        <h2 className={classes.subTitle}>
          <Text component="span" variant="gradient" gradient={{ from: "blue", to: "teal" }} inherit>
            minimize
          </Text>{" "}
          your grocery bill
        </h2>
        <Group className={classes.controls}>
          <Link href={Routes.SignupPage()}>
            <Button
              size="xl"
              className={classes.control}
              variant="gradient"
              gradient={{ from: "green", to: "teal" }}
            >
              Get Started
            </Button>
          </Link>

          <Link href={Routes.LoginPage()}>
            <Button size="xl" variant="default" className={classes.control}>
              Login
            </Button>
          </Link>
        </Group>
      </Container>
    </div>
  )
}
