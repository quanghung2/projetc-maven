import { Component, OnInit } from '@angular/core';

import { History, HistoryStatus, HistoryService } from '../../shared';

@Component({
  selector: 'app-history-archive-modal',
  templateUrl: './history-archive-modal.component.html',
  styleUrls: ['./history-archive-modal.component.css'],
  host: {
    class: 'ui modal'
  }
})
export class HistoryArchiveModalComponent implements OnInit {
  public history: History;

  constructor(private historyService: HistoryService) {}

  ngOnInit() {}

  onArchive(event) {
    this.historyService.archive(this.history.txnUuid).then(() => {
      this.history.status = HistoryStatus.ARCHIVED;
    });
  }
}
