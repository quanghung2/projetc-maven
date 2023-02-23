import { Component, OnInit } from '@angular/core';

import { History, HistoryService } from '../../shared';

@Component({
  selector: 'app-history-archived-modal',
  templateUrl: './history-archived-modal.component.html',
  styleUrls: ['./history-archived-modal.component.css'],
  host: {
    class: 'ui modal'
  }
})
export class HistoryArchivedModalComponent implements OnInit {
  public history: History;

  constructor(private historyService: HistoryService) {}

  ngOnInit() {}
}
