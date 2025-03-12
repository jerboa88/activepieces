import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { activePieceAuth } from '../../index';

export const createTask = createAction({
  name: 'createTask',
  displayName: 'Create Task',
  description: 'Creates a task for a user, requiring them to respond or take action.',
  auth: activePieceAuth,
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the task',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of the task',
      required: false,
    }),
    assigneeId: Property.Dropdown({
      displayName: 'Assignee',
      description: 'The user to assign the task to',
      required: true,
      options: async ({ auth }, context) => {
        const baseApiUrl = (auth as any).baseApiUrl;
        const apiKey = (auth as any).apiKey;
        // TODO: need to make it get all pages and make the limit 100 not 1 page with all members
        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: `${baseApiUrl}/project-members?limit=1000&projectId=${context.project.id}`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: apiKey,  
          }
        };
        const res = await httpClient.sendRequest(request);
        if (res.status === 200) {
          return {
            options: res.body.data.map((projectMember: any) => ({
              value: projectMember.user.id,
              label: `${projectMember.user.firstName} ${projectMember.user.lastName}`,
            })),
          };
        }
        return {
          options: [],
        };
      },
      refreshers: [],
    }),
    statusOptions: Property.Json({
      displayName: 'Status Options',
      required: true,
      description: 'The status options of the task',
      defaultValue: {
        options: [
          {
            name: 'Example Status 1',
            description: 'Example Description 1',
            color: '#e5efe7',
            textColor: '#348848',
          },
        ],
      }
    }),
  },
  async run({ propsValue, auth, flows, run }) {
    const requestBody = {
      title: propsValue.title,
      description: propsValue.description,
      statusOptions: propsValue.statusOptions['options'],
      flowId: flows.current.id,
      runId: run.id,
      assigneeId: propsValue.assigneeId,
    };

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${auth.baseApiUrl}/manual-tasks`,
      body: requestBody,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.apiKey,
      },
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});
