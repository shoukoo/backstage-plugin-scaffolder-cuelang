# Backstage template action for Cuelang
This is a Cuelang actions plugin for the scaffolder-backend in Backstage.

This action utilises the Cue flow engine to dynamically generate templates, you can read more detail [here](https://cuetorials.com/go-api/workflows/custom/)

## Prerequisites
Ensure that Cuelang is properly installed in the Backstage instance

## Installation 
In the root directory of your Backstage project:
```bash 
yarn add --cwd packages/backend @shoukoo/backstage-plugin-scaffolder-cuelang
```
## Getting started
Add the actions to the scaffolder:
```

// packages/backend/src/plugins/scaffolder.ts

import { cueFlowAction } from "@shoukoo/backstage-plugin-scaffolder-cuelang"
import { ScmIntegrations } from '@backstage/integration';
import { createBuiltinActions, createRouter } from '@backstage/plugin-scaffolder-backend';

...

const integrations = ScmIntegrations.fromConfig(env.config);
const builtInActions = createBuiltinActions({
  catalogClient,
  integrations,
  config: env.config,
  reader: env.reader
});

const actions = [
  cueFlowAction({integrations,reader: env.reader,}),
  ...builtInActions
];

return await createRouter({
  logger: env.logger,
  config: env.config,
  database: env.database,
  reader: env.reader,
  catalogClient,
  actions
});
```
