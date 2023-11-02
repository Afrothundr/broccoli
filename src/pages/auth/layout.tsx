import { BlitzLayout } from "@blitzjs/next"
import { Paper, Title, createStyles, rem } from "@mantine/core"

const useStyles = createStyles((theme) => ({
  wrapper: {
    minHeight: rem(900),
    backgroundSize: "cover",
    backgroundImage: "url(https://ik.imagekit.io/qenlzsgdo/cat-han-VgyN_CWXQVM-unsplash.jpg)",
  },

  form: {
    borderRight: `${rem(1)} solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.colors.gray[3]
    }`,
    minHeight: rem(900),
    maxWidth: rem(450),
    paddingTop: rem(80),

    [theme.fn.smallerThan("sm")]: {
      maxWidth: "100%",
    },
  },

  title: {
    color: theme.colorScheme === "dark" ? theme.white : theme.black,
  },
}))

export const AuthLayout: BlitzLayout<{ title?: string; children?: React.ReactNode }> = ({
  children,
  title,
}) => {
  const { classes } = useStyles()
  return (
    <div className={classes.wrapper}>
      <Paper className={classes.form} radius={0} p={30}>
        <Title order={2} className={classes.title} ta="center" mt="md" mb="md">
          {title}
        </Title>

        {children}
      </Paper>
    </div>
  )
}

export default AuthLayout
