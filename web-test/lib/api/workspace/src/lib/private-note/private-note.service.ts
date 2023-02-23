import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { AddReq, GetRequest, PrivateNote } from './private-note.model';
import { PrivateNoteQuery } from './private-note.query';
import { PrivateNoteStore } from './private-note.store';

const NOTE_SIZE = 10;

@Injectable({ providedIn: 'root' })
export class PrivateNoteService {
  constructor(
    private privateNoteQuery: PrivateNoteQuery,
    private privateNoteStore: PrivateNoteStore,
    private http: HttpClient
  ) {}

  get(groupId: string, isLoadmore: boolean = false): Observable<PrivateNote[]> {
    const req = new GetRequest(0, NOTE_SIZE);

    if (isLoadmore) {
      req.page = this.privateNoteQuery.getPage() + 1;
    }

    return this.http
      .get<PrivateNote[]>(`/workspace/private/v1/group-conversations/${groupId}/privateNotes`, {
        params: req.getHttpParam()
      })
      .pipe(
        map(list => list.map(x => new PrivateNote(x))),
        tap(notes => {
          this.privateNoteStore.setLoading(true);
          this.privateNoteStore.updatePage({ hasMore: notes.length === NOTE_SIZE, page: req.page });
          isLoadmore ? this.privateNoteStore.add(notes) : this.privateNoteStore.set(notes);
        })
      );
  }

  add(groupId: string, req: AddReq) {
    return this.http.post<PrivateNote>(`/workspace/private/v1/group-conversations/${groupId}/privateNotes`, req).pipe(
      map(note => new PrivateNote(<PrivateNote>{ ...note, txnUuid: groupId })),
      tap(note => {
        this.privateNoteStore.setLoading(true);
        this.privateNoteStore.add(note);
      })
    );
  }

  // max 10 txns
  getPrivateNotesByTxns(txns: string[]) {
    this.privateNoteStore.setLoading(true);
    const params = new HttpParams().append('txns', txns.join(','));
    return this.http
      .get<PrivateNote[]>(`/workspace/private/v1/group-conversations/privateNotes`, {
        params
      })
      .pipe(
        finalize(() => this.privateNoteStore.setLoading(false)),
        map(list => list.map(x => new PrivateNote(x))),
        tap(notes => {
          this.privateNoteStore.upsertMany(notes, { baseClass: PrivateNote });
        })
      );
  }
}
