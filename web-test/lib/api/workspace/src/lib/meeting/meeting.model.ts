export class Meeting {
  conferenceRoomNumber: string;
  id: number;
  members: MeetingMember[];
  owner: MeetingMember;
  membersInMeeting: MeetingMember[];

  constructor(obj?: Partial<Meeting>) {
    if (!!obj) {
      Object.assign(this, obj);
      this.membersInMeeting = this.members;
      let foundmember = this.members.find(m => m.uuid === this.owner.uuid);
      if (!foundmember) {
        this.membersInMeeting.unshift(this.owner);
      }
    }
  }
}

export interface MeetingMember {
  uuid: string;
  name: string;
  photoUrl: string;
}
