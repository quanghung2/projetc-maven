import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { Invoice, InvoiceStatus, SearchInvoiceReq } from './user-invoice.model';
import { UserInvoiceStore } from './user-invoice.store';

@Injectable({
  providedIn: 'root'
})
export class UserInvoiceService {
  constructor(private http: HttpClient, private userInvoiceStore: UserInvoiceStore) {}

  searchInvoices(req: SearchInvoiceReq): Observable<Invoice[]> {
    const requestParam = new HttpParams()
      .append('startDate', req.startDate.toString())
      .append('endDate', req.endDate.toString())
      .append('awaitingPayment', req.awaitingPayment.toString())
      .append('paid', req.paid.toString());

    this.userInvoiceStore.setLoading(true);
    return this.http
      .get<Invoice[]>(`/invoice/private/v2/user/invoices/search`, { params: requestParam })
      .pipe(
        map(invoices => invoices.map(item => new Invoice(item))),
        tap(res => this.userInvoiceStore.set(res)),
        finalize(() => this.userInvoiceStore.setLoading(false))
      );
  }

  exportPdf(invoiceNumber: string): Observable<any> {
    return this.http.get(`/invoice/private/v2/user/invoices/${invoiceNumber}/pdf`, { responseType: 'blob' });
  }

  updateFilterDate(date: Date) {
    this.userInvoiceStore.updateFilterDate(date);
  }

  updateSlectedStatus(invoiceStatus: InvoiceStatus) {
    this.userInvoiceStore.updateSelectedStatus(invoiceStatus);
  }
}
