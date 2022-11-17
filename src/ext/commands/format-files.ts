import { commands, ProgressLocation, Uri, ViewColumn, window } from 'vscode';
import { tryOpenDocument } from './try-open-document';
import { OperationAborted } from '../errors/operation-aborted';
import { Config } from '../utilities/config';

export async function formatFiles(files: Uri[]): Promise<void> {
  const incrementProgressBy = (1 / files.length) * 100;

  await window.withProgress(
    {
      cancellable: true,
      location: ProgressLocation.Notification,
      title: 'formatting documents',
    },
    async (progress, token) => {
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        if (token.isCancellationRequested) {
          const message = `Operation cancelled. Processed ${index} files.`;
          await showModal(message);
          throw new OperationAborted(message);
        }
        progress.report({ message: file.fsPath, increment: incrementProgressBy });
        await formatFile(file);
      }

      if (!token.isCancellationRequested) {
        await showModal(`Format Files completed. Processed ${files.length} files.`);
      }
    });
}

async function showModal(message: string): Promise<void> {
  await window.showInformationMessage(message, { modal: true });
}

async function formatFile(file: Uri): Promise<void> {
  const doc = await tryOpenDocument(file.path);

  if (doc) {
    await window.showTextDocument(doc, { preview: false, viewColumn: ViewColumn.One });
    await commands.executeCommand('editor.action.organizeImports');
    await commands.executeCommand('editor.action.formatDocument');
    await commands.executeCommand('workbench.action.files.save');
    await commands.executeCommand('workbench.action.closeActiveEditor');
  }
}