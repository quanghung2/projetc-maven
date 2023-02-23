import { Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CallerIdService } from '@b3networks/api/callerid-verification';
import { Pageable } from '@b3networks/api/common';
import { Flow, GenieExecuteRes, GenieService, OpenDialogFillParamsReq } from '@b3networks/api/infra';
import { ToastService } from '@b3networks/shared/ui/toast';
import Fuse from 'fuse.js';
import { combineLatest } from 'rxjs';
import { debounceTime, finalize, startWith, tap } from 'rxjs/operators';
import writeXlsxFile from 'write-excel-file';
import { ConfigB3WorksAppDialogComponent } from './config-b3works-app-dialog/config-b3works-app-dialog.component';
import { ConfigComplianceDialogComponent } from './config-compliance-dialog/config-compliance-dialog.component';
import { DownloadLogDialogComponent } from './download-log-dialog/download-log-dialog.component';
import { FillParamsDialogComponent } from './fill-params-dialog/fill-params-dialog.component';
import { ManageServiceComponent } from './manage-service/manage-service.component';
import { MappingToolDialogComponent } from './mapping-tool-dialog/mapping-tool-dialog.component';
import { RemoveBlacklistEmailComponent } from './remove-blacklist-email/remove-blacklist-email.component';
import { ShowResultDialogComponent } from './show-result-dialog/show-result-dialog.component';
import { SipConcurrentCallDialogComponent } from './sip-concurrent-call-dialog/sip-concurrent-call-dialog.component';
import { SmsBlacklistDialogComponent } from './sms-blacklist-dialog/sms-blacklist-dialog.component';
import { ToggleDemoDialogComponent } from './toggle-demo-dialog/toggle-demo-dialog.component';

@Component({
  selector: 'b3n-genie',
  templateUrl: './genie.component.html',
  styleUrls: ['./genie.component.scss']
})
export class GenieComponent implements OnInit {
  flowCtrl = new UntypedFormControl();
  searchCtrl = new UntypedFormControl();
  loading: boolean;
  flows: Flow[];
  filteredFlows: Flow[] = [];
  filteredSelectFlows: Flow[] = [];
  flowFilterCtrl = new UntypedFormControl();
  compareFlow(f1: Flow, f2: Flow): boolean {
    return !f1 || !f2 ? false : f1.name === f2.name;
  }

