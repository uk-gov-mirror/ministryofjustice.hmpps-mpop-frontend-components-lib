import nunjucks from 'nunjucks'
import { JSDOM } from 'jsdom'
import { mpopNunjucksSetup } from '../../../utils/nunjucksFilters'

const env = nunjucks.configure(['src/components', 'node_modules/govuk-frontend/dist'], { autoescape: true })
mpopNunjucksSetup(env)

const renderPartial = (params = {}) => {
  const html = env.render('supervision-package/partials/_view-appointments.njk', { params })
  return new JSDOM(html).window.document
}

describe('_view-appointments partial', () => {
  it('does not render a link when allAppointmentsHref is missing', () => {
    const document = renderPartial({})

    expect(document.querySelector('a.govuk-link')).toBeNull()
  })

  describe('when the current phase is not final third', () => {
    it('renders a "View all appointments" link with the provided href', () => {
      const document = renderPartial({ allAppointmentsHref: '/appointments' })

      const link = document.querySelector('a.govuk-link')

      expect(link?.textContent?.trim()).toBe('View all appointments')
      expect(link?.getAttribute('href')).toBe('/appointments')
    })

    it('renders the "View all appointments" link for other phase codes', () => {
      const document = renderPartial({
        allAppointmentsHref: '/appointments',
        currentPhase: { phase: { code: 'STANDARD' } },
      })

      const link = document.querySelector('a.govuk-link')

      expect(link?.textContent?.trim()).toBe('View all appointments')
    })
  })

  describe('when the current phase is final third', () => {
    it('renders a "View last appointment" link with the provided href', () => {
      const document = renderPartial({
        allAppointmentsHref: '/appointments',
        currentPhase: { phase: { code: 'FTHRD' } },
      })

      const link = document.querySelector('a.govuk-link')

      expect(link?.textContent?.trim()).toBe('View last appointment')
      expect(link?.getAttribute('href')).toBe('/appointments')
    })
  })
})
