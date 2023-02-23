import { Component, OnInit } from '@angular/core';
import { InboxesService } from '@b3networks/api/inbox';

@Component({
  selector: 'b3n-chats',
  templateUrl: './chats.component.html',
  styleUrls: ['./chats.component.scss']
})
export class ChatsComponent implements OnInit {
  constructor(private inboxesService: InboxesService) {}

  ngOnInit(): void {
    this.inboxesService.getAll().subscribe();
  }
}
