import {
  AuthenticateWithRedirectCallback,
  SignOutButton,
  useAuth,
  useSignIn,
} from '@clerk/react'
import { Eye, Home, LogOut } from 'lucide-react'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { courseScores, scoreRowsByCourse } from './data'

type AppProps = {
  clerkEnabled: boolean
}

type NavigateOptions = {
  replace?: boolean
  scroll?: boolean
}

type Navigate = (path: string, options?: NavigateOptions) => void

const APP_HOME_PATH = '/course_wise'
const LOGIN_PATH = '/'
const SSO_CALLBACK_PATH = '/sso-callback'
const CLERK_HANDSHAKE_PARAM = '__clerk_handshake'

const currentBrowserPath = () => `${window.location.pathname}${window.location.search}` || LOGIN_PATH

const routePathFrom = (path: string) => {
  const routePath = path.split('?')[0] || LOGIN_PATH
  return routePath === LOGIN_PATH ? routePath : routePath.replace(/\/+$/, '')
}

const removeClerkHandshakeParam = (path: string) => {
  const [routePath, rawSearch] = path.split('?')

  if (!rawSearch) {
    return path
  }

  const params = new URLSearchParams(rawSearch)

  if (!params.has(CLERK_HANDSHAKE_PARAM)) {
    return path
  }

  params.delete(CLERK_HANDSHAKE_PARAM)
  const search = params.toString()

  return search ? `${routePath}?${search}` : routePath || LOGIN_PATH
}

function useCurrentPath(): [string, Navigate] {
  const [path, setPath] = useState(currentBrowserPath())

  useEffect(() => {
    const handlePopState = () => setPath(currentBrowserPath())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = useCallback((nextPath: string, options: NavigateOptions = {}) => {
    if (currentBrowserPath() !== nextPath) {
      if (options.replace) {
        window.history.replaceState({}, '', nextPath)
      } else {
        window.history.pushState({}, '', nextPath)
      }
    }
    setPath(nextPath)
    if (options.scroll !== false) {
      window.scrollTo({ top: 0, left: 0 })
    }
  }, [])

  return [path, navigate]
}

export default function App({ clerkEnabled }: AppProps) {
  const [path, navigate] = useCurrentPath()

  if (clerkEnabled) {
    return <ClerkApp navigate={navigate} path={path} />
  }

  return <PreviewApp navigate={navigate} path={path} />
}

function ClerkApp({ path, navigate }: { path: string; navigate: Navigate }) {
  const { isLoaded, isSignedIn } = useAuth()
  const routePath = routePathFrom(path)

  useEffect(() => {
    if (!isLoaded) {
      return
    }

    const cleanPath = removeClerkHandshakeParam(path)

    if (cleanPath !== path) {
      navigate(cleanPath, { replace: true, scroll: false })
    }
  }, [isLoaded, navigate, path])

  if (routePath === SSO_CALLBACK_PATH) {
    return (
      <div className="auth-callback">
        <AuthenticateWithRedirectCallback
          signInForceRedirectUrl={APP_HOME_PATH}
          signUpForceRedirectUrl={APP_HOME_PATH}
        />
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <PageShell showNavigation={false} navigate={navigate}>
        <div className="loading-space" />
      </PageShell>
    )
  }

  if (!isSignedIn) {
    return (
      <PageShell showNavigation={false} navigate={navigate}>
        <LoginPage />
      </PageShell>
    )
  }

  return (
    <PageShell showNavigation navigate={navigate}>
      <ProtectedRoutes navigate={navigate} path={path} />
    </PageShell>
  )
}

function PreviewApp({ path, navigate }: { path: string; navigate: Navigate }) {
  const [signedIn, setSignedIn] = useState(
    routePathFrom(path) === APP_HOME_PATH ||
      new URLSearchParams(window.location.search).get('preview') === 'signed-in',
  )

  if (!signedIn) {
    return (
      <PageShell showNavigation={false} navigate={navigate}>
        <LoginPage
          onPreviewLogin={() => {
            setSignedIn(true)
            navigate(APP_HOME_PATH)
          }}
        />
      </PageShell>
    )
  }

  return (
    <PageShell
      navigate={navigate}
      onPreviewLogout={() => {
        setSignedIn(false)
        navigate(LOGIN_PATH)
      }}
      showNavigation
    >
      <ProtectedRoutes navigate={navigate} path={path} />
    </PageShell>
  )
}

function PageShell({
  children,
  navigate,
  onPreviewLogout,
  showNavigation,
}: {
  children: ReactNode
  navigate: Navigate
  onPreviewLogout?: () => void
  showNavigation: boolean
}) {
  return (
    <>
      <nav className="navbar" aria-label="Primary">
        <button className="brand-button" type="button" onClick={() => navigate(APP_HOME_PATH)}>
          <img alt="IIT Madras Logo" className="iitm-logo" src="/assets/iitm-logo.png" />
          <span className="brand-text">SCORE CHECKER</span>
        </button>

        {showNavigation ? (
          <div className="navbar-links">
            <button className="nav-action" type="button" onClick={() => navigate(APP_HOME_PATH)}>
              <Home aria-hidden="true" className="nav-icon filled-icon" />
              <span>Home</span>
            </button>
            {onPreviewLogout ? (
              <button className="nav-action" type="button" onClick={onPreviewLogout}>
                <LogOut aria-hidden="true" className="nav-icon" />
                <span>Logout</span>
              </button>
            ) : (
              <SignOutButton redirectUrl={LOGIN_PATH}>
                <button className="nav-action" type="button">
                  <LogOut aria-hidden="true" className="nav-icon" />
                  <span>Logout</span>
                </button>
              </SignOutButton>
            )}
          </div>
        ) : null}
      </nav>
      <main>{children}</main>
    </>
  )
}

function LoginPage({ onPreviewLogin }: { onPreviewLogin?: () => void }) {
  return (
    <section className="login-container" aria-label="Login">
      {onPreviewLogin ? <PreviewGoogleButton onClick={onPreviewLogin} /> : <ClerkGoogleButton />}
      <footer>&copy; IIT Madras BS Degree.</footer>
    </section>
  )
}

function ClerkGoogleButton() {
  const { fetchStatus, signIn } = useSignIn()
  const [authError, setAuthError] = useState('')

  const handleGoogleSignIn = async () => {
    setAuthError('')

    try {
      const { error } = await signIn.sso({
        redirectCallbackUrl: `${window.location.origin}${SSO_CALLBACK_PATH}`,
        redirectUrl: `${window.location.origin}${APP_HOME_PATH}`,
        strategy: 'oauth_google',
      })

      if (error) {
        console.error(error)
        setAuthError('Login could not start. Please try again.')
      }
    } catch (error) {
      console.error(error)
      setAuthError('Login could not start. Please try again.')
    }
  }

  return (
    <>
      <button
        aria-label="Log in with Google"
        className="google-login-button"
        disabled={fetchStatus === 'fetching'}
        onClick={handleGoogleSignIn}
        type="button"
      >
        <img alt="Log in with Google" src="/assets/google-login.png" />
      </button>
      {authError ? (
        <p className="auth-error" role="alert">
          {authError}
        </p>
      ) : null}
    </>
  )
}

function PreviewGoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      aria-label="Log in with Google"
      className="google-login-button"
      onClick={onClick}
      type="button"
    >
      <img alt="Log in with Google" src="/assets/google-login.png" />
    </button>
  )
}

