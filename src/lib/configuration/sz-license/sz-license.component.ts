import { Component, OnInit, Input, Output, EventEmitter, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, filter, takeUntil } from 'rxjs';
//import { SzLoadedStats } from '@senzing/rest-api-client-ng';

import { parseBool, parseNumber } from '../../common/utils';
//import { SzAdminService } from '../../services/sz-admin.service';
import { SzDataMartService } from '../../services/sz-datamart.service';
import { SzLicenseUpgradeType } from '../../models/data-license';
import { SzLicenseUpgradeMouseEvent } from '../../models/event-license';
import { SzProductLicenseResponse } from '../../models/grpc/product';
import { SzGrpcProductService } from '../../services/grpc/product.service';
import { SzShortNumberPipe } from '../../pipes/shortnumber.pipe';
import { SzLoadedStats } from '../../services/http/models/szLoadedStats';
import { MatButtonModule } from '@angular/material/button';

/**
 * A simple "license info" component.
 * Used for displaying the current senzing license info.
 *
 * @example 
 * <!-- (Angular) -->
 * <sz-license></sz-license>
 *
 * @example 
 * <!-- (WC) -->
 * <sz-license></sz-license>
 */
@Component({
    selector: 'sz-license',
    templateUrl: './sz-license.component.html',
    imports: [
      CommonModule, 
      MatButtonModule,
      SzShortNumberPipe
    ],
    styleUrls: ['./sz-license.component.scss'],
    providers:[
      { provide: SzDataMartService, useClass: SzDataMartService },
      { provide: SzGrpcProductService, useClass: SzGrpcProductService }
    ]
})
export class SzLicenseInfoComponent implements OnInit {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  /** this brings in the enum to local scrope for html template access */
  readonly SzLicenseUpgradeType = SzLicenseUpgradeType;

  private _licenseInfo: SzProductLicenseResponse = {};
  private _countStats: SzLoadedStats;
  private _recordCount: number;
  private _showUpgradeButton: boolean = true;
  
  @Input() public set recordCount(value: string | number) {
    this._recordCount = parseNumber(value);
  }
  @Input() public set showUpgradeButton(value: string | boolean) {
    this._showUpgradeButton = parseBool(value);
  }
  private _openUpgradeButtonLink = true;
  @Input() public set openUpgradeButtonLink(value: string | boolean) {
    this._openUpgradeButtonLink = parseBool(value);
  }
  public get openUpgradeButtonLink(): boolean {
    return this._openUpgradeButtonLink;
  }

  public get showUpgradeButton() {
    return this._showUpgradeButton;
  }
  public get percentUsed(): number {
    return this.licenseLimitRatio;
  }
  public get expirationDate(): Date {
    return this._licenseInfo.expireDate;
  }
  public get recordLimit() {
    return this.licenseInfo.recordLimit;
  }

  public get licenseInfo() : SzProductLicenseResponse {
    return this._licenseInfo;
  }

  public get trialLicense() : boolean {
    if (!this.licenseInfo) return false;
    return (this.licenseInfo.licenseType === "EVAL" || (this.licenseInfo.licenseType && this.licenseInfo.licenseType.indexOf && this.licenseInfo.licenseType.indexOf('EVAL') > -1));
  }

  public get limitInvalid() : boolean {
    if (!this.licenseInfo) return false;
    const limit = this.licenseInfo.recordLimit;
    if (limit === null || limit === undefined) return true;
    if (limit <= 0) return true;
    return false;
  }

  public get expirationInvalid() : boolean {
    if (!this.licenseInfo) return false;
    const expDate = this.licenseInfo.expireDate;
    if (expDate === null || expDate === undefined) return true;
    return false;
  }

  public get approachingLimit() : boolean {
    if (!this.licenseInfo) return false;
    const limit = this.licenseInfo.recordLimit;
    if (limit === null || limit === undefined) return false;
    if (limit === 0) return true;
    const ratio = this.licenseLimitRatio;
    return (ratio > 0.95) ? true : false;
  }

