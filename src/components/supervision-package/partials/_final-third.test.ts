import nunjucks from 'nunjucks'
import { JSDOM } from 'jsdom'
import { mpopNunjucksSetup } from '../../../utils/nunjucksFilters'

const env = nunjucks.configure(['src/components', 'node_modules/govuk-frontend/dist'], { autoescape: true })
mpopNunjucksSetup(env)

const renderPartial = (params = {}) => {
  const html = env.render('supervision-package/partials/_final-third.njk', { params })
  return new JSDOM(html).window.document
}

describe('_final-third partial', () => {
  it('renders the final third paragraph with the forename', () => {
    const document = renderPartial({ context: { name: { forename: 'Alex' } } })

    const paragraphs = Array.from(document.querySelectorAll('p.govuk-body'))
    const finalThirdParagraph = paragraphs.find(p => p.textContent?.includes('final third of the sentence'))

    expect(finalThirdParagraph?.textContent).toContain('Alex is in the final third of the sentence.')
  })

  it('renders the responsive management paragraph with the forename', () => {
    const document = renderPartial({ context: { name: { forename: 'Alex' } } })

    const paragraphs = Array.from(document.querySelectorAll('p.govuk-body'))
    const meetParagraph = paragraphs.find(p => p.textContent?.includes('responsive management'))

    expect(meetParagraph?.textContent).toContain(
      'Meet Alex if there is a need for responsive management, risk or enforcement activity.',
    )
  })

  it('renders both paragraphs', () => {
    const document = renderPartial({ context: { name: { forename: 'Alex' } } })

    const paragraphs = Array.from(document.querySelectorAll('p.govuk-body'))

    expect(paragraphs).toHaveLength(2)
  })

  it('renders the paragraphs without a forename', () => {
    const document = renderPartial({ context: { name: {} } })

    const paragraphs = Array.from(document.querySelectorAll('p.govuk-body'))
    const finalThirdParagraph = paragraphs.find(p => p.textContent?.includes('final third of the sentence'))

    expect(finalThirdParagraph?.textContent).toContain('is in the final third of the sentence.')
  })
})
