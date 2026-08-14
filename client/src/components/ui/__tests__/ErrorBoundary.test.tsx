// SCRUM-83 — ErrorBoundary component tests
// Verifies: AC-6 (error boundary catches failures, shows Try again, resets)

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ErrorBoundary } from '../ErrorBoundary'

// Suppress React's console.error output for expected error throws
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function StableChild() {
  return <div>All good</div>
}

function ThrowOnMount({ message = 'test error' }: { message?: string }) {
  throw new Error(message)
}

describe('ErrorBoundary', () => {
  it('renders children normally when no error occurs (AC-6)', () => {
    render(
      <ErrorBoundary>
        <StableChild />
      </ErrorBoundary>
    )
    expect(screen.getByText('All good')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('catches a render error and displays default fallback with role="alert" (AC-6)', () => {
    render(
      <ErrorBoundary>
        <ThrowOnMount />
      </ErrorBoundary>
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument()
  })

  it('renders a custom fallback node instead of the default when provided (AC-6)', () => {
    render(
      <ErrorBoundary fallback={<p>Custom fallback</p>}>
        <ThrowOnMount />
      </ErrorBoundary>
    )
    expect(screen.getByText('Custom fallback')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('resets error state and re-renders children after Try again click (AC-6)', () => {
    let shouldThrow = true

    function MaybeThrow() {
      if (shouldThrow) throw new Error('boom')
      return <div>Recovered</div>
    }

    render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()

    // Stop throwing before reset so the re-render succeeds
    shouldThrow = false
    fireEvent.click(screen.getByRole('button', { name: /Try again/i }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('Recovered')).toBeInTheDocument()
  })
})
