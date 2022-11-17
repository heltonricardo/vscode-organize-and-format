import { window } from 'vscode';
import { OperationAborted } from '../errors/operation-aborted';

export async function useDefaultExcludes(): Promise<boolean> {
  const result = await window.showQuickPick([`Yes - Use 'formatFiles' settings in vscode`, `No - Don't use excludes`], {
    placeHolder: 'Use default excludes?',
    ignoreFocusOut: true,
  });

  if (!result) {
    throw new OperationAborted('Selection was canceled');
  }

  return result.startsWith('Yes');
}
