import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, retry, timer } from 'rxjs';
import { SzGraphExport, SzSavedGraphExportMeta } from '../models/SzNetworkGraph';
import { SzGraphEnvironment } from './sz-graph-environment';

/**
 * Service for persisting and retrieving saved graph exports via the
 * eval-tool-app-storage REST API. Automatically checks server reachability
 * on startup and exposes connection state so UI elements can hide when
 * the storage backend is unavailable.
 *
 * Provide a {@link SzGraphEnvironment} via the `'GRAPH_ENVIRONMENT'` injection
 * token to override the default base URL (`http://localhost:3000/api`).
 */
@Injectable({ providedIn: 'root' })
export class SzGraphStorageService {
  /** @internal */
  private http: HttpClient;
  /** @internal */
  private baseUrl: string;
  /** @internal */
  private _serverInfo: Record<string, unknown> | null = null;

  /** @internal */
  private _savedGraphs$     = new BehaviorSubject<SzSavedGraphExportMeta[]>([]);
  /** Observable that emits the current list of saved graph metadata whenever it changes. */
  public savedGraphsUpdated = this._savedGraphs$.asObservable();

  /** Whether the storage server has responded successfully to a health check. */
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

  /**
   * Polls the `/info` endpoint to determine whether the storage server is
   * reachable. Retries every 10 s for the first 6 attempts, then every 60 s
   * until a successful response is received.
   */
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

  /** Fetches metadata for all saved graphs (excludes full graph data). */
  list(): Observable<SzSavedGraphExportMeta[]> {
    return this.http.get<SzSavedGraphExportMeta[]>(`${this.baseUrl}/graphs`);
  }

  /**
   * Loads the full graph data for a saved graph.
   * @param id - the saved graph id
   */
  load(id: number): Observable<SzGraphExport> {
    return this.http.get<SzGraphExport>(`${this.baseUrl}/graphs/${id}`);
  }

  /**
   * Persists a new graph export and refreshes the saved graphs list.
   * @param name - display name for the saved graph
   * @param description - optional description
   * @param data - the graph export payload
   */
  save(name: string, description: string, data: SzGraphExport): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.baseUrl}/graphs`, { name, description, data }).pipe(
      tap(() => this.refresh())
    );
  }

  /**
   * Updates an existing saved graph and refreshes the saved graphs list.
   * @param id - the saved graph id
   * @param changes - fields to update (name, description, and/or data)
   */
  update(id: number, changes: Partial<{ name: string; description: string; data: SzGraphExport }>): Observable<{ ok: boolean }> {
    return this.http.put<{ ok: boolean }>(`${this.baseUrl}/graphs/${id}`, changes).pipe(
      tap(() => this.refresh())
    );
  }

  /**
   * Deletes a saved graph and refreshes the saved graphs list.
   * @param id - the saved graph id
   */
  delete(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.baseUrl}/graphs/${id}`).pipe(
      tap(() => this.refresh())
    );
  }

  /** Re-fetches the saved graphs list and pushes it to {@link savedGraphsUpdated}. */
  refresh(): void {
    this.list().subscribe({
      next: (graphs) => this._savedGraphs$.next(graphs),
      error: (err) => console.warn('SzGraphStorageService: failed to refresh saved graphs', err)
    });
  }
}
