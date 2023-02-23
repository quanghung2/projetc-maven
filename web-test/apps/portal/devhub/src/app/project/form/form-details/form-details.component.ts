import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoteService, NoteTemplate } from '@b3networks/api/data';
import { ItemType } from '../form-store-item/form-store-item.component';
import { StoreFormInput } from '../form-store/form-store.component';

@Component({
  selector: 'b3n-form-details',
  templateUrl: './form-details.component.html',
  styleUrls: ['./form-details.component.scss']
})
export class FormDetailsComponent implements OnInit {
  noteTemplate: NoteTemplate;
  ItemType = ItemType;
  constructor(@Inject(MAT_DIALOG_DATA) private data: StoreFormInput, private noteService: NoteService) {}

  ngOnInit(): void {
    this.noteService.getNoteTemplate(this.data.noteTemplate.templateUuid).subscribe(noteTemplate => {
      this.noteTemplate = noteTemplate;
    });
  }
}
