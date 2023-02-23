import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface SlideshowModalInput {
  images: string[];
}

@Component({
  selector: 'store-slideshow-modal',
  templateUrl: './slideshow-modal.component.html',
  styleUrls: ['./slideshow-modal.component.scss']
})
export class SlideshowModalComponent implements OnInit {
  currentIndex = 0;

  constructor(
    public dialogRef: MatDialogRef<SlideshowModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SlideshowModalInput
  ) {}

  ngOnInit() {}

  go2Index(index: number) {
    if (this.currentIndex !== index && this.data.images.length >= index && index >= 0) {
      this.currentIndex = index;
    }
  }

  next() {
    let index = this.currentIndex;
    index = this.data.images.length > index + 1 ? ++index : 0;
    this.go2Index(index);
  }

  previous() {
    let index = this.currentIndex;
    index = index === 0 ? this.data.images.length - 1 : --index;
    this.go2Index(index);
  }
}
