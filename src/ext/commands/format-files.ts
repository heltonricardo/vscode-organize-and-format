import { commands, ProgressLocation, Uri, ViewColumn, window } from "vscode";
import { OperationAborted } from "../errors/operation-aborted";
import { tryOpenDocument } from "./try-open-document";

export async function formatFiles(files: Uri[]): Promise<void> {
  const incrementProgressBy = (1 / files.length) * 100;

  await window.withProgress(
    {
      cancellable: true,
      location: ProgressLocation.Notification,
      title: "formatting documents",
    },
    async (progress, token) => {
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        if (token.isCancellationRequested) {
          throw new OperationAborted();
        }
        progress.report({ message: file.fsPath, increment: incrementProgressBy });
        await formatFile(file);
      }
    }
  );
}

async function formatFile(file: Uri): Promise<void> {
  const doc = await tryOpenDocument(file.path);

  if (doc) {
    await window.showTextDocument(doc, { preview: false, viewColumn: ViewColumn.One });
    await commands.executeCommand("editor.action.organizeImports");
    await commands.executeCommand("editor.action.formatDocument");
    await commands.executeCommand("workbench.action.files.save");
    await commands.executeCommand("workbench.action.closeActiveEditor");
  }
}
