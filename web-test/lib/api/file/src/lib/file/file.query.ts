import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { FileState } from './file.model';
import { FileStore } from './file.store';

@Injectable({ providedIn: 'root' })
export class FileQuery extends Query<FileState> {
  fileExplorer$ = this.select(state => state.fileExplorer);

  constructor(protected override store: FileStore) {
    super(store);
  }
}
