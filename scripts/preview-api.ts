/* eslint-disable no-console */
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
// eslint-disable-next-line import/no-extraneous-dependencies
import 'dotenv/config'
import sass from 'sass'

import nunjucks from 'nunjucks'
import { AgentConfig } from '@ministryofjustice/hmpps-rest-client'

import MPoPComponents from '../src/MPoPComponents'
import { mpopNunjucksSetup } from '../src/utils/nunjucksFilters'

const previewApiCss = sass.compile(fileURLToPath(new URL('./preview-api.scss', import.meta.url))).css

const env = nunjucks.configure(['src/components', 'node_modules/govuk-frontend/dist'], {
  autoescape: true,
})

mpopNunjucksSetup(env)

const environment = process.env.ENVIRONMENT ?? 'dev'

const tierApiUrlMap = {
  dev: 'https://hmpps-tier-dev.hmpps.service.justice.gov.uk',
  preprod: 'https://hmpps-tier-preprod.hmpps.service.justice.gov.uk',
  prod: 'https://hmpps-tier.hmpps.service.justice.gov.uk',
} as const

const ndeliusBaseUrlMap = {
  dev: 'https://ndelius.test.probation.service.justice.gov.uk',
  preprod: 'https://ndelius.pre-prod.delius.probation.hmpps.dsd.io',
  prod: 'https://ndelius.probation.service.justice.gov.uk',
} as const

const masApiUrlMap = {
  dev: 'https://manage-supervision-and-delius-dev.hmpps.service.justice.gov.uk',
  preprod: 'https://manage-supervision-and-delius-preprod.hmpps.service.justice.gov.uk',
  prod: 'https://manage-supervision-and-delius.hmpps.service.justice.gov.uk',
} as const

const tierHistoryUrlMap = {
  dev: 'https://tier-dev.hmpps.service.justice.gov.uk',
  preprod: 'https://tier-preprod.hmpps.service.justice.gov.uk',
  prod: 'https://tier.hmpps.service.justice.gov.uk',
} as const

const supervisionPackageApiUrlMap = {
  dev: 'https://supervision-packages-api-dev.hmpps.service.justice.gov.uk',
  preprod: 'https://supervision-packages-api-preprod.hmpps.service.justice.gov.uk',
  prod: 'https://supervision-packages-api.hmpps.service.justice.gov.uk',
} as const

const tierApiUrl = tierApiUrlMap[environment as keyof typeof tierApiUrlMap]
const masApiUrl = masApiUrlMap[environment as keyof typeof masApiUrlMap]
const supervisionPackageApiUrl = supervisionPackageApiUrlMap[environment as keyof typeof supervisionPackageApiUrlMap]
const ndeliusBaseUrl = ndeliusBaseUrlMap[environment as keyof typeof ndeliusBaseUrlMap]

const tierHistoryUrl = tierHistoryUrlMap[environment as keyof typeof tierHistoryUrlMap]

if (!tierApiUrl) {
  throw new Error(`Unknown environment: ${environment}`)
}

const getAuthToken = () =>
  execFileSync('bash', ['./scripts/get-auth-token.sh', environment], {
    encoding: 'utf8',
  }).trim()

async function main() {
  const crn = process.env.CRN

  if (!crn) {
    throw new Error('Missing CRN in .env')
  }

  const authToken = getAuthToken()

  const mpopComponents = new MPoPComponents(
    null as any,
    {
      url: tierApiUrl,
      timeout: {
        response: 5000,
        deadline: 5000,
      },
      agent: new AgentConfig(5000),
      masApiConfig: {
        url: masApiUrl,
        timeout: {
          response: 5000,
          deadline: 5000,
        },
        agent: new AgentConfig(5000),
      },
      supervisionPackageApiConfig: {
        url: supervisionPackageApiUrl,
        timeout: {
          response: 5000,
          deadline: 5000,
        },
        agent: new AgentConfig(5000),
      },
    },
    console,
  )

  const result = await mpopComponents.getTierDetails(authToken, crn)
  const { changeReason, tierScore, tag } = result.calculation
  const personalDetailsResponse = await mpopComponents.getPersonalDetails(authToken, crn)
  const supervisionPackageFrontendContextResponse = await mpopComponents.getSupervisionPackageFrontendContext(
    authToken,
    crn,
  )

  console.info(result)
  console.info(personalDetailsResponse)
  console.dir(supervisionPackageFrontendContextResponse, { depth: null })

  const { personalDetails } = personalDetailsResponse

  const supervisionPackageParams = {
    tierScore,
    tag,
    changeReason,
    historyHref: `${tierHistoryUrl}/v3/case/${crn}`,
    historyText: 'View tier change history',
    allAppointmentsHref: '#',
    arrangeAppointmentHref: '#',
    crn: personalDetails?.crn,
    deliusBaseURL: ndeliusBaseUrl,
    nextAppointmentHref: '#',
    ...(supervisionPackageFrontendContextResponse ?? {}),
  }

  const popHeaderParams = {
    crn,
    dob: personalDetails?.dateOfBirth ?? '',
    age: personalDetails?.age ?? null,
    tierScore,
    historyHref: `${tierHistoryUrl}/v3/case/${crn}`,
  }

  const html = env.renderString(
    `
{% from "supervision-package/macro.njk" import supervisionPackage %}
{% from "pop-header/macro.njk" import popHeader %}

<!DOCTYPE html>
<html lang="en" class="govuk-template">
<head>
  <meta charset="utf-8">
  <title>MPOP Component Preview</title>

  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/govuk-frontend@6.2.0/dist/govuk/govuk-frontend.min.css"
  >

  <style>${previewApiCss}</style>
</head>

<body class="govuk-template__body">
  <main class="govuk-main-wrapper">
    <div class="govuk-width-container">
      <h1 class="govuk-heading-l">MPOP Component Preview</h1>
        <hr class="govuk-section-break govuk-section-break--l govuk-section-break--visible">
        <h1 class="govuk-heading-l">PoP Header</h1>
        <div style="display: flex; justify-content: center;">
          <div style="width: 100%; max-width: 960px;">
            {{ popHeader(popHeaderParams) }}
          </div>
        </div>

        <hr class="govuk-section-break govuk-section-break--l govuk-section-break--visible">
        <h1 class="govuk-heading-l">Supervision Package</h1>
        {{ supervisionPackage(supervisionPackageParams) }}
    </div>
  </main>
</body>
</html>
`,
    { supervisionPackageParams, popHeaderParams },
  )

  fs.mkdirSync('preview', { recursive: true })
  fs.writeFileSync('preview/index-api.html', html)

  console.info('Preview written to preview/index-api.html')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
