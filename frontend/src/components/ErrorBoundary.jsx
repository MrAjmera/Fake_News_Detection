import { Component } from 'react'

// Catches rendering errors so one broken component shows a friendly message
// instead of a blank page. Error details are deliberately not shown or logged
// with user content.
export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="empty-state" role="alert">
        <h1>Something went wrong</h1>
        <p>
          This page hit an unexpected error. Your text was not saved anywhere.
          Reloading usually fixes it.
        </p>
        <p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </p>
      </div>
    )
  }
}
