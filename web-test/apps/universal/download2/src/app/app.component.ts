import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private iconRegistry: MatIconRegistry, private sanitizer: DomSanitizer) {
    this._registerSvgIcons();
  }

  private _registerSvgIcons() {
    this.iconRegistry.addSvgIcon(
      'downloadFile',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/downloadFile.svg')
    );
  }
}
