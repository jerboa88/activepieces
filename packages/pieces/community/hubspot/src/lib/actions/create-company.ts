import { hubspotAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { getDefaultPropertiesForObject, standardObjectDynamicProperties, standardObjectPropertiesDropdown} from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { MarkdownVariant } from '@activepieces/shared';
import { Client } from '@hubspot/api-client';

export const createCompanyAction = createAction({
	auth: hubspotAuth,
	name: 'create-company',
	displayName: 'Create Company',
	description: 'Creates a company in Hubspot.',
	props: {
		objectProperties: standardObjectDynamicProperties(OBJECT_TYPE.COMPANY, []),
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `### Properties to retrieve:
                            
                    name, domain, industry, about_us, phone, address, address2, city, state, zip, country, website, type, description, founded_year, hs_createdate, hs_lastmodifieddate, hs_object_id, is_public, timezone, total_money_raised, total_revenue, owneremail, ownername, numberofemployees, annualrevenue, lifecyclestage, createdate, web_technologies
                            
                    **Specify here a list of additional properties to retrieve**`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.COMPANY,
			displayName: 'Additional properties to retrieve',
			required: false,
		}),
	},
	async run(context) {
		const objectProperties = context.propsValue.objectProperties ?? {};
		const additionalPropertiesToRetrieve = context.propsValue.additionalPropertiesToRetrieve ?? [];

		const companyProperties: Record<string, string> = {};

		// Add additional properties to the companyProperties object
		Object.entries(objectProperties).forEach(([key, value]) => {
			// Format values if they are arrays
			companyProperties[key] = Array.isArray(value) ? value.join(';') : value;
		});

		const client = new Client({ accessToken: context.auth.access_token });

		const createdCompany = await client.crm.companies.basicApi.create({
			properties: companyProperties,
		});
		// Retrieve default properties for the comapny and merge with additional properties to retrieve
		const defaultcompanyProperties = getDefaultPropertiesForObject(OBJECT_TYPE.COMPANY);

		const companyDetails = await client.crm.companies.basicApi.getById(createdCompany.id, [
			...defaultcompanyProperties,
			...additionalPropertiesToRetrieve,
		]);

		return companyDetails;
	},
});