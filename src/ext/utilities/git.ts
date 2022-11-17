import { execFileSync } from "child_process";
import { extensions, Uri } from "vscode";

export class Git {
  private _git = extensions.getExtension<GitExtension>("vscode.git")?.exports.getAPI(1);

  private get _gitexe(): string {
    return this._git?.git.path ?? "git";
  }

  public isIgnored(file: Uri): boolean {
    const repository = this._git?.repositories.find((repo) => file.path.includes(repo.rootUri.path));

    let ignored = false;

    if (repository) {
      try {
        // if exit code is 0, it is ignored
        this.executeGit({ args: ["check-ignore", "-q", file.fsPath], cwd: repository.rootUri.fsPath });
        ignored = true;
      } catch (error) {
        ignored = false;
      }
    }

    return ignored;
  }

  private executeGit(options: { cwd: string; args: string[] }): string {
    return execFileSync(this._gitexe, options.args, { cwd: options.cwd, encoding: "utf8" });
  }
}
