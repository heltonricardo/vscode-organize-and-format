import { workspace } from "vscode";
import { OperationAborted } from "../errors/operation-aborted";

export function validateInWorkspace(): void {
  if (workspace.workspaceFolders === undefined || workspace.workspaceFolders.length === 0) {
    throw new OperationAborted("Format Files requires an active workspace, please open a workspace and try again");
  }
}
