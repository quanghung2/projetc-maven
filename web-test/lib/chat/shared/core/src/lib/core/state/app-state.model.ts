import { ElementRef } from '@angular/core';
import { Channel, ChannelHyperspace, ChatMessage, ReplyMessage, User, UserHyperspace } from '@b3networks/api/workspace';

export interface AppState {
  showMainSidebar: boolean;
  sidebarTabActive?: SidebarTabs;
  emailUWState?: EmailUWState;
  endTxnsUWState?: EndTxnsUWState;
  endTxnsUWOrgState?: EndTxnsUWState;

  showRightSidebar: boolean;
  showLeftSidebar: boolean;
  modeLeftSidebar: ModeSidebar;
  modeRightSidebar: ModeSidebar;

  mentionCountTeamChat: number;
  quillEditor: {
    triggerfocus: boolean;
  };
  triggerScrollBottomView: boolean;

  memberMenu: InfoShowMention;
}

export interface RightCLickMessage {
  xPosition: number;
  yPosition: number;
  menus: MenuMessageInfo[];
  message: ChatMessage;
  elr: ElementRef;
}

export interface MenuMessageInfo {
  key: MenuMsg;
  value: string;
  icon: string;
  dataReply?: ReplyMessage; // MenuMsg.reply
}

export enum MenuMsg {
  reply = 'reply',
  jumpFromBookmark = 'jumpFromBookmark',
  jumpReply = 'jumpReply',
  removeBookmark = 'removeBookmark',
  addBookmark = 'addBookmark',
  copyLink = 'copyLink',
  editMessage = 'editMessage',
  deleteMessage = 'deleteMessage'
}

export interface InfoShowMention {
  xPosition: number;
  yPosition: number;
  member: User | UserHyperspace;
  convo: Channel | ChannelHyperspace;
}

export enum ModeSidebar {
  over = 'over',
  side = 'side',
  push = 'push'
}

export enum SidebarTabs {
  teamchat = 'teamchat',
  inbox = 'inbox',
  team_inbox = 'team_inbox',
  email = 'email'
}

export interface EmailUWState {
  isExpandPersonal: boolean;
  isExpandTeam: boolean;
  isExpandTeammate: boolean;
}

export interface EndTxnsUWState {
  page?: number;
  perPage?: number;
  hasMore?: boolean;
}
