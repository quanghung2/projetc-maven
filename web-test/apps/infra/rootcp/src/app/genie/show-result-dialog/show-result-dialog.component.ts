import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MarkdownService } from '@b3networks/chat/shared/core';

@Component({
  selector: 'b3n-show-result-dialog',
  templateUrl: './show-result-dialog.component.html',
  styleUrls: ['./show-result-dialog.component.scss']
})
export class ShowResultDialogComponent implements OnInit {
  data: string;

  constructor(@Inject(MAT_DIALOG_DATA) public input: string, private markdownService: MarkdownService) {}

  ngOnInit(): void {
    this.data = this.markdownService.compile(this.input).text;
  }
}
