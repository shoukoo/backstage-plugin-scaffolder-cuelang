import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { executeShellCommand,fetchContents } from '@backstage/plugin-scaffolder-backend';
import { resolveSafeChildPath, UrlReader } from '@backstage/backend-common';
import { ScmIntegrations } from '@backstage/integration';
import fs from 'fs-extra';
import path from 'path';
import commandExists from 'command-exists';

export function cueFlowAction(options: {
  reader: UrlReader;
  integrations: ScmIntegrations;
}) {

  const {
    reader,
    integrations,
  } = options;

  return createTemplateAction<{
    url: string;
    cuePkg?: string;
    cueCmd?: string;
    cueOutDir?: string;
    targetPath?: string;
    values: any;

  }>({
    id: 'cue:cueflow',
    schema: {
      input: {
        type: 'object',
        required: ['url'],
        properties: {
          url: {
            title: 'Fetch URL',
            description:
              'Relative path or absolute URL pointing to the directory tree to fetch',
            type: 'string',
          },
          cuePkg: {
            title: 'Cue package name, default is "config"',
            description:
              'Cue package name',
            type: 'string',
          },
          cueCmd: {
            title: 'Cue command name, default is "run"',
            description:
              'Cue command name',
            type: 'string',
          },
          cueOutDir: {
            title: 'Cue output dir, default is "out"',
            description:
              'Cue output dir',
            type: 'string',
          },
          values: {
            title: 'Template Values',
            description: 'Values to pass on to the templating engine',
            type: 'object',
          },

          targetPath: {
            title: 'Target Path',
            description:
              'Target path within the working directory to generate contents to. Defaults to the working directory root.',
            type: 'string',
          },
        },
      },
    },
    async handler(ctx) {
      ctx.logger.info('Fetching template content from remote URL');
      const workDir = await ctx.createTemporaryDirectory();
      const templateDir = resolveSafeChildPath(workDir, 'template');


      // const targetPath = ctx.input.targetPath ?? './';
      // const outputDir = resolveSafeChildPath(ctx.workspacePath, targetPath);
      await fetchContents({
        reader,
        integrations,
        baseUrl: ctx.templateInfo?.baseUrl,
        fetchUrl: ctx.input.url,
        outputPath: templateDir,
      });

      await fs.writeJSON(path.join(templateDir, 'config.json'), ctx.input.values);

      // the command-exists package returns `true` or throws an error
      const cueInstalled = await commandExists('cue').catch(
        () => false,
      );

      const cuePkg = ctx.input.cuePkg ?? 'config';
      const cueCmd = ctx.input.cueCmd ?? 'run';
      const cueOutDir = ctx.input.cueOutDir ?? 'out';

      if (cueInstalled) {
        ctx.logger.info(`Importing config under ${cuePkg}`);
        await executeShellCommand({
          command: "cue",
          args: ["import", "-p", `${cuePkg}`, "config.json"],
          logStream: ctx.logStream,
          options: { cwd: templateDir },
        });
        ctx.logger.info('Verifying the schema of the config file');
        await executeShellCommand({
          command: "cue",
          args: ["vet", "-c", "./..."],
          logStream: ctx.logStream,
          options: { cwd: templateDir },
        });
        ctx.logger.info(`Calling cue cmd ${cueCmd}`);
        await executeShellCommand({
          command: "cue",
          args: ["cmd", `${cueCmd}`],
          logStream: ctx.logStream,
          options: { cwd: templateDir },
        });
      }

      const targetPath = ctx.input.targetPath ?? './';
      const outputPath = resolveSafeChildPath(ctx.workspacePath, targetPath);
      await fs.copy(`${templateDir}/${cueOutDir}`, outputPath);
    }
  });
};