  constructor(
    private dialog: MatDialog,
    private genieService: GenieService,
    private callerIdService: CallerIdService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.genieService
      .getFlows()
      .pipe(
        tap(flows => {
          const extension = flows.find(f => f.name === 'extension');
          if (extension) {
            extension.flows.unshift('call mapping tool');
            extension.flows.unshift('download app logs');
          }

          const notification = flows.find(f => f.name === 'notification');
          if (notification) {
            notification.flows.push('enable B3Works app');
            notification.flows.push('disable B3Works app');
          }

          flows.push({
            name: 'organization',
            flows: ['toggle demo'],
            executing: []
          });

          flows.push({
            name: 'dnc',
            flows: ['config compliance'],
            executing: []
          });

          flows.push({
            name: 'sms global blacklist',
            flows: ['get', 'add', 'remove'],
            executing: []
          });

          flows.push({
            name: 'security policy',
            flows: ['managed service'],
            executing: []
          });

          const findSip = flows.findIndex(f => f.name === 'sip');
          flows[findSip].flows.push('ops update concurrent call');

          flows.map(f => (f.executing = new Array(f.flows.length).fill(false)));
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe(
        flows => {
          this.flows = flows.sort((a, b) => a.name.localeCompare(b.name));
          this.filteredSelectFlows = this.flows;
          this.flowCtrl.patchValue(this.filteredSelectFlows);
        },
        err => this.toastService.error(err.message)
      );

    this.flowFilterCtrl.valueChanges.subscribe((str: string) => {
      this.filteredSelectFlows = this.flows.filter(f => f.name.toLowerCase().indexOf(str.toLowerCase()) >= 0);
    });

    combineLatest([this.flowCtrl.valueChanges, this.searchCtrl.valueChanges.pipe(startWith(''))])
      .pipe(debounceTime(300))
      .subscribe(([flows, searchStr]) => {
        const str = searchStr.trim().toLowerCase();
        if (str === '') {
          this.filteredFlows = flows;
        } else {
          const result = [];
          flows.forEach((f: Flow) => {
            const options = { threshold: 0.3, includeScore: true };
            const fuse = new Fuse(f.flows, options);
            const data = fuse.search(str).map(r => r.item);
            if (data.length > 0) {
              const newFlow: Flow = { name: f.name, executing: f.executing, flows: data };
              result.push(newFlow);
            }
          });
          this.filteredFlows = result;
        }
      });
  }

  toggleSelectAll(selectAllValue: boolean) {
    if (selectAllValue) {
      this.flowCtrl.patchValue(this.filteredSelectFlows);
    } else {
      this.flowCtrl.patchValue([]);
    }
  }

  execute(category: string, flowName: string, i: number, j: number) {
    if (category === 'extension' && flowName === 'download app logs') {
      this.dialog.open(DownloadLogDialogComponent, {
        width: '500px',
        disableClose: true,
        autoFocus: false
      });
    } else if (category === 'sip' && flowName === 'ops update concurrent call') {
      this.dialog.open(SipConcurrentCallDialogComponent, {
        width: '400px',
        disableClose: true,
        autoFocus: false
      });
    } else if (category === 'security policy' && flowName === 'managed service') {
      this.dialog.open(ManageServiceComponent, {
        width: '800px',
        disableClose: true,
        autoFocus: false
      });
    } else if (category === 'extension' && flowName === 'call mapping tool') {
      this.dialog.open(MappingToolDialogComponent, {
        width: '700px',
        disableClose: true,
        autoFocus: true
      });
    } else if (category === 'organization' && flowName === 'toggle demo') {
      this.dialog.open(ToggleDemoDialogComponent, {
        width: '500px',
        disableClose: true,
        autoFocus: false
      });
    } else if (category === 'dnc' && flowName === 'config compliance') {
      this.dialog.open(ConfigComplianceDialogComponent, {
        width: '500px',
        disableClose: true,
        autoFocus: false
      });
    } else if (category === 'notification' && flowName === 'enable B3Works app') {
      this.dialog.open(ConfigB3WorksAppDialogComponent, {
        width: '500px',
        disableClose: true,
        autoFocus: false,
        data: true
      });
    } else if (category === 'notification' && flowName === 'disable B3Works app') {
      this.dialog.open(ConfigB3WorksAppDialogComponent, {
        width: '500px',
        disableClose: true,
        autoFocus: false,
        data: false
      });
    } else if (category === 'notification' && flowName === 'remove blacklist email') {
      this.dialog.open(RemoveBlacklistEmailComponent, {
        width: '500px',
        disableClose: true,
        autoFocus: false,
        data: true
      });
    } else if (category === 'sms global blacklist') {
      switch (flowName) {
        case 'get':
          this.getGlobalBlacklist(i, j);
          break;
        case 'add':
        case 'remove':
          this.dialog.open(SmsBlacklistDialogComponent, {
            width: '500px',
            disableClose: true,
            autoFocus: false,
            data: flowName
          });
          break;
      }
    } else {
      this.flows[i].executing[j] = true;
      this.genieService
        .execute({ flow: flowName, category: category, input: {} })
        .pipe(finalize(() => (this.flows[i].executing[j] = false)))
        .subscribe(
          res => {
            if (res.md) {
              this.openDialogShowResult(res.md);
            } else {
              this.toastService.success('Execute success');
            }
          },
          err => {
            if (err.code && err.params) {
              this.dialog
                .open(FillParamsDialogComponent, {
                  width: '400px',
                  disableClose: true,
                  data: <OpenDialogFillParamsReq>{ flow: flowName, category: category, params: err.params }
                })
                .afterClosed()
                .subscribe((res: GenieExecuteRes) => {
                  if (res.md) {
                    this.openDialogShowResult(res.md);
                  }
                });
            } else {
              this.toastService.error(err);
            }
          }
        );
    }
  }

  private async getGlobalBlacklist(i: number, j: number) {
    this.flows[i].executing[j] = true;
    const pageable: Pageable = { page: 1, perPage: 1000 };
    const strCsv = [];
    do {
      const curResult = await this.callerIdService.getGlobalBlacklist('', pageable).toPromise();
      curResult.content.forEach(str => {
        strCsv.push(str);
      });
      if (pageable.page * pageable.perPage < curResult.totalCount) {
        pageable.page += 1;
      } else {
        const schema = [{ type: String, value: text => text, width: 20 }];
        await writeXlsxFile(strCsv, {
          schema,
          fileName: `sms_blacklist_${new Date().toISOString().slice(0, 10)}.xlsx`
        });
        this.flows[i].executing[j] = false;
        break;
      }
    } while (1);
  }

  private openDialogShowResult(result: string) {
    this.dialog.open(ShowResultDialogComponent, {
      width: '700px',
      disableClose: true,
      autoFocus: false,
      data: result
    });
  }
}
