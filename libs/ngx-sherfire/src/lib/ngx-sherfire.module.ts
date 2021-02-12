import { ModuleWithProviders, NgModule } from '@angular/core';
import { FirebaseConfig } from './firebase-config.service';

@NgModule()
export class NgxSherfireModule {
    static forRoot(config: FirebaseConfig): ModuleWithProviders<NgxSherfireModule> {
        return {
            ngModule: NgxSherfireModule,
            providers: [{ provide: FirebaseConfig, useValue: config }],
        };
    }
}
