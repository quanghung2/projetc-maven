import { ViewUIStateCommon } from '../../enums.model';

export interface ChannelHyperspaceUI extends ViewUIStateCommon {
  id: string; // id entity

  // state file strorage
  file?: {
    loaded?: boolean; // load first
    page?: number; // 1
    perPage?: number; // 10,
    hasMore: boolean;
  };
}
