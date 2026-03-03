import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/**
 * @deprecated This service relied on the REST ConfigService and is no longer used.
 * Use SzGrpcConfigManagerService instead.
 */
@Injectable({
  providedIn: 'root'
})
export class SzConfigDataService {
    private _orderedFeatureTypes: string[] | undefined;

    constructor() {}

    getOrderedFeatures(pullFromCacheIfAvailable?: boolean): Observable<string[]> | undefined {
        console.warn('SzConfigDataService.getOrderedFeatures() is deprecated. Use SzGrpcConfigManagerService instead.');
        return undefined;
    }
}
