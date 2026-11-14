import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="empty-state">
      <h1>Page not found</h1>
      <p>That address doesn&apos;t match any page here.</p>
      <p>
        <Link to="/">Go to the home page</Link> or{' '}
        <Link to="/analyze">analyze an article</Link>.
      </p>
    </div>
  )
}
