import { InteractiveBlockType } from '../enums.model';

export interface InteractiveMessageData {
  // for webhook message
  blocks: InteractiveBlock[];
}

export interface InteractiveBlock {
  type: InteractiveBlockType;
  text?: InteractiveBlock; // text maybe string or an UIItem depend on the type
  fields?: InteractiveBlock[];
  color: string;
}
