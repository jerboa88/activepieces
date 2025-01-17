import { WorkerSystemProp } from '@activepieces/server-shared'
import { ApEdition, ApFlagId, isNil, ThirdPartyAuthnProviderEnum } from '@activepieces/shared'
import { flagService } from '../../flags/flag.service'
import { FlagsServiceHooks } from '../../flags/flags.hooks'
import { system } from '../../helper/system/system'
import { platformService } from '../../platform/platform.service'
import { platformUtils } from '../../platform/platform.utils'
import { appearanceHelper } from '../helper/appearance-helper'

export const enterpriseFlagsHooks: FlagsServiceHooks = {
    async modify({ flags, request }) {
        const modifiedFlags = { ...flags }
        const hostUrl = resolveHostUrl(request.hostname)
        const platformId = await platformUtils.getPlatformIdForRequest(request)
        if (isNil(platformId)) {
            const edition = system.getEdition()
            if (edition === ApEdition.CLOUD) {
                modifiedFlags[ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP] = {
                    [ThirdPartyAuthnProviderEnum.GOOGLE]: true,
                }
            }
            return modifiedFlags
        }
        const platform = await platformService.getOneOrThrow(platformId)
        modifiedFlags[ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP] = {
            [ThirdPartyAuthnProviderEnum.GOOGLE]: !isNil(
                platform.federatedAuthProviders.google,
            ),
            [ThirdPartyAuthnProviderEnum.SAML]: !isNil(
                platform.federatedAuthProviders.saml,
            ),
        }
        modifiedFlags[ApFlagId.EMAIL_AUTH_ENABLED] = platform.emailAuthEnabled
        modifiedFlags[ApFlagId.SHOW_POWERED_BY_IN_FORM] = platform.showPoweredBy
        modifiedFlags[ApFlagId.THEME] = await appearanceHelper.getTheme({
            platformId,
        })
        modifiedFlags[ApFlagId.SHOW_COMMUNITY] = platform.showPoweredBy
        modifiedFlags[ApFlagId.SHOW_DOCS] = platform.showPoweredBy
        modifiedFlags[ApFlagId.SHOW_BILLING] = false
        modifiedFlags[ApFlagId.PROJECT_LIMITS_ENABLED] = true
        modifiedFlags[ApFlagId.CLOUD_AUTH_ENABLED] = platform.cloudAuthEnabled
        modifiedFlags[ApFlagId.FRONTEND_URL] = `${hostUrl}`
        modifiedFlags[ApFlagId.SAML_AUTH_ACS_URL] = `${hostUrl}/api/v1/authn/saml/acs`
        modifiedFlags[
            ApFlagId.WEBHOOK_URL_PREFIX
        ] = `${hostUrl}/api/v1/webhooks`
        modifiedFlags[ApFlagId.THIRD_PARTY_AUTH_PROVIDER_REDIRECT_URL] =
            flagService.getThirdPartyRedirectUrl(request.hostname, platformId)
        modifiedFlags[ApFlagId.OWN_AUTH2_ENABLED] = false
        return modifiedFlags
    },
}
function resolveHostUrl(hostname: string): string {
    const edition = system.getEdition()
    if (edition === ApEdition.CLOUD) {
        return `https://${hostname}`
    }
    const frontendUrl = system.getOrThrow(WorkerSystemProp.FRONTEND_URL)
    return removeTrailingSlash(frontendUrl)
}

function removeTrailingSlash(url: string): string {
    return url.endsWith('/') ? url.slice(0, -1) : url
}