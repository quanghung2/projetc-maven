export interface TakeNoteReq {
  session: string;
  code: string;
  note: string;
  tag: { [key: string]: string[] | string };
}
