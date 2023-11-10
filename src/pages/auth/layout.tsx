import { BlitzLayout } from "@blitzjs/next"
import { Paper, Title } from "@mantine/core"
import classes from "src/styles/AuthLayout.module.css"

export const AuthLayout: BlitzLayout<{ title?: string; children?: React.ReactNode }> = ({
  children,
  title,
}) => {
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
