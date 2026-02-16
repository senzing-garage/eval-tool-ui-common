import { Injectable, InjectionToken, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { SzGraphExport, SzSavedGraphExportMeta } from '../models/SzNetworkGraph';

export const SZ_GRAPH_STORAGE_URL = new InjectionToken<string>('SZ_GRAPH_STORAGE_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:3000/api'
});

@Injectable({ providedIn: 'root' })
export class SzGraphStorageService {
  private http = inject(HttpClient);
  private baseUrl = inject(SZ_GRAPH_STORAGE_URL);

  savedGraphs$ = new BehaviorSubject<SzSavedGraphExportMeta[]>([]);

  list(): Observable<SzSavedGraphExportMeta[]> {
    return this.http.get<SzSavedGraphExportMeta[]>(`${this.baseUrl}/graphs`);
  }

  load(id: number): Observable<SzGraphExport> {
    return this.http.get<SzGraphExport>(`${this.baseUrl}/graphs/${id}`);
  }

  save(name: string, description: string, data: SzGraphExport): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.baseUrl}/graphs`, { name, description, data }).pipe(
      tap(() => this.refresh())
    );
  }

  update(id: number, changes: Partial<{ name: string; description: string; data: SzGraphExport }>): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(`${this.baseUrl}/graphs/${id}`, changes).pipe(
      tap(() => this.refresh())
    );
  }

  delete(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.baseUrl}/graphs/${id}`).pipe(
      tap(() => this.refresh())
    );
  }

  refresh(): void {
    this.list().subscribe({
      next: (graphs) => this.savedGraphs$.next(graphs),
      error: (err) => console.warn('SzGraphStorageService: failed to refresh saved graphs', err)
    });
  }
}
