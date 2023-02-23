import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { User, UserQuery } from '@b3networks/api/workspace';

@Component({
  selector: 'b3n-member-box',
  templateUrl: './member-box.component.html',
  styleUrls: ['./member-box.component.scss']
})
export class MemberBoxComponent implements OnInit {
  @Input() existingMembers: User[] = [];
  @Input() isAgentMember = false;
  @Output() memberIdsChanged: EventEmitter<string[]> = new EventEmitter();
  @ViewChild('memberInput', { static: false }) memberInput: ElementRef;

  members: User[] = [];
  filteredMembers: Observable<User[]>;

  agents: User[] = [];
  users: User[] = [];

  separatorKeysCodes = [ENTER, COMMA];
  memberCtrl = new UntypedFormControl();

  get notAddedMembers(): User[] {
    let temp = this.users.filter((item: User) => {
      return (
        item.isActive &&
        this.existingMembers &&
        this.existingMembers.find((t: User) => t.identityUuid === item.uuid) == null
      );
    });

    if (this.isAgentMember) {
      temp = temp.filter((x: User) => this.agents.findIndex(y => y.identityUuid === x.uuid) >= 0);
    }

    return temp.filter((item: User) => {
      return this.members && this.members.find((t: User) => t.uuid === item.uuid) == null;
    });
  }

  constructor(private userQuery: UserQuery) {
    this.filteredMembers = this.memberCtrl.valueChanges.pipe(
      startWith(null),
      map((name: string | null) => (typeof name === 'string' && name ? this.filter(name) : this.notAddedMembers))
    );
  }

  ngOnInit() {
    this.userQuery.selectAllAgents().subscribe(agents => (this.agents = agents));
    this.userQuery.users$.subscribe(users => (this.users = users));
  }

  filter(name: string) {
    return this.notAddedMembers.filter(
      member =>
        member.displayName.toLowerCase().indexOf(name.toLowerCase()) >= 0 ||
        this.getUserNameFromMail(member.email).toLowerCase().indexOf(name.toLowerCase()) >= 0
    );
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.memberCtrl.setValue(null);
    this.members.push(event.option.value);

    this.memberInput.nativeElement.value = '';
    this.memberIdsChanged.emit(this.members.map(x => x.uuid));
  }

  remove(member: any): void {
    const index = this.members.indexOf(member);

    if (index >= 0) {
      this.members.splice(index, 1);
      this.memberIdsChanged.emit(this.members.map(x => x.uuid));
    }
  }

  getUserNameFromMail(email: string): string {
    return email ? email.slice(0, email.indexOf('@')) : '';
  }
}
