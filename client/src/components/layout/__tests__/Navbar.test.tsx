import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { Navbar } from '../Navbar'

describe('Navbar (SCRUM-11)', () => {
  it('renders quick search, notifications, and admin identity block', () => {
    render(<Navbar onMenuToggle={vi.fn()} />)

    expect(screen.getByPlaceholderText('Quick search...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument()
    expect(screen.getByText('SA')).toBeInTheDocument()
    expect(screen.getByText('Super Admin')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('calls menu toggle handler on hamburger click', () => {
    const onMenuToggle = vi.fn()
    render(<Navbar onMenuToggle={onMenuToggle} />)

    fireEvent.click(screen.getByRole('button', { name: 'Toggle sidebar' }))
    expect(onMenuToggle).toHaveBeenCalledTimes(1)
  })
})
