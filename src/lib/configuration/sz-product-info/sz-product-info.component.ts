import { Component, Inject, inject, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SzGrpcWebEnvironment, SzGrpcWebEnvironmentOptions } from "@senzing/sz-sdk-typescript-grpc-web";
import { Subject, take } from "rxjs";
import { SzGrpcProductService } from "../../services/grpc/product.service";
import { Configuration as SzRestConfiguration } from "@senzing/rest-api-client-ng";

@Component({
    selector: 'sz-product-info',
    styleUrl: 'sz-product-info.component.scss',
    templateUrl: 'sz-product-info.component.html',
    imports: [
      CommonModule
    ],
    providers:[
        { provide: SzGrpcProductService, useClass: SzGrpcProductService}
    ]
})
export class SzProductInfoComponent implements OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();
    public result: string | undefined;

    getVersion(event: MouseEvent) {
      console.log(`getting version from grpc...`);
      this.productService.getVersion().pipe(take(1)).subscribe((result) => {
        console.log(`got info`, result);
        this.result = JSON.stringify(result, undefined, 4);
      })
    }
    /*
    getRestVersion(event: MouseEvent) {
      console.log(`getting version from grpc...`);
      this.adminService.getVersionInfo().pipe(
        take(1)
      ).subscribe((result) => {
        console.log(`got info`, result);
        this.result = JSON.stringify(result, undefined, 4);
      })
    }
    */
  
    getLicense(event: MouseEvent) {
      console.log(`getting license from grpc...`);
      this.productService.getLicense().pipe(take(1)).subscribe((result) => {
        console.log(`got info`, result);
        this.result = JSON.stringify(result, undefined, 4);
      })
    }
  
    getDataSources(event: MouseEvent) {
      console.log(`getting license from grpc...`);
      
      this.SdkEnvironment?.configManager.createConfig().then((config) => {
        console.log(`got config`, config.definition);
        config.getDataSourceRegistry().then((dataSources: {DSRC_ID: number, DSRC_CODE: string}[]) => {
          console.log(`got datasources: `, dataSources);
          this.result = dataSources.map((ds)=> { return JSON.stringify(ds) })?.join('\n');
        })
      })
    }

    constructor(
      @Inject('GRPC_ENVIRONMENT') private SdkEnvironment: SzGrpcWebEnvironment,
      @Inject('REST_ENVIRONMENT') readonly RestConfiguration: SzRestConfiguration,
      private productService: SzGrpcProductService
    ) {

    }
    
    /**
     * unsubscribe when component is destroyed
     */
    ngOnDestroy() {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }
}