import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, retry, timer } from 'rxjs';
import { SzGraphExport, SzSavedGraphExportMeta } from '../models/SzNetworkGraph';
import { SzGraphEnvironment } from './sz-graph-environment';

@Injectable({ providedIn: 'root' })
export class SzGraphStorageService {
  private http: HttpClient;
  private baseUrl: string;
  private _serverInfo: Record<string, unknown> | null = null;

  private _savedGraphs$     = new BehaviorSubject<SzSavedGraphExportMeta[]>([]);
  public savedGraphsUpdated = this._savedGraphs$.asObservable();

  get connectionValid(): boolean {
    return this._serverInfo !== null;
  }

  constructor(
    http: HttpClient,
    @Optional() @Inject('GRAPH_ENVIRONMENT') graphEnv: SzGraphEnvironment | null
  ) {
    this.http = http;
    this.baseUrl = graphEnv?.basePath ?? 'http://localhost:3000/api';
    this.checkConnection();
  }

  checkConnection(): void {
    let attempt = 0;
    this.http.get<Record<string, unknown>>(`${this.baseUrl}/info`).pipe(
      retry({
        delay: () => {
          attempt++;
          return timer(attempt <= 6 ? 10_000 : 60_000);
        }
      })
    ).subscribe((info) => this._serverInfo = info);
  }

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
      next: (graphs) => this._savedGraphs$.next(graphs),
      error: (err) => console.warn('SzGraphStorageService: failed to refresh saved graphs', err)
    });
  }
}
