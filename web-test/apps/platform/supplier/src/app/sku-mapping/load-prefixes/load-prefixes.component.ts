import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'b3n-load-prefixs',
  templateUrl: './load-prefixes.component.html',
  styleUrls: ['./load-prefixes.component.scss']
})
export class LoadPrefixesComponent implements OnInit {
  prefixes = [];

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<LoadPrefixesComponent>) {
    this.prefixes = data;
  }

  ngOnInit(): void {}
}
