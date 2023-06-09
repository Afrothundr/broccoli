import { Routes } from "@blitzjs/next"
import { createStyles, Container, Text, Button, Group, rem } from "@mantine/core"
import Link from "next/link"

const useStyles = createStyles((theme) => ({
  wrapper: {
    position: "relative",
    boxSizing: "border-box",
    backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.white,
  },

  inner: {
    position: "relative",
    paddingTop: rem(200),
    paddingBottom: rem(120),

    [theme.fn.smallerThan("sm")]: {
      paddingBottom: rem(80),
      paddingTop: rem(80),
    },
  },

  title: {
    fontFamily: `Greycliff CF, ${theme.fontFamily}`,
    fontSize: rem(62),
    fontWeight: 900,
    lineHeight: 1.1,
    margin: 0,
    padding: 0,
    color: theme.colorScheme === "dark" ? theme.white : theme.black,

    [theme.fn.smallerThan("sm")]: {
      fontSize: rem(42),
      lineHeight: 1.2,
    },
  },

  subTitle: {
    fontFamily: `Greycliff CF, ${theme.fontFamily}`,
    fontSize: rem(31),
    fontWeight: 700,
    lineHeight: 1.1,
    margin: 0,
    padding: 0,
    color: theme.colorScheme === "dark" ? theme.white : theme.black,

    [theme.fn.smallerThan("sm")]: {
      fontSize: rem(42),
      lineHeight: 1.2,
    },
  },

  description: {
    marginTop: theme.spacing.xl,
    fontSize: rem(24),

    [theme.fn.smallerThan("sm")]: {
      fontSize: rem(18),
    },
  },

  controls: {
    marginTop: `calc(${theme.spacing.xl} * 2)`,

    [theme.fn.smallerThan("sm")]: {
      marginTop: theme.spacing.xl,
    },
  },

  control: {
    height: rem(54),
    paddingLeft: rem(38),
    paddingRight: rem(38),

    [theme.fn.smallerThan("sm")]: {
      height: rem(54),
      paddingLeft: rem(18),
      paddingRight: rem(18),
      flex: 1,
    },
  },
}))

export function HeroTitle() {
  const { classes } = useStyles()

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
              GetStarted
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
