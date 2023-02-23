import { Component, OnInit } from '@angular/core';

import { History, HistoryService } from '../../shared';

@Component({
  selector: 'app-history-note-modal',
  templateUrl: './history-note-modal.component.html',
  styleUrls: ['./history-note-modal.component.css'],
  host: {
    class: 'ui modal'
  }
})
export class HistoryNoteModalComponent implements OnInit {
  public history: History;

  constructor(private historyService: HistoryService) {}

  ngOnInit() {}

  onSave(event) {
    this.historyService.update(this.history.txnUuid, {
      note: this.history.note
    });
  }
}
