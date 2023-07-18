import { useQuery } from "@blitzjs/rpc"
import { User } from "@prisma/client"
import { createContext, useContext } from "react"
import getCurrentUser from "src/users/queries/getCurrentUser"

type ReturnedUser = Omit<User, "hashedPassword" | "createdAt" | "updatedAt">

const UserContext = createContext<ReturnedUser | null | undefined>(null)

export function UserProvider({ children }): JSX.Element {
  const [user] = useQuery(getCurrentUser, null)
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

export const useCurrentUser = (): ReturnedUser | null | undefined => {
  return useContext(UserContext)
}
