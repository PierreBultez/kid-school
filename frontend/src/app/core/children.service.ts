import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export type GradeLevel = 'CM1' | 'CM2' | '6EME';

export interface Child {
  id: number;
  display_name: string;
  avatar: string | null;
  birthdate: string;
  grade_level: GradeLevel;
}

export interface ChildPayload {
  display_name: string;
  birthdate: string;
  grade_level: GradeLevel;
  avatar?: string | null;
}

interface SingleResponse<T> {
  data: T;
}

interface ListResponse<T> {
  data: T[];
}

@Injectable({ providedIn: 'root' })
export class ChildrenService {
  private readonly http = inject(HttpClient);

  list(): Observable<Child[]> {
    return this.http.get<ListResponse<Child>>('/api/children').pipe(map((r) => r.data));
  }

  create(payload: ChildPayload): Observable<Child> {
    return this.http
      .post<SingleResponse<Child>>('/api/children', payload)
      .pipe(map((r) => r.data));
  }

  update(id: number, payload: Partial<ChildPayload>): Observable<Child> {
    return this.http
      .patch<SingleResponse<Child>>(`/api/children/${id}`, payload)
      .pipe(map((r) => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`/api/children/${id}`);
  }

  select(id: number): Observable<{ active_child_id: number }> {
    return this.http.post<{ active_child_id: number }>(`/api/children/${id}/select`, {});
  }
}
