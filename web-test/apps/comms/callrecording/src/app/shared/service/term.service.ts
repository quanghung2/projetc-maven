import { forwardRef, Inject, Injectable } from '@angular/core';
import { Term } from '../model/term.model';
import { BackendService } from './backend.service';

const TERM_PATH = '/private/v2/term';

@Injectable()
export class TermService {
  private term: Term = new Term();

  constructor(
    @Inject(forwardRef(() => BackendService))
    private backendService: BackendService
  ) {}

  getTerm(): Term {
    return this.term;
  }

  setTerm(term: any) {
    this.term = new Term(term.isEncryptionEnabled, term.isBackUpEnabled);
  }

  fetchTerm(): Promise<any> {
    return this.backendService.get(TERM_PATH);
  }
}
