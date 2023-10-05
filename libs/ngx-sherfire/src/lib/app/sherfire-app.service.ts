import { inject, Injectable, NgZone } from '@angular/core';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { FirebaseConfig } from '../firebase-config.service';
import { NgxSherfireModule } from '../ngx-sherfire.module';

export interface SherfireApp extends FirebaseApp {}

@Injectable({
    providedIn: NgxSherfireModule,
    useFactory: () =>
        inject(NgZone).runOutsideAngular(() => {
            const config = inject(FirebaseConfig);
            return initializeApp(config, config.appSettings);
        }),
})
export abstract class SherfireApp {}
