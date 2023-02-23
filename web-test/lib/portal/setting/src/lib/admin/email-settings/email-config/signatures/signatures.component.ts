import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { EmailIntegrationQuery, EmailIntegrationService, EmailSignature } from '@b3networks/api/workspace';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { takeUntil } from 'rxjs/operators';
import { ToastService } from '@b3networks/shared/ui/toast';
import { MessageConstants } from '@b3networks/chat/shared/core';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { SignatureDetailDialogComponent } from './signature-detail-dialog/signature-detail-dialog.component';

@Component({
  selector: 'b3n-signatures',
  templateUrl: './signatures.component.html',
  styleUrls: ['./signatures.component.scss']
})
export class SignaturesComponent extends DestroySubscriberComponent implements AfterViewInit {
  signatures: EmailSignature[] = [];
  displayedColumns = ['displayName', 'senderName', 'status', 'action'];
  dataSource: MatTableDataSource<EmailSignature> = new MatTableDataSource<EmailSignature>(this.signatures);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  constructor(
    private emailService: EmailIntegrationService,
    private emailQuery: EmailIntegrationQuery,
    private toastService: ToastService,
    private dialog: MatDialog
  ) {
    super();
  }

  ngAfterViewInit() {
    this.emailQuery.signatures$.pipe(takeUntil(this.destroySubscriber$)).subscribe(signatures => {
      this.signatures = signatures;
      this.updateDataSource();
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.dataSource.filterPredicate = (data: EmailSignature, value: string): boolean => {
      return data.name.toLowerCase().indexOf(value) > -1 || data.senderInfo.toLowerCase().indexOf(value) > -1;
    };
  }

  viewDetail(selectedSignature: EmailSignature) {
    if (!selectedSignature) {
      selectedSignature = { id: 0 };
    }
    this.dialog.open(SignatureDetailDialogComponent, {
      width: '950px',
      data: { ...selectedSignature }
    });
  }

  private updateDataSource() {
    this.signatures.sort((a, b) => a.id - b.id);
    this.dataSource = new MatTableDataSource<EmailSignature>(this.signatures);
    this.dataSource.paginator = this.paginator;
  }

  setAsDefault($event: MouseEvent, signature: EmailSignature) {
    $event.stopPropagation();
    const updatedSignature: EmailSignature = { ...signature, isDefault: 'true' };

    this.emailService.updateSignature(updatedSignature).subscribe(
      () => {},
      error => {
        this.toastService.error(error && error.message ? error.message : MessageConstants.DEFAULT);
      }
    );
  }

  delete(isDelete: boolean, item: EmailSignature) {
    if (isDelete) {
      this.emailService.deleteSignature(item.id).subscribe();
    }
  }
}
