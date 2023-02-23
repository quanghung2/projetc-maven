import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Pageable } from '@b3networks/api/common';
import { Contact } from '@b3networks/api/contact';
import { ID } from '@datorama/akita';
import { Observable } from 'rxjs';
import { catchError, delay, finalize, map, tap } from 'rxjs/operators';
import { MessageSearchResult } from '../channel/model/search-criteria.model';
import { PreviewMessageData } from '../chat/chat-message.model';
import { EmailMessageGeneral, EmailSearchCriteriaRequestV2 } from '../email/email-integration.model';
import { ConversationType, ConvoType, GroupType, MsgType, Status } from '../enums.model';
import { ChatMessage } from './../chat/chat-message.model';
import { ConversationGroupQuery } from './conversation-group.query';
import { ConversationGroupState, ConversationGroupStore } from './conversation-group.store';
import { GetConvoGroupReq } from './model/conversation-group-query.model';
import {
  ConversationGroup,
  ConversationGroupReq,
  ConversationGroupUI,
  ConversationMetadata,
  CustomerInfo,
  GetConvoGroupMemberResp,
  Member
} from './model/conversation-group.model';

@Injectable({ providedIn: 'root' })
export class ConversationGroupService {
  baseEmailURL = 'workspace/private/v1/emails/';
  baseConvoURLV1 = 'workspace/private/v1/group-conversations/';
  baseConvoURLV2 = 'workspace/private/v2/group-conversations/';

  convoNotFound: string[] = ['undefined', 'null'];

  constructor(private store: ConversationGroupStore, private http: HttpClient, private query: ConversationGroupQuery) {}

  getEmailConversationGroup(meChatUser: string, pageable: Pageable) {
    this.store.setLoading(true);
    const customerCriteria = new GetConvoGroupReq(<GetConvoGroupReq>{
      convoType: [GroupType.Email],
      status: [Status.opened]
    });

    let params: HttpParams = new HttpParams()
      .set('type', customerCriteria.convoType.toString())
      .set('status', customerCriteria.status.toString());

    params = params.set('page', pageable.page.toString()).set('size', pageable.perPage.toString());

    return this.http.get<ConversationGroup[]>(this.baseConvoURLV1 + `customers`, { params: params }).pipe(
      finalize(() => this.store.setLoading(false)),
      map(convos => convos.map(convo => new ConversationGroup(convo).withMeUuid(meChatUser))),
      tap((conversations: ConversationGroup[]) => {
        conversations.sort((a, b) => new Date(b.lastMessage).getTime() - new Date(a.lastMessage).getTime());
        this.store.upsertMany(conversations, { baseClass: ConversationGroup });
      })
    );
  }

  updateGroupConversation(convoGroupId: string, req: ConversationGroupReq): Observable<boolean> {
    this.store.setLoading(true);
    const url = this.baseConvoURLV1 + convoGroupId;
    return this.http.put<void>(url, req).pipe(
      finalize(() => this.store.setLoading(false)),
      map((data: any) => data.success)
    );
  }

  getConversationDetail(
    convoId: string,
    meChatUuid: string,
    isChildConvo: boolean = false
  ): Observable<ConversationGroup> {
    const params = new HttpParams().set('child', String(isChildConvo));
    return this.http.get<ConversationGroup>(this.baseConvoURLV1 + convoId, { params: params }).pipe(
      map(item => new ConversationGroup(item).withMeUuid(meChatUuid)),
      tap(
        convo => {
          this.store.upsert(convo.conversationGroupId, convo, { baseClass: ConversationGroup });
        },
        _ => this.convoNotFound.push(convoId)
      )
    );
  }

  getListConversationsDetail(convos: string[], meChatUuid: string) {
    const params = new HttpParams().set('groupIds', convos.join(','));
    return this.http.get<ConversationGroup>(this.baseConvoURLV2, { params: params }).pipe(
      map((res: any) => res.map(item => new ConversationGroup(item).withMeUuid(meChatUuid))),
      tap(data => {
        this.store.upsertMany(data, { baseClass: ConversationGroup });
      })
    );
  }

