import {
  AuthenticateWithRedirectCallback,
  SignOutButton,
  useAuth,
  useSignIn,
} from '@clerk/react'
import { Eye, Home, LogOut } from 'lucide-react'
import { ReactNode, useEffect, useState } from 'react'
import { courseScores, scoreRowsByCourse } from './data'

type AppProps = {
  clerkEnabled: boolean
}

type Navigate = (path: string) => void

const currentBrowserPath = () => `${window.location.pathname}${window.location.search}` || '/view_score'

function useCurrentPath(): [string, Navigate] {
  const [path, setPath] = useState(currentBrowserPath())

  useEffect(() => {
    const handlePopState = () => setPath(currentBrowserPath())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (nextPath: string) => {
    if (currentBrowserPath() !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }
    setPath(nextPath)
    window.scrollTo({ top: 0, left: 0 })
  }

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

  if (path === '/sso-callback') {
    return (
      <div className="auth-callback">
        <AuthenticateWithRedirectCallback
          signInForceRedirectUrl="/course_wise"
          signUpForceRedirectUrl="/course_wise"
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
    path.startsWith('/course_wise') ||
      new URLSearchParams(window.location.search).get('preview') === 'signed-in',
  )

  if (!signedIn) {
    return (
      <PageShell showNavigation={false} navigate={navigate}>
        <LoginPage
          onPreviewLogin={() => {
            setSignedIn(true)
            navigate('/course_wise')
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
        navigate('/view_score')
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
        <button className="brand-button" type="button" onClick={() => navigate('/course_wise')}>
          <img alt="IIT Madras Logo" className="iitm-logo" src="/assets/iitm-logo.png" />
          <span className="brand-text">SCORE CHECKER</span>
        </button>

        {showNavigation ? (
          <div className="navbar-links">
            <button className="nav-action" type="button" onClick={() => navigate('/course_wise')}>
              <Home aria-hidden="true" className="nav-icon filled-icon" />
              <span>Home</span>
            </button>
            {onPreviewLogout ? (
              <button className="nav-action" type="button" onClick={onPreviewLogout}>
                <LogOut aria-hidden="true" className="nav-icon" />
                <span>Logout</span>
              </button>
            ) : (
              <SignOutButton redirectUrl="/view_score">
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

  const handleGoogleSignIn = () => {
    void signIn.sso({
      redirectCallbackUrl: `${window.location.origin}/sso-callback`,
      redirectUrl: `${window.location.origin}/course_wise`,
      strategy: 'oauth_google',
    })
  }

  return (
    <button
      aria-label="Log in with Google"
      className="google-login-button"
      disabled={fetchStatus === 'fetching'}
      onClick={handleGoogleSignIn}
      type="button"
    >
      <img alt="Log in with Google" src="/assets/google-login.png" />
    </button>
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
  const routePath = path.split('?')[0]

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
