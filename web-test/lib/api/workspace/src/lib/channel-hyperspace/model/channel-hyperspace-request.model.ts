import { ChannelType } from '../../channel/model/enum-channel.model';
import { Privacy } from '../../enums.model';

export enum RoleUserHyperspace {
  member = 'member',
  admin = 'admin'
}

export interface RequestNamespacesHyper {
  namespaceId?: string; // orgUuid;
  id?: string; // orgUuid; for new channel
  users?: {
    id: string;
    role: RoleUserHyperspace;
  }[]; // for add
  usersId?: string[]; //  for remove
}

export interface ReqCreateChannelHyper {
  hyperspaceId: string;
  hyperchannel: {
    name: string;
    description: string;
    privacy: Privacy;
    type: ChannelType;
    namespaces: RequestNamespacesHyper[];
  };
}

export interface ReqUpdateUsersChannelHyper {
  hyperspaceId: string;
  hyperchannelId: string;
  add?: RequestNamespacesHyper[];
  remove?: RequestNamespacesHyper[];
}

export interface ReqUpdateMetaDataHyper {
  hyperspaceId: string;
  hyperchannelId: string;
  description: string;
}
