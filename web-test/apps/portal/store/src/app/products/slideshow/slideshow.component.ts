import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SlideshowModalComponent } from '../slideshow-modal/slideshow-modal.component';

@Component({
  selector: 'store-slideshow',
  templateUrl: './slideshow.component.html',
  styleUrls: ['./slideshow.component.scss']
})
export class SlideshowComponent implements OnInit {
  activeImage: string;
  currentIndex = 0;
  timer;

  @Input() images: string[];
  @Input() width: number;
  @Input() height: number;

  constructor(public dialog: MatDialog) {}

  showSlideModal() {
    this.dialog.open(SlideshowModalComponent, {
      width: '880px',
      panelClass: 'slideshow-modal__container',
      data: { images: this.images },
      autoFocus: false
    });
  }

  ngOnInit() {
    if (this.images && this.images.length > 0) {
      this.activeImage = this.images[0];
      this.slide();
    }
  }

  changePhoto(url: string) {
    this.activeImage = url;
  }

  go2Index(index: number) {
    if (this.currentIndex !== index && this.images.length >= index && index >= 0) {
      this.currentIndex = index;
    }
  }

  next() {
    let index = this.currentIndex;
    index = this.images.length > index + 1 ? ++index : 0;
    this.go2Index(index);
  }

  private slide() {
    this.timer = window.setInterval(() => {
      this.next();
    }, 5000);
  }
}
