import { TextDocument, workspace } from "vscode";

export async function tryOpenDocument(path: string): Promise<TextDocument | undefined> {
  try {
    return await workspace.openTextDocument(path);
  } catch (error) {}
}
