import { workspace } from "vscode";

interface FormatFilesConfig {
  extensionsToInclude: string;
  excludePattern?: string;
  inheritWorkspaceExcludedFiles?: boolean;
  useGitIgnore?: boolean;
  excludedFolders?: string[];
  logLevel?: "debug" | "info" | "warn" | "error";
}

export class Config {
  private _excludeFiles: Record<string, boolean> = {};
  private _formatFilesConfig!: FormatFilesConfig;

  private constructor() {
    this.loadConfigFromWorkspace();
  }

  public static readonly instance = new Config();

  private loadConfigFromWorkspace(): void {
    this._formatFilesConfig = workspace
      .getConfiguration()
      .get<FormatFilesConfig>("formatFiles", { extensionsToInclude: "" });
    this._excludeFiles = workspace.getConfiguration().get<Record<string, boolean>>("files.exclude", {});
  }

  public get excludedFolders(): string[] {
    if (Array.isArray(this._formatFilesConfig.excludedFolders)) {
      return this._formatFilesConfig.excludedFolders;
    }

    return [];
  }

  public get extensionsToInclude(): string[] {
    let targetExtensions = this._formatFilesConfig.extensionsToInclude;

    // for backwards compatibility, remove { & } if present
    targetExtensions = targetExtensions.replace(/\{|\}/g, "");

    return targetExtensions
      .split(",")
      .map((ext) => ext.trim())
      .filter((ext) => !!ext);
  }

  public get excludePattern(): string {
    return this._formatFilesConfig.excludePattern ?? "";
  }

  public get inheritWorkspaceExcludedFiles(): boolean {
    return this._formatFilesConfig.inheritWorkspaceExcludedFiles ?? false;
  }

  public get workspaceExcludes(): string[] {
    return Object.keys(this._excludeFiles)
      .filter((glob) => this._excludeFiles[glob])
      .map((glob) => glob);
  }

  public get useGitIgnore(): boolean {
    return this._formatFilesConfig.useGitIgnore ?? true;
  }

  public static load(): void {
    const config = Config.instance;
    config.loadConfigFromWorkspace();
  }
}