  // hack for whatsapp only to get `whatsappLastReceivedDate`
  getWhatsAppLiveChatDetail(convoId: string, contact: Contact, meChatUuid: string, type: GroupType, status: Status) {
    return this.http.get<any>(`/workspace/private/v2/group-conversations/${convoId}`).pipe(
      map(
        (res: Partial<ConversationGroup>) =>
          <Partial<ConversationGroup>>{
            conversationGroupId: convoId,
            conversations: [
              {
                conversationId: convoId,
                conversationType: ConversationType.public,
                members: res['participants'] || []
              }
            ],
            customerInfo: <CustomerInfo>{
              uuid: contact.uuid,
              name: contact.displayName
            },
            createdAt: res?.createdAt,
            createdBy: res?.createdBy,
            status: status,
            type: type,
            whatsappLastReceivedDate: res.whatsappLastReceivedDate
          }
      ),
      tap(convo => {
        this.store.upsertMany([new ConversationGroup({ ...convo }).withMeUuid(meChatUuid)], {
          baseClass: ConversationGroup
        });
      })
    );
  }

  getConversationGroupMembers(convoGroupId: string): Observable<GetConvoGroupMemberResp[]> {
    return this.http.get<GetConvoGroupMemberResp[]>(this.baseConvoURLV1 + convoGroupId + `/members`).pipe(
      catchError(() => []),
      tap(members => {
        this.store.update(convoGroupId, entity => {
          const conversations = entity.conversations.map(c => new ConversationMetadata(c));
          if (members.length > 0) {
            members.forEach(element => {
              const conversation = conversations.find(c => c.conversationId === element.conversationId);
              if (conversation) {
                conversation.members = element.members;
              }
            });
          } else {
            conversations.forEach(element => {
              element.members = [];
            });
          }
          return { conversations: conversations };
        });
      })
    );
  }

  addMembers(groupId: string, members: Partial<Member>[]) {
    return this.http.post(this.baseConvoURLV1 + groupId + `/members`, {
      members: members
    });
  }

  deleteMembers(groupId: string, memberIds: string[]) {
    this.store.setLoading(true);

    const body = { body: { members: memberIds } };
    return this.http.request('delete', this.baseConvoURLV1 + groupId + `/members`, body).pipe(
      // @TODO
      // Cash optimize BE
      // currently need to wait for DB effected
      delay(2000),
      finalize(() => this.store.setLoading(false))
    );
  }

  updateDescription(id: string, desc: string) {
    const req = { description: desc };
    return this.http.put<void>(this.baseConvoURLV1 + id, req).pipe(
      tap((status: any) => {
        if (status?.success) {
          this.store.update(entity => entity.conversationGroupId === id, {
            description: desc
          });
        }
      })
    );
  }

  closeConversation(id: string) {
    this.store.remove(id);
  }

  setActive(id: string) {
    if (id) {
      this.store.setActive(id);
    }
  }

  removeActive(id: ID) {
    if (!!id && this.query.hasActive(id)) {
      this.store.removeActive(id);
    }
  }

  markSeen(convoId: string) {
    this.store.update(convoId, { unreadCount: 0, mentionCount: 0 });
  }

  updateConvoViewState(convoId: string | string[], state: Partial<ConversationGroupUI>) {
    this.store.ui.update(convoId, state);
  }

  resetChannelViewStateHistory(channelId: string | string[]) {
    this.store.ui.update(channelId, entity => ({
      ...entity,
      loaded: false,
      loadedFirst: false,
      hasMore: false,
      toMillis: undefined,
      fromMillis: undefined
    }));
  }

  getPreviewLink(link: string) {
    return this.http.post<PreviewMessageData>('workspace/private/v1/previews', { url: link });
  }

  joinWhatsapp(convoId: string) {
    return this.http.post<void>(`workspace/private/v1/chat/${convoId}/join`, null);
  }

  addConversation2Store(convo: ConversationGroup) {
    this.store.upsert(convo.conversationGroupId, convo, { baseClass: ConversationGroup });
  }

  getDraftEmails(): Observable<ConversationGroup[]> {
    const query = new HttpParams().set('status', Status.temp);
    return this.http.get<ConversationGroup[]>(this.baseEmailURL + 'drafts', { params: query }).pipe(
      map(conversations => {
        if (conversations && conversations.length > 0) {
          return conversations.map(convo => new ConversationGroup(convo));
        } else {
          return [];
        }
      }),
      tap((conversations: ConversationGroup[]) => {
        this.store.upsertMany(conversations, { baseClass: ConversationGroup });
      })
    );
  }

