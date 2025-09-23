import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../hooks/use-auth"

type AuthGuardProps = {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true, state: { from: location } })
    }
  }, [user, navigate, location])

  if (!user) return null

  return <>{children}</>
}
