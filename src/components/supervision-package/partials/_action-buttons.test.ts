import nunjucks from 'nunjucks'
import { JSDOM } from 'jsdom'
import { mpopNunjucksSetup } from '../../../utils/nunjucksFilters'

const env = nunjucks.configure(['src/components', 'node_modules/govuk-frontend/dist'], { autoescape: true })
mpopNunjucksSetup(env)

const renderPartial = (params = {}) => {
  const html = env.render('supervision-package/partials/_action-buttons.njk', { params })
  return new JSDOM(html).window.document
}

const inCustodySentences = [{ custody: { status: { code: 'C', description: 'In custody' } } }]
const atLargeSentences = [{ custody: { location: { code: 'UATLRG' } } }]

describe('_action-buttons partial', () => {
  describe('button group visibility', () => {
    it('renders the button group when not in custody, not at large, not final third and an action is available', () => {
      const document = renderPartial({ arrangeAppointmentHref: '/arrange' })

      expect(document.querySelector('.govuk-button-group')).not.toBeNull()
    })

    it('does not render the button group when no action is available', () => {
      const document = renderPartial({})

      expect(document.querySelector('.govuk-button-group')).toBeNull()
    })

    it('does not render the button group when the person is in custody', () => {
      const document = renderPartial({
        arrangeAppointmentHref: '/arrange',
        context: { sentences: inCustodySentences },
      })

      expect(document.querySelector('.govuk-button-group')).toBeNull()
    })

    it('does not render the button group when the person is at large', () => {
      const document = renderPartial({
        arrangeAppointmentHref: '/arrange',
        context: { sentences: atLargeSentences },
      })

      expect(document.querySelector('.govuk-button-group')).toBeNull()
    })

    it('does not render the button group when the current phase is final third', () => {
      const document = renderPartial({
        arrangeAppointmentHref: '/arrange',
        currentPhase: { phase: { code: 'FTHRD' } },
      })

      expect(document.querySelector('.govuk-button-group')).toBeNull()
    })
  })

  describe('arrange an appointment button', () => {
    it('renders the arrange an appointment button with the provided href', () => {
      const document = renderPartial({ arrangeAppointmentHref: '/arrange-appointment' })

      const button = Array.from(document.querySelectorAll('a.govuk-button')).find(a =>
        a.textContent?.includes('Arrange an appointment'),
      )

      expect(button?.getAttribute('href')).toBe('/arrange-appointment')
    })

    it('does not render the arrange an appointment button when arrangeAppointmentHref is missing', () => {
      const document = renderPartial({ crn: 'X123456', deliusBaseURL: 'https://delius.example.com' })

      const button = Array.from(document.querySelectorAll('a.govuk-button')).find(a =>
        a.textContent?.includes('Arrange an appointment'),
      )

      expect(button).toBeUndefined()
    })
  })

  describe('update NDelius risk flag button', () => {
    it('renders the update NDelius risk flag button with a deeplink built from crn and deliusBaseURL', () => {
      const document = renderPartial({ crn: 'X123456', deliusBaseURL: 'https://delius.example.com' })

      const button = Array.from(document.querySelectorAll('a.govuk-button')).find(a =>
        a.textContent?.includes('Update NDelius risk flag'),
      )

      expect(button?.getAttribute('href')).toBe(
        'https://delius.example.com/NDelius-war/delius/JSP/deeplink.xhtml?component=RegisterSummary&CRN=X123456',
      )
      expect(button?.classList.contains('govuk-button--secondary')).toBe(true)
    })

    it('does not render the update NDelius risk flag button when crn is missing', () => {
      const document = renderPartial({
        arrangeAppointmentHref: '/arrange',
        deliusBaseURL: 'https://delius.example.com',
      })

      const button = Array.from(document.querySelectorAll('a.govuk-button')).find(a =>
        a.textContent?.includes('Update NDelius risk flag'),
      )

      expect(button).toBeUndefined()
    })

    it('does not render the update NDelius risk flag button when deliusBaseURL is missing', () => {
      const document = renderPartial({ arrangeAppointmentHref: '/arrange', crn: 'X123456' })

      const button = Array.from(document.querySelectorAll('a.govuk-button')).find(a =>
        a.textContent?.includes('Update NDelius risk flag'),
      )

      expect(button).toBeUndefined()
    })
  })

  it('renders both buttons when all details are provided', () => {
    const document = renderPartial({
      arrangeAppointmentHref: '/arrange',
      crn: 'X123456',
      deliusBaseURL: 'https://delius.example.com',
    })

    const buttons = Array.from(document.querySelectorAll('a.govuk-button'))

    expect(buttons).toHaveLength(2)
  })
})
