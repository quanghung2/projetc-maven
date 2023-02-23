import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { MessageBody } from '../chat/chat-message.model';
import {
  AgentInbox,
  AgentNotification,
  CreateEmailInboxRequest,
  EmailConversationTag,
  EmailDraft,
  EmailInbox,
  EmailMessageGeneral,
  EmailRule,
  EmailSchedule,
  EmailSignature,
  EmailTag,
  EmailUploadRequest,
  SendEmailInboxRequest
} from './email-integration.model';
import { EmailIntegrationQuery } from './email-integration.query';
import { EmailIntegrationStore, EmailState } from './email-integration.store';

@Injectable({
  providedIn: 'root'
})
export class EmailIntegrationService {
  private baseURL = `workspace/private/v1/emails/`;

  constructor(private http: HttpClient, private store: EmailIntegrationStore, private query: EmailIntegrationQuery) {}

  sendEmail(req: SendEmailInboxRequest) {
    this.store.setLoading(true);
    const http = req.isCreate
      ? this.http.post('workspace/private/v1/emails', req)
      : this.http.put('workspace/private/v1/emails', req);
    return http.pipe(finalize(() => this.store.setLoading(false)));
  }

  saveDraft(body: EmailUploadRequest) {
    return this.http.post<EmailDraft>(this.baseURL + 'drafts', body);
  }

  deleteDraft(conversationGroupId: string) {
    this.store.setLoading(true);
    return this.http
      .delete(this.baseURL + `drafts/conversations/${conversationGroupId}`)
      .pipe(finalize(() => this.store.setLoading(false)));
  }

  getEmailSchedule(): Observable<EmailSchedule[]> {
    return this.http.get<EmailSchedule[]>(this.baseURL + 'schedules').pipe(
      tap(schedules => {
        this.store.update({
          schedules: schedules && schedules.length ? schedules : []
        });
      })
    );
  }

  createScheduleEmail(req: EmailUploadRequest) {
    return this.http.post<EmailSchedule>(this.baseURL + `schedules`, req).pipe(
      tap(_ => {
        this.getEmailSchedule().subscribe();
      })
    );
  }

  deleteEmailSchedule(emailScheduleId: number) {
    return this.http.delete(this.baseURL + `schedules/${emailScheduleId}`);
  }

  getSignatures(): Observable<EmailSignature[]> {
    return this.http.get<EmailSignature[]>(this.baseURL + `signatures`).pipe(
      tap(signatures => {
        this.store.update({
          signatures: signatures && signatures.length ? signatures : []
        });
      })
    );
  }

  createSignature(req: EmailSignature): Observable<EmailSignature> {
    this.store.setLoading(true);
    return this.http.post<EmailSignature>(this.baseURL + `signatures`, req).pipe(
      tap(_ => {
        let signatures = this.store.getValue().signatures;
        this.store.update({
          signatures: [...signatures, req]
        });
      }),
      finalize(() => this.store.setLoading(false))
    );
  }

  updateSignature(req: EmailSignature): Observable<EmailSignature> {
    this.store.setLoading(true);
    return this.http.put<EmailSignature>(this.baseURL + `signatures/${req.id}`, req).pipe(
      tap(_ => {
        const signatures = this.store.getValue().signatures;
        let remains: EmailSignature[] = signatures.filter(item => item.id !== req.id);
        if (req.isDefault === 'true') {
          remains = remains.map(item => ({ ...item, isDefault: 'false' }));
        }
        this.store.update({
          signatures: [...remains, req]
        });
      }),
      finalize(() => this.store.setLoading(false))
    );
  }

  deleteSignature(id: number) {
    return this.http.delete(this.baseURL + `signatures/${id}`).pipe(
      tap(_ => {
        const signatures = this.query.getValue().signatures;
        this.store.update({
          signatures: signatures.filter(signature => signature.id !== id)
        });
      })
    );
  }

  getTags(): Observable<EmailTag[]> {
    return this.http.get<EmailTag[]>(this.baseURL + `tags`).pipe(
      tap(tags => {
        this.store.update({
          tags: tags && tags.length ? tags : []
        });
      })
    );
  }

  createTag(req: EmailTag): Observable<EmailTag> {
    return this.http.post<EmailTag>(this.baseURL + `tags`, req).pipe(
      tap(newItem => {
        const tags = this.query.getValue().tags;
        this.store.update({
          tags: [...tags, newItem]
        });
      })
    );
  }

  updateTag(req: EmailTag): Observable<EmailTag> {
    return this.http.put<EmailTag>(this.baseURL + `tags/${req.id}`, req).pipe(
      tap(_ => {
        const tags = this.query.getValue().tags;
        const remains: EmailTag[] = tags.filter(item => item.id !== req.id);
        this.store.update({
          tags: [...remains, req]
        });
      })
    );
  }

  deleteTag(id: number) {
    return this.http.delete(this.baseURL + `tags/${id}`).pipe(
      tap(_ => {
        const tags = this.query.getValue().tags;
        this.store.update({
          tags: tags.filter(tag => tag.id !== id)
        });
      })
    );
  }

  createConversationTag(req: EmailConversationTag): Observable<EmailConversationTag> {
    return this.http.post<EmailConversationTag>(this.baseURL + `conversationTags`, req);
  }

