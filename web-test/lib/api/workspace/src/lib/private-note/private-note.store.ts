import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { PrivateNote } from './private-note.model';

export interface PrivateNoteState extends EntityState<PrivateNote> {
  hasMore: boolean;
  page: number;
}

const initialState: PrivateNoteState = {
  hasMore: true,
  page: 0
};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'workspace_private_note', idKey: 'noteId' })
export class PrivateNoteStore extends EntityStore<PrivateNoteState> {
  constructor() {
    super(initialState);
  }

  updatePage(page: { hasMore: boolean; page: number }) {
    this.update(page);
  }
}
