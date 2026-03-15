import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, firstValueFrom } from 'rxjs';
import { SzGraphExport, SzGraphExportRecord } from '../models/SzNetworkGraph';

/**
 * Service for server-backed graph storage (CRUD).
 *
 * This service is optional — it probes for the REST endpoint and exposes
 * an {@link isAvailable} flag so that consuming components can fall back
 * to file-based import/export when the backend does not support storage.
 *
 * The REST paths match eval-tool-server:
 *   GET    /api/eval/projects/{projectId}/graphs
 *   GET    /api/eval/projects/{projectId}/graphs/{graphId}
 *   POST   /api/eval/projects/{projectId}/graphs
 *   PUT    /api/eval/projects/{projectId}/graphs/{graphId}
 *   DELETE /api/eval/projects/{projectId}/graphs/{graphId}
 */
@Injectable({ providedIn: 'root' })
export class SzGraphStorageService {

    private _available = new BehaviorSubject<boolean>(false);
    private _projectId: number | null = null;
    private _basePath = '/api/eval';

    /** Observable that emits when availability changes. */
    public available$ = this._available.asObservable();

    /** Emits after a graph is saved, updated, or deleted. */
    private _graphsChanged = new Subject<void>();
    public graphsChanged$ = this._graphsChanged.asObservable();

    /** Synchronous check — true when the backend graph endpoints exist. */
    public get isAvailable(): boolean { return this._available.value; }

    /** The currently active project ID. Set this before calling CRUD methods. */
    public get projectId(): number | null { return this._projectId; }
    public set projectId(id: number | null) {
        this._projectId = id;
        if (id !== null) {
            this.checkAvailability(id);
        } else {
            this._available.next(false);
        }
    }

    /** Override the default base path ("/api/eval"). */
    public set basePath(value: string) { this._basePath = value; }
    public get basePath(): string { return this._basePath; }

    constructor(private http: HttpClient) {}

    // ── Endpoint detection ───────────────────────────────────────────

    /**
     * Probes the list-graphs endpoint for the given project.
     * A 2xx response means the backend supports graph storage.
     */
    checkAvailability(projectId: number): void {
        const url = `${this._basePath}/projects/${projectId}/graphs`;
        this.http.get<SzGraphExportRecord[]>(url).subscribe({
            next: () => this._available.next(true),
            error: () => this._available.next(false)
        });
    }

    // ── CRUD ─────────────────────────────────────────────────────────

    /** List saved graphs (metadata only — no graphData). */
    listGraphs(): Promise<SzGraphExportRecord[]> {
        this.requireProject();
        return firstValueFrom(
            this.http.get<SzGraphExportRecord[]>(this.graphsUrl())
        );
    }

    /** Get a single graph by ID, including the full graphData payload. */
    getGraph(graphId: number): Promise<SzGraphExportRecord> {
        this.requireProject();
        return firstValueFrom(
            this.http.get<SzGraphExportRecord>(`${this.graphsUrl()}/${graphId}`)
        );
    }

    /**
     * Save a new graph to the server.
     *
     * @param name Display name.
     * @param description Optional description.
     * @param graphExport The full SzGraphExport object (will be JSON-stringified).
     * @returns The created record (with server-assigned id and timestamps).
     */
    saveGraph(
        name: string,
        description: string | null,
        graphExport: SzGraphExport
    ): Promise<SzGraphExportRecord> {
        this.requireProject();
        const body: SzGraphExportRecord = {
            name,
            description: description || undefined,
            entityIds: JSON.stringify(graphExport.query.graphIds),
            nodeCount: graphExport.nodes.length,
            linkCount: graphExport.links.length,
            version: graphExport.version || '1',
            graphData: JSON.stringify(graphExport)
        };
        return firstValueFrom(
            this.http.post<SzGraphExportRecord>(this.graphsUrl(), body)
        ).then(record => {
            this._graphsChanged.next();
            return record;
        });
    }

    /**
     * Update an existing graph.
     *
     * @param graphId The graph record ID.
     * @param updates Partial fields to update (name, description, and/or graphData).
     * @returns The updated record.
     */
    updateGraph(
        graphId: number,
        updates: {
            name?: string;
            description?: string;
            graphExport?: SzGraphExport;
        }
    ): Promise<SzGraphExportRecord> {
        this.requireProject();
        const body: Partial<SzGraphExportRecord> = {};
        if (updates.name !== undefined) body.name = updates.name;
        if (updates.description !== undefined) body.description = updates.description;
        if (updates.graphExport) {
            body.entityIds = JSON.stringify(updates.graphExport.query.graphIds);
            body.nodeCount = updates.graphExport.nodes.length;
            body.linkCount = updates.graphExport.links.length;
            body.version = updates.graphExport.version || '1';
            body.graphData = JSON.stringify(updates.graphExport);
        }
        return firstValueFrom(
            this.http.put<SzGraphExportRecord>(
                `${this.graphsUrl()}/${graphId}`, body
            )
        ).then(record => {
            this._graphsChanged.next();
            return record;
        });
    }

    /** Delete a saved graph. */
    deleteGraph(graphId: number): Promise<void> {
        this.requireProject();
        return firstValueFrom(
            this.http.delete<void>(`${this.graphsUrl()}/${graphId}`)
        ).then(() => {
            this._graphsChanged.next();
        });
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private graphsUrl(): string {
        return `${this._basePath}/projects/${this._projectId}/graphs`;
    }

    private requireProject(): void {
        if (this._projectId === null) {
            throw new Error('SzGraphStorageService: projectId must be set before calling CRUD methods.');
        }
    }
}