  public get licenseLimitRatio() : number {
    if (!this.licenseInfo) return 0;
    const limit = this.licenseInfo.recordLimit;
    if (limit === null || limit === undefined) return 0;
    if (limit === 0) return 1;
    if (!this._recordCount || this._recordCount === 0) return 0;
    return (this._recordCount / limit);
  }

  public get expiringSoon() : boolean {
    const days = this.licenseDays;
    if (days == null || days === undefined) return false;
    return (days <= 30 ? true : false);
  }

  public get licenseDays() : number | null {
    if (!this.licenseInfo) return 0;
    const expDate = this.licenseInfo.expireDate;
    if (!expDate) return null;
    const exp = expDate.getTime() - (1000 * 60 * 60 * 24);
    const now = (new Date()).getTime();
    return Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  }

  public get licenseType() {
    if (!this.licenseInfo) return false;
    return this._licenseInfo.licenseType;
  }

  public get expired() : boolean {
    if (!this.licenseInfo) return false;
    const expDate = this.licenseInfo.expireDate;
    if (!expDate) return false;
    const expYear  = expDate.getFullYear();
    const expMonth = expDate.getMonth();
    const expDay   = expDate.getDate();
    const now      = new Date();
    const nowYear  = now.getFullYear();
    const nowMonth = now.getMonth();
    const nowDay   = now.getDate();
    if (nowYear > expYear) return true;
    if (nowYear === expYear && nowMonth > expMonth) return true;
    if (nowYear === expYear && nowMonth === expMonth && nowDay >= expDay) return true;
    return false;
  }

  public get licenseButtonLabelKey() : string {
    if (this.trialLicense) return 'subscribe-now-label';
    if (this.approachingLimit) return 'upgrade-license-label';
    if (this.expiringSoon || this.expired) return 'renew-license-label';
    return 'view-subscription-label';
  }

  /** when a user clicks the info link inside of a step card this event is emitted*/
  @Output() public upgradeLicense             = new EventEmitter<SzLicenseUpgradeMouseEvent>();

  //@Input() format = 'small';
  constructor(
    private dmService: SzDataMartService, 
    private productService: SzGrpcProductService
  ) {}

  ngOnInit() {
    this.dmService.onCountStats.pipe(
      filter( (val) => val !== undefined)
    ).subscribe( (resp: SzLoadedStats) => {
      this._countStats = resp;
      console.log(`count stats: `, this._countStats);
      if(this._countStats.totalRecordCount) {
        this._recordCount = this._countStats.totalRecordCount;
      }
    });
    this.productService.getLicense().pipe(
       takeUntil(this.unsubscribe$)
    ).subscribe((resp: SzProductLicenseResponse) => {
      this._licenseInfo = resp;
      console.log(`license info: `, this._licenseInfo);
    })
    // if "openUpgradeButtonLink" is true then redirect to senzing.com on click
    this.upgradeLicense.pipe(
      takeUntil(this.unsubscribe$),
      filter(() => this._openUpgradeButtonLink)
    ).subscribe(this.handleUpgradeLicenseClick);

    // trigger data retrieval if no count stats
    if(!this._countStats) {
      let temp = this.dmService.loadedStatistics;
      console.log(`default count stats: `, temp);
    }
  }

  public handleUpgradeButtonClicked(event: Event) {
    let payload = (event as SzLicenseUpgradeMouseEvent);
    payload.upgradeType = this.upgradeType;
    this.upgradeLicense.emit(event as SzLicenseUpgradeMouseEvent);
  }

  private handleUpgradeLicenseClick(event: SzLicenseUpgradeMouseEvent) {
    const url = (event && event.upgradeType === SzLicenseUpgradeType.SUBSCRIBE)
    ? 'https://senzing.com/app-upgrade/'
    : 'https://senzing.com/subscription-login/';

    window.location.href = url;
  }

  public get upgradeType(): SzLicenseUpgradeType {
    if (this.trialLicense) return SzLicenseUpgradeType.SUBSCRIBE;
    if (this.approachingLimit) return SzLicenseUpgradeType.UPGRADE;
    if (this.expiringSoon || this.expired) return SzLicenseUpgradeType.RENEW;
    return SzLicenseUpgradeType.VIEW;
  }
}

