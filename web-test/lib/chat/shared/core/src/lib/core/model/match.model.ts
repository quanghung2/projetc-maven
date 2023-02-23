export class Match {
  constructor(public type: number, public matched: string, public replaceString: string) {}
}

export enum MatchType {
  URL,
  EMAIL,
  MENTION,
  CHANNEL,
  EMOJI,
  // deprecated
  BLOCKQUOTE,
  CODE,
  BOLD,
  ITALIC,
  // other
  LINK,
  HIGHLIGHT_LINK,
  NEW_LINE,
  STRIKE
}
