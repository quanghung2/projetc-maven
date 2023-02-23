import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Item, NoteService, NoteTemplate } from '@b3networks/api/data';
import { finalize } from 'rxjs/operators';

export enum ItemType {
  Text = 'text',
  Textarea = 'textarea',
  Number = 'number',
  Option = 'options'
}

@Component({
  selector: 'b3n-view-config',
  templateUrl: './view-config.component.html',
  styleUrls: ['./view-config.component.scss']
})
export class ViewConfigComponent implements OnInit {
  loading: boolean;
  note: NoteTemplate;
  items: Item[] = [];
  item: Item;
  ItemType = ItemType;

  constructor(@Inject(MAT_DIALOG_DATA) public data: NoteTemplate, private noteService: NoteService) {}

  ngOnInit(): void {
    this.getNoteConfig();
  }

  getNoteConfig() {
    this.loading = true;
    this.noteService
      .getNoteTemplate(this.data.templateUuid)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(note => {
        this.note = note;
        this.items = this.note.items;
      });
  }

  removeItem(index: number) {
    this.items.splice(index, 1);
  }
}
