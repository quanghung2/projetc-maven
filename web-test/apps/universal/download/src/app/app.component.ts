import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(private iconRegistry: MatIconRegistry, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.registerSvgIcons();
  }

  private registerSvgIcons() {
    this.iconRegistry.addSvgIcon(
      'downloadFile',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/downloadFile.svg')
    );
  }
}
