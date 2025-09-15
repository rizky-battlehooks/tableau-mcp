import { makeApi, makeEndpoint, ZodiosEndpointDefinitions } from '@zodios/core';
import { z } from 'zod';

export type GraphQLResponse = any;

const graphqlEndpoint = makeEndpoint({
  method: 'post',
  path: '/graphql',
  alias: 'graphql',
  response: z.any(),
  parameters: [
    {
      name: 'query',
      type: 'Body',
      schema: z.object({
        query: z.string(),
      }),
    },
  ],
});

const metadataApi = makeApi([graphqlEndpoint]);
export const metadataApis = [...metadataApi] as const satisfies ZodiosEndpointDefinitions;
