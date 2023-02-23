import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Server } from '@b3networks/api/edgeserver';

@Component({
  selector: 'b3n-detail-server-dialog',
  templateUrl: './detail-server-dialog.component.html',
  styleUrls: ['./detail-server-dialog.component.scss']
})
export class DetailServerDialogComponent implements OnInit {
  constructor(@Inject(MAT_DIALOG_DATA) public server: Server) {}

  ngOnInit(): void {}
}
