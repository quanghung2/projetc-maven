import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { FillterSkillCatalog, SkillCatalog } from './skill-catalog.model';
import { SkillCatalogStore } from './skill-catalog.store';

@Injectable({
  providedIn: 'root'
})
export class SkillCatalogService {
  constructor(private skillCatalogStore: SkillCatalogStore, private http: HttpClient) {}

  getSkills(filter: FillterSkillCatalog): Observable<SkillCatalog[]> {
    let httpParams = new HttpParams();
    const keys = Object.keys(filter);
    keys.forEach(value => {
      if (keys[value]) {
        httpParams = httpParams.append(value, keys[value]);
      }
    });

    this.skillCatalogStore.setLoading(true);
    return this.http
      .get<SkillCatalog[]>(`intelligence-gateway/private/catalog/skills`, { params: httpParams })
      .pipe(
        map(resp => resp.map(item => new SkillCatalog(item))),
        finalize(() => this.skillCatalogStore.setLoading(false)),
        tap(config => {
          this.skillCatalogStore.set(config);
          this.skillCatalogStore.setHasCache(true);
        })
      );
  }
}
