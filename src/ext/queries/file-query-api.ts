import { Uri, WorkspaceFolder } from 'vscode';
import { fdir } from 'fdir';
import * as path from 'path';
import * as mm from 'micromatch';
import { Config } from '../utilities/config';

type FilterFn = (path: string, isDirectory: boolean) => boolean;

type WithGlobOptions = {
  glob: string;
  useDefaultExcludes: boolean;
};


export class FileQueryApi {
  private _config = Config.instance;

  private constructor(
    public readonly workspaceFolder: WorkspaceFolder,
    public readonly folderOrGlob?: Uri | string,
  ) { }

  public useDefaultExcludes = true;

  public static async getWorkspaceFiles(workspaceFolder: WorkspaceFolder, inFolder?: Uri): Promise<Uri[]> {
    return new FileQueryApi(workspaceFolder, inFolder).execute();
  }

  public static async getWorkspaceFilesWithGlob(workspaceFolder: WorkspaceFolder, options: WithGlobOptions): Promise<Uri[]> {
    const api = new FileQueryApi(workspaceFolder, options.glob);
    api.useDefaultExcludes = options.useDefaultExcludes;
    return api.execute();
  }

  private isByGlob(folderOrGlob?: Uri | string): folderOrGlob is string {
    return !!this.folderOrGlob && typeof this.folderOrGlob === 'string';
  }

  private isByFolder(folderOrGlob?: Uri | string): folderOrGlob is Uri {
    return folderOrGlob instanceof Uri;
  }

  private getIncludeFilter(): FilterFn | undefined {

    if (this.isByGlob(this.folderOrGlob)) {
      const glob = this.folderOrGlob;

      return (file): boolean => {
        const pathAsRelative = path.relative(this.workspaceFolder.uri.fsPath, file);
        const matches = mm.isMatch(pathAsRelative, glob);

        return matches;
      };
    } else if (this._config.extensionsToInclude.length) {
      const extensions = this._config.extensionsToInclude.map(ext => ext.startsWith('.') ? ext : '.' + ext);

      return (file): boolean => {
        const matches = extensions.some(e => file.endsWith(e));

        return matches;
      };
    }

  }

  private getExcludeFilter(): FilterFn | undefined {

    if (!this.useDefaultExcludes) {
      return;
    }

    const exclusions = this._config.excludePattern
      .split(',')
      .map(exclusion => exclusion.trim())
      .filter(exclusion => !!exclusion);

    if (this._config.inheritWorkspaceExcludedFiles) {
      this._config.workspaceExcludes.forEach((exc) => exclusions.push(exc));
    }

    const exclusionsGlob = `{${exclusions.join(',')}}`;

    return (file): boolean => {
      const pathAsRelative = path.relative(this.workspaceFolder.uri.fsPath, file);
      const ignored = mm.isMatch(pathAsRelative, exclusionsGlob);

      return !ignored;
    };
  }

  private async execute(): Promise<Uri[]> {

    let builder = new fdir().withFullPaths();
    const includeFilter = this.getIncludeFilter();

    if (includeFilter) {
      builder = builder.filter(includeFilter);
    }

    const excludeFilter = this.getExcludeFilter();
    if (excludeFilter) {
      builder = builder.filter(excludeFilter);
    }

    if (this._config.excludedFolders.length) {
      const excludedFolders = this._config.excludedFolders.map(folder => path.resolve(this.workspaceFolder.uri.fsPath, folder));
      builder = builder.exclude((_directoryName, directoryPath) => {
        return excludedFolders.some(excludedFolder => {
          return directoryPath.startsWith(excludedFolder);
        });
      });
    }


    const searcher = this.isByFolder(this.folderOrGlob)
      ? builder.crawl(this.folderOrGlob.fsPath) // search for specified folder
      : builder.crawl(this.workspaceFolder.uri.fsPath); // search within workspace folder

    const output: any = await searcher.withPromise();

    if (Array.isArray(output)) {
      return output.map(Uri.file);
    }


    return [];
  }
}