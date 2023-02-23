import { Component, OnInit } from '@angular/core';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { KeyValue } from '@angular/common';

@Component({
  selector: 'b3n-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent extends DestroySubscriberComponent implements OnInit {
  menus: KeyValue<string, string>[] = [];

  constructor() {
    super();
  }

  ngOnInit(): void {}
}
