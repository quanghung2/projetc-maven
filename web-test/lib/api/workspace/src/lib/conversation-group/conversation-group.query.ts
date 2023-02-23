import { Injectable } from '@angular/core';
import { EntityUIQuery, QueryEntity } from '@datorama/akita';
import { Status } from '../enums.model';
import { ConversationGroupState, ConversationGroupStore, ConversationGroupUIState } from './conversation-group.store';
import { ConversationGroup, ConversationGroupUI } from './model/conversation-group.model';

@Injectable({ providedIn: 'root' })
export class ConversationGroupQuery extends QueryEntity<ConversationGroupState> {
  override ui: EntityUIQuery<ConversationGroupUIState>;
  loading$ = this.selectLoading();
  isDisconnected$ = this.select('isDisconnected');

  constructor(protected override store: ConversationGroupStore) {
    super(store);
    this.createUIQuery();
  }

  storeIsDisconnected() {
    return this.store.getValue()?.isDisconnected;
  }

  selectEmailConversation() {
    return this.selectAll({
      filterBy: entity => entity.isEmail,
      sortBy: (a, b) => new Date(b.lastMessage).getTime() - new Date(a.lastMessage).getTime()
    });
  }

  selectEmailAssignToMe() {
    return this.selectAll({
      filterBy: entity => entity.isEmailAssignedToMe,
      sortBy: (a, b) => new Date(b.lastMessage).getTime() - new Date(a.lastMessage).getTime()
    });
  }

  selectMyFollowingConversation() {
    return this.selectAll({
      filterBy: entity => entity.isFollowingConversationByMe,
      sortBy: (a, b) => new Date(b.lastMessage).getTime() - new Date(a.lastMessage).getTime()
    });
  }

  selectSnoozeEmail(identityUUId: string) {
    return this.selectAll({
      filterBy: entity => entity.isSnoozeConversationBelongToAgent(identityUUId),
      sortBy: (a, b) => new Date(b.lastMessage).getTime() - new Date(a.lastMessage).getTime()
    });
  }

  selectDraftEmailNotFetchDetail() {
    return this.selectAll({
      filterBy: entity => entity?.draft?.s3Key && !entity?.draft?.emailMessage,
      sortBy: (a, b) => new Date(b.draft.updatedAt).getTime() - new Date(a.draft.updatedAt).getTime()
    });
  }

  selectDraftEmail(identityUuid: string) {
    return this.selectAll({
      filterBy: entity => entity.isEmailConversationHasDraft(identityUuid),
      sortBy: (a, b) => new Date(b.draft.updatedAt).getTime() - new Date(a.draft.updatedAt).getTime()
    });
  }

  selectEmailAssignedToTeammates(identityUUId: string) {
    return this.selectAll({
      filterBy: entity => entity.isEmailAssignedToTeammates(identityUUId),
      sortBy: (a, b) => new Date(b.lastMessage).getTime() - new Date(a.lastMessage).getTime()
    });
  }

  getConvo(convoId: string) {
    return this.getEntity(convoId);
  }

  getConvosByChildId(convoChildId: string) {
    return this.getAll({
      filterBy: entity => entity.publicConversationId === convoChildId,
      limitTo: 1
    });
  }

  selectConvo(convoId: string) {
    return this.selectEntity(convoId);
  }

  selectConvoByEmailInboxUUid(emailInboxUUid: string) {
    return this.selectAll({
      filterBy: entity => entity.isOpen && entity.emailInboxUuid === emailInboxUUid,
      sortBy: (a, b) => new Date(b.lastMessage).getTime() - new Date(a.lastMessage).getTime()
    });
  }

  selectArchivedConvoByAgentID(identityUUId: string) {
    return this.selectAll({
      filterBy: entity => entity.status === Status.archived && (!identityUUId || entity.archivedBy === identityUUId)
    });
  }

  getConvosLoaded() {
    return this.ui.getAll({
      filterBy: entity => entity.loaded
    });
  }

  getConvoUiState(convoId: string) {
    return this.ui.getEntity(convoId);
  }

  selectUIState<K extends keyof ConversationGroupUI>(id: string, property: K) {
    return this.ui.selectEntity(id, property);
  }

  selectPropertyChannel<K extends keyof ConversationGroup>(id: string, property: K) {
    return this.selectEntity(id, property);
  }

  selectListConvoUiState(convoIds: string[]) {
    return this.ui.selectMany(
      convoIds,
      entity =>
        <ConversationGroupUI>{
          loaded: entity.loaded,
          conversationGroupId: entity.conversationGroupId,
          hasMore: entity.hasMore
        }
    );
  }
}