  getConversationTags(convoGroupId: string): Observable<EmailConversationTag[]> {
    return this.http.get<EmailConversationTag[]>(this.baseURL + `conversationTags?conversationGroupId=${convoGroupId}`);
  }

  deleteConversationTag(convoGroupId: string, tagId: number) {
    return this.http.delete(this.baseURL + `conversationTags/${convoGroupId}/${tagId}`);
  }

  getInboxes(): Observable<EmailInbox[]> {
    return this.http.get<EmailInbox[]>(this.baseURL + `inboxes`).pipe(
      tap(inboxes => {
        this.store.update({
          inboxes: inboxes && inboxes.length ? inboxes : []
        });
      })
    );
  }

  createInbox(req: CreateEmailInboxRequest): Observable<EmailInbox> {
    return this.http.post<EmailInbox>(this.baseURL + `inboxes`, req).pipe(
      tap(newItem => {
        const inboxes = this.query.getValue().inboxes;
        this.store.update({
          inboxes: [...inboxes, newItem]
        });
      })
    );
  }

  updateInbox(req: EmailInbox): Observable<EmailInbox> {
    return this.http.put<EmailInbox>(this.baseURL + `inboxes/${req.uuid}`, req).pipe(
      tap(_ => {
        const inboxes = this.query.getValue().inboxes;
        const remains: EmailInbox[] = inboxes.filter(item => item.uuid !== req.uuid);
        this.store.update({
          inboxes: [...remains, req]
        });
      })
    );
  }

  deleteOrgInbox(inboxUuid: string) {
    return this.http.delete(this.baseURL + `inboxes/${inboxUuid}`).pipe(
      tap(_ => {
        const inboxes = this.query.getValue().inboxes;
        this.store.update({
          inboxes: inboxes.filter(inbox => inbox.uuid !== inboxUuid)
        });
      })
    );
  }

  getAgentInbox(): Observable<AgentInbox[]> {
    return this.http.get<AgentInbox[]>(this.baseURL + `agents/inboxes`, {}).pipe(
      tap(inboxes => {
        this.store.update({
          agentInboxes: inboxes && inboxes.length ? inboxes : []
        });
      })
    );
  }

  addAgentInbox(inboxUuid: string): Observable<AgentInbox> {
    return this.http.post<AgentInbox>(this.baseURL + `agents/inboxes/${inboxUuid}`, {}).pipe(
      tap(newItem => {
        const inboxes = this.query.getValue().agentInboxes;
        this.store.update({
          agentInboxes: [...inboxes, newItem]
        });
      })
    );
  }

  deleteAgentInbox(inboxUuid: string) {
    return this.http.delete(this.baseURL + `agents/inboxes/${inboxUuid}`).pipe(
      tap(_ => {
        const inboxes = this.query.getValue().agentInboxes;
        this.store.update({
          agentInboxes: inboxes.filter(inbox => inbox.inboxUuid !== inboxUuid)
        });
      })
    );
  }

  updateStore(property: Partial<EmailState>) {
    this.store.update(property);
  }

  getExceptionInboxes(): Observable<string[]> {
    return this.http.get<string[]>(this.baseURL + `inboxes/exceptions`).pipe(
      tap(inboxes => {
        this.store.update({
          exceptionInboxUuids: inboxes && inboxes.length ? inboxes : []
        });
      })
    );
  }

  getEmailBlobData(convoId: string, msgId: string, dataId: string): Observable<EmailMessageGeneral> {
    return this.http
      .get<MessageBody>(this.baseURL + `messages/${msgId}?convoId=${convoId}&dataId=${dataId}`)
      .pipe(map(item => item.data));
  }

  getAgentNotification(): Observable<AgentNotification> {
    return this.http.get<AgentNotification>(this.baseURL + `agents/notifications`).pipe(
      tap(notification => {
        this.store.update({
          agentNotification: notification
        });
      })
    );
  }

  updateAgentNotification(req: AgentNotification) {
    return this.http.put<AgentNotification>(this.baseURL + `agents/notifications`, req).pipe(
      tap(_ => {
        this.store.update({
          agentNotification: req
        });
      })
    );
  }

  getRules(): Observable<EmailRule[]> {
    return this.http.get<EmailRule[]>(this.baseURL + `rules`).pipe(
      tap(rules => {
        this.store.update({
          rules: rules
        });
      })
    );
  }

  createRule(req: EmailRule): Observable<EmailRule> {
    return this.http.post<EmailRule>(this.baseURL + `rules`, req).pipe(
      tap(_ => {
        const rules = this.query.getValue().rules;
        this.store.update({
          rules: [...rules, req]
        });
      })
    );
  }

  updateRule(req: EmailRule) {
    return this.http.put<EmailRule>(this.baseURL + `rules/${req.id}`, req).pipe(
      tap(_ => {
        const rules = this.query.getValue().rules;
        const remains: EmailRule[] = rules.filter(item => item.id !== req.id);
        this.store.update({
          rules: [...remains, req]
        });
      })
    );
  }

  deleteRule(id: number) {
    return this.http.delete(this.baseURL + `rules/${id}`).pipe(
      tap(_ => {
        const rules = this.query.getValue().rules;
        this.store.update({
          rules: rules.filter(inbox => inbox.id !== id)
        });
      })
    );
  }

  updateLoadedEmail(loaded: boolean) {
    this.store.update({
      loaded: loaded
    });
  }
}
