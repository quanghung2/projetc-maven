import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Linkage } from './linkage.model';

@Injectable({
  providedIn: 'root'
})
export class LinkageService {
  constructor(private http: HttpClient) {}

  getLinkage(linkage: Partial<Linkage>): Observable<Linkage> {
    return this.http.get<Linkage>(`/store/cp/v1/linkages/sellers/${linkage.sellerUuid}/buyers/${linkage.buyerUuid}`);
  }

  createLinkage(linkage: Partial<Linkage>) {
    return this.http.post<Linkage>(`/store/cp/v1/linkages`, linkage);
  }

  updateLinkage(linkage: Partial<Linkage>) {
    return this.http.put<Linkage>(
      `/store/cp/v1/linkages/sellers/${linkage.sellerUuid}/buyers/${linkage.buyerUuid}`,
      linkage
    );
  }

  deleteLinkage(linkage: Partial<Linkage>) {
    return this.http.delete(`/store/cp/v1/linkages/sellers/${linkage.sellerUuid}/buyers/${linkage.buyerUuid}`);
  }
}