  createNewConversationGroup(groupReq: ConversationGroupReq): Observable<ConversationGroup> {
    return this.http.post<ConversationGroup>(this.baseConvoURLV1, groupReq).pipe(
      map((data: ConversationGroup) => {
        data = new ConversationGroup(data);
        data.adaptLastMsgDisplay();
        return data;
      }),
      tap(convo => {
        this.store.upsert(convo.id, convo, { baseClass: ConversationGroup });
      })
    );
  }

  searchEmailConversation(
    text: string,
    from: number,
    to: number,
    limit: number = 20,
    type: 'search' | 'sent'
  ): Observable<MessageSearchResult> {
    text = text ? text.trim() : '';

    const params: HttpParams = new HttpParams()
      .set('text', text)
      .set('limit', limit.toString())
      .set('toMillis', to.toString())
      .set('fromMillis', from.toString())
      .set('mt', MsgType.email)
      .set('ct', ConvoType.email);

    return this.http.get<MessageSearchResult>(this.baseConvoURLV1 + `customers/` + type, { params: params });
  }

  public searchEmails(
    pagination: Pageable,
    criteria: EmailSearchCriteriaRequestV2,
    meUserUuid: string
  ): Observable<ConversationGroup[]> {
    let query = new HttpParams()
      .set('status', criteria.status)
      .set('perPage', pagination.perPage.toString())
      .set('page', pagination.page.toString());
    if (criteria.archivedBy && criteria.archivedBy !== 'all') {
      query = query.set('archivedBy', criteria.archivedBy);
    }
    if (criteria.snoozeBy && criteria.snoozeBy !== 'all') {
      query = query.set('snoozeBy', criteria.snoozeBy);
    }
    if (criteria.snoozeFrom > 0) {
      query = query.set('snoozeFrom', criteria.snoozeFrom.toString());
    }
    if (criteria.snoozeTo > 0) {
      query = query.set('snoozeTo', criteria.snoozeTo.toString());
    }
    if (criteria.inboxUuid) {
      query = query.set('inboxUuid', criteria.inboxUuid.toString());
    }

    this.store.setLoading(true);
    return this.http.get<ConversationGroup[]>(this.baseEmailURL, { params: query }).pipe(
      map(convos => convos.map(convo => new ConversationGroup(convo).withMeUuid(meUserUuid))),
      tap((conversations: ConversationGroup[]) => {
        conversations.map(convo => (convo.snoozeFrom = criteria.snoozeFrom));
        conversations.sort((a, b) => new Date(b.lastMessage).getTime() - new Date(a.lastMessage).getTime());
        this.store.upsertMany(conversations, { baseClass: ConversationGroup });
      }),
      finalize(() => this.store.setLoading(false))
    );
  }

  snoozeConversationGroup(groupId: string, snoozeTime: number) {
    const url = this.baseConvoURLV1 + `${groupId}/snooze`;
    return this.http.put<void>(url, { snoozeTime: snoozeTime });
  }

  deleteSnoozeConversation(groupId: string) {
    const url = this.baseConvoURLV1 + `${groupId}/snooze`;
    return this.http.delete<void>(url);
  }

  moveConversationToOtherInbox(groupId: string, inboxChannelUuid: string) {
    const url = this.baseConvoURLV1 + `${groupId}/moveToInbox`;
    return this.http.put<void>(url, { destInboxChannel: inboxChannelUuid });
  }

  getEmailContentByS3URL(s3Url: string): Observable<EmailMessageGeneral> {
    this.store.setLoading(true);
    return this.http.get<EmailMessageGeneral>(s3Url).pipe(finalize(() => this.store.setLoading(false)));
  }

  updateConversations2Store(convos: ConversationGroup[]) {
    this.store.upsertMany(convos, { baseClass: ConversationGroup });
  }

  updateLastMessage(convoId: string, message: ChatMessage) {
    if (!this.query.hasEntity(convoId)) {
      return;
    }

    this.store.update(convoId, { lastMsg: message });

    const ui = this.query.ui.getEntity(convoId);
    if (!this.query.storeIsDisconnected() && !!ui.toMillis && ui.toMillis < message.ts) {
      this.store.ui.update(convoId, { toMillis: message.ts });
    }
  }

  updateStateStore(data: Partial<ConversationGroupState>) {
    this.store.update(data);
  }
}
