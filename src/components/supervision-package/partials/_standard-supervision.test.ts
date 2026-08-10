import nunjucks from 'nunjucks'
import { JSDOM } from 'jsdom'
import { mpopNunjucksSetup } from '../../../utils/nunjucksFilters'

const env = nunjucks.configure(['src/components', 'node_modules/govuk-frontend/dist'], { autoescape: true })
mpopNunjucksSetup(env)

const renderPartial = (params = {}) => {
  const html = env.render('supervision-package/partials/_standard-supervision.njk', { params })
  return new JSDOM(html).window.document
}

describe('_standard-supervision partial', () => {
  describe('remaining appointments paragraph', () => {
    it('shows the "ends on" text when it is the first year', () => {
      const document = renderPartial({
        context: { name: { forename: 'Alex' } },
        currentYear: { isFirstYear: true, endDate: '2026-08-15', appointments: { allowance: 20, completed: 5 } },
      })

      const paragraphs = Array.from(document.querySelectorAll('p.govuk-body'))
      const remainingParagraph = paragraphs.find(p => p.textContent?.includes('supervision appointments remaining'))

      expect(remainingParagraph?.textContent).toContain(
        'Alex has 15 supervision appointments remaining until the supervision stage ends on 2026-08-15.',
      )
    })

    it('shows the "resets on" text when it is not the first year', () => {
      const document = renderPartial({
        context: { name: { forename: 'Alex' } },
        currentYear: { isFirstYear: false, endDate: '2026-08-15', appointments: { allowance: 20, completed: 5 } },
      })

      const paragraphs = Array.from(document.querySelectorAll('p.govuk-body'))
      const remainingParagraph = paragraphs.find(p => p.textContent?.includes('supervision appointments remaining'))

      expect(remainingParagraph?.textContent).toContain(
        'Alex has 15 supervision appointments remaining until the supervision package resets on 2026-08-15.',
      )
    })
  })

  describe('final third eligibility', () => {
    it('shows the eligible text with the final third date when eligible is true', () => {
      const document = renderPartial({
        context: {
          name: { forename: 'Alex' },
          finalThirdEligibility: { eligible: true },
          sentences: [{ custody: { finalThirdDate: '2026-11-07' } }],
        },
        currentYear: { isFirstYear: true, endDate: '2026-08-15', appointments: { allowance: 20, completed: 5 } },
      })

      const paragraphs = Array.from(document.querySelectorAll('p.govuk-body'))
      const finalThirdParagraph = paragraphs.find(p => p.textContent?.includes('final third stage'))

      expect(finalThirdParagraph?.textContent).toContain(
        'Alex is eligible to start the final third stage on 7 November 2026.',
      )
    })

    it('shows the not eligible text when eligible is false', () => {
      const document = renderPartial({
        context: {
          name: { forename: 'Alex' },
          finalThirdEligibility: { eligible: false },
          sentences: [{ type: { isCustodial: true } }],
        },
        currentYear: { isFirstYear: true, endDate: '2026-08-15', appointments: { allowance: 20, completed: 5 } },
      })

      const paragraphs = Array.from(document.querySelectorAll('p.govuk-body'))
      const finalThirdParagraph = paragraphs.find(p => p.textContent?.includes('final third stage'))

      expect(finalThirdParagraph?.textContent).toContain('Alex is not eligible for the final third stage.')
    })

    it('hides the final third paragraph when finalThirdEligibility is not provided', () => {
      const document = renderPartial({
        context: { name: { forename: 'Alex' } },
        currentYear: { isFirstYear: true, endDate: '2026-08-15', appointments: { allowance: 20, completed: 5 } },
      })

      const paragraphs = Array.from(document.querySelectorAll('p.govuk-body'))
      const finalThirdParagraph = paragraphs.find(p => p.textContent?.includes('final third stage'))

      expect(finalThirdParagraph).toBeUndefined()
    })
  })

  it('renders the progress bar using the current year appointments', () => {
    const document = renderPartial({
      currentYear: {
        isFirstYear: true,
        endDate: '2026-08-15',
        appointments: { allowance: 20, completed: 5, scheduled: 2 },
      },
      earlyEngagement: { weeks: 0 },
    })

    const paragraphs = Array.from(document.querySelectorAll('p.govuk-body'))
    const usedParagraph = paragraphs.find(p => p.textContent?.includes('appointments used'))

    expect(usedParagraph?.textContent?.trim()).toBe('5 of 20 appointments used')
  })

  describe('IOM red RAG guidance', () => {
    it('shows the IOM guidance when integratedOffenderManagementRedRated is true', () => {
      const document = renderPartial({
        context: { name: { forename: 'Alex' }, integratedOffenderManagementRedRated: true },
        currentYear: { isFirstYear: true, endDate: '2026-08-15', appointments: { allowance: 20, completed: 5 } },
      })

      const paragraphs = Array.from(document.querySelectorAll('p.govuk-body'))
      const iomParagraph = paragraphs.find(p => p.textContent?.includes('IOM red RAG status'))

      expect(iomParagraph?.textContent).toContain(
        'Alex has an IOM red RAG status. The maximum number of appointments is the same as tier A.',
      )
    })

    it('hides the IOM guidance when integratedOffenderManagementRedRated is false', () => {
      const document = renderPartial({
        context: { name: { forename: 'Alex' }, integratedOffenderManagementRedRated: false },
        currentYear: { isFirstYear: true, endDate: '2026-08-15', appointments: { allowance: 20, completed: 5 } },
      })

      const paragraphs = Array.from(document.querySelectorAll('p.govuk-body'))
      const iomParagraph = paragraphs.find(p => p.textContent?.includes('IOM red RAG status'))

      expect(iomParagraph).toBeUndefined()
    })

    it('hides the IOM guidance when context is not provided', () => {
      const document = renderPartial({
        context: { name: { forename: 'Alex' } },
        currentYear: { isFirstYear: true, endDate: '2026-08-15', appointments: { allowance: 20, completed: 5 } },
      })

      const paragraphs = Array.from(document.querySelectorAll('p.govuk-body'))
      const iomParagraph = paragraphs.find(p => p.textContent?.includes('IOM red RAG status'))

      expect(iomParagraph).toBeUndefined()
    })
  })

  describe('discretionary appointments guidance', () => {
    it('shows the discretionary appointments guidance for an eligible woman', () => {
      const document = renderPartial({
        tierScore: 'C',
        currentYear: { isFirstYear: true, endDate: '2026-08-15', appointments: { allowance: 20, completed: 5 } },
        context: { name: { forename: 'Alex' }, gender: 'Female' },
      })

      const paragraphs = Array.from(document.querySelectorAll('p.govuk-body'))
      const discretionaryParagraph = paragraphs.find(p => p.textContent?.includes('discretionary appointments'))

      expect(discretionaryParagraph?.textContent).toContain(
        'As a woman in tier C, Alex can have up to 5 additional discretionary appointments.',
      )
    })

    it('hides the discretionary appointments guidance for an ineligible tier', () => {
      const document = renderPartial({
        tierScore: 'A',
        currentYear: { isFirstYear: true, endDate: '2026-08-15', appointments: { allowance: 20, completed: 5 } },
        context: { name: { forename: 'Alex' }, gender: 'Female' },
      })

      const paragraphs = Array.from(document.querySelectorAll('p.govuk-body'))
      const discretionaryParagraph = paragraphs.find(p => p.textContent?.includes('discretionary appointments'))

      expect(discretionaryParagraph).toBeUndefined()
    })

    it('hides the discretionary appointments guidance when context is not provided', () => {
      const document = renderPartial({
        tierScore: 'C',
        currentYear: { isFirstYear: true, endDate: '2026-08-15', appointments: { allowance: 20, completed: 5 } },
        context: { name: { forename: 'Alex' } },
      })

      const paragraphs = Array.from(document.querySelectorAll('p.govuk-body'))
      const discretionaryParagraph = paragraphs.find(p => p.textContent?.includes('discretionary appointments'))

      expect(discretionaryParagraph).toBeUndefined()
    })
  })
})
