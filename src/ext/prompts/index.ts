import { requestGlob } from './request-glob';
import { selectWorkspaceFolder } from './select-workspace-folder';
import { useDefaultExcludes } from './use-default-excludes';

const prompts = { requestGlob, useDefaultExcludes, selectWorkspaceFolder };

export default prompts;