function ProtectedRoutes({ path, navigate }: { path: string; navigate: Navigate }) {
  const routePath = routePathFrom(path)

  if (routePath === '/view_score') {
    return <ScoreDetailsPage path={path} />
  }

  return <CourseWisePage navigate={navigate} />
}

function CourseWisePage({ navigate }: { navigate: Navigate }) {
  return (
    <section className="course-container">
      <div className="info-alert">This is before the sign-off of scores; it may change after the sign-off.</div>
      <div className="info-alert">For the respective question paper, you can check the SEEK portal.</div>

      <table className="score-table course-table">
        <thead>
          <tr>
            <th>EMAIL</th>
            <th>HALLTICKET</th>
            <th>COURSE CODE</th>
            <th>TOTAL SCORE</th>
            <th>VIEW</th>
          </tr>
        </thead>
        <tbody>
          {courseScores.map((course) => (
            <tr key={course.courseCode}>
              <td>{course.email}</td>
              <td>{course.hallticket}</td>
              <td>{course.courseCode}</td>
              <td>{course.totalScore}</td>
              <td>
                <button
                  aria-label="View score"
                  className="view-button"
                  onClick={() => navigate(`/view_score?course=${course.courseCode}`)}
                  type="button"
                >
                  <Eye aria-hidden="true" size={18} strokeWidth={3} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function ScoreDetailsPage({ path }: { path: string }) {
  const requestedCourse = new URLSearchParams(path.split('?')[1] ?? '').get('course') ?? 'HS1002'
  const rows = scoreRowsByCourse[requestedCourse] ?? scoreRowsByCourse.HS1002

  return (
    <section className="detail-container">
      <div className="detail-table-wrap">
        <table className="score-table detail-table">
          <colgroup>
            <col className="col-serial" />
            <col className="col-question" />
            <col className="col-type" />
            <col className="col-result" />
            <col className="col-score" />
            <col className="col-selected" />
            <col className="col-correct" />
            <col className="col-mark" />
            <col className="col-modification" />
            <col className="col-remarks" />
          </colgroup>
          <thead>
            <tr>
              <th>S.NO.</th>
              <th>Question ID</th>
              <th>Question Type</th>
              <th>Result</th>
              <th>Score</th>
              <th>Selected Option</th>
              <th>Correct Option</th>
              <th>Mark</th>
              <th>Modification of Question</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className={row.highlighted ? 'highlight-row' : undefined} key={row.serial}>
                <td>{row.serial}</td>
                <td>{row.questionId}</td>
                <td>{row.questionType}</td>
                <td>{row.result}</td>
                <td>{row.score}</td>
                <td>{row.selectedOption}</td>
                <td>{row.correctOption}</td>
                <td>{row.mark}</td>
                <td>{row.modification}</td>
                <td>{row.remarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
