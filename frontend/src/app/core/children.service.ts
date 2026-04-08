import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface Child {
  id: number;
  display_name: string;
  avatar: string | null;
  birthdate: string;
  grade_level: 'CM1' | 'CM2' | '6EME';
}

interface ChildrenResponse {
  data: Child[];
}

@Injectable({ providedIn: 'root' })
export class ChildrenService {
  private readonly http = inject(HttpClient);

  list(): Observable<Child[]> {
    return this.http.get<ChildrenResponse>('/api/children').pipe(map((r) => r.data));
  }
}
