import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { FileExplorer, FileState } from './file.model';

function createInitState(): FileState {
  return <FileState>{
    fileExplorer: null
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'file_config' })
export class FileStore extends Store<FileState> {
  constructor() {
    super(createInitState());
  }

  updateStateFileExplorer(file: FileExplorer) {
    this.updateState({
      fileExplorer: Object.assign(this.getValue()?.fileExplorer || {}, file)
    });
  }

  private updateState(app: Partial<FileState>) {
    this.update(state => {
      return { ...state, ...app };
    });
  }
}
