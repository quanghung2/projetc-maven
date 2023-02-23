import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Widget } from '@b3networks/api/inbox';
import { DomainUtilsService, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';

@Component({
  selector: 'app-generate-script',
  templateUrl: './generate-script.component.html',
  styleUrls: ['./generate-script.component.scss']
})
export class GenerateScriptComponent implements OnInit {
  script: string;
  constructor(
    public dialogRef: MatDialogRef<GenerateScriptComponent>,
    @Inject(MAT_DIALOG_DATA) public widget: Widget,
    private toastService: ToastService,
    private domainUtilsService: DomainUtilsService
  ) {}

  ngOnInit() {
    const domain = ['portal.hoiio.net', 'localhost'].includes(location.hostname)
      ? 'portal.hoiio.net'
      : this.domainUtilsService.domainPortal;
    this.script = `<script type="text/javascript">
      window.__CW = {
        orgUuid: '${X.orgUuid}',
        widgetUrl: 'https://${domain}/chat-widget',
        widgetUuid: '${this.widget.uuid}'
      };
      (function (d, id) {
        var js,
          fjs = d.getElementsByTagName('script')[0];
        if (d.getElementById(id)) return;
        js = d.createElement('script');
        js.id = id;
        js.src = 'https://${domain}/chat-widget/widget.js';
        fjs.parentNode.insertBefore(js, fjs);
      })(document, 'b3-chatwidget');
 </script>`;
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastService.error('Copy failed');
  }
}
