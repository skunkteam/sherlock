import { inject, Injectable, NgZone } from '@angular/core';
import type { Auth } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { SherfireApp } from '../app';
import { NgxSherfireModule } from '../ngx-sherfire.module';

export interface SherfireAuth extends Auth {}

@Injectable({
    providedIn: NgxSherfireModule,
    useFactory: () => inject(NgZone).runOutsideAngular(() => getAuth(inject(SherfireApp))),
})
export abstract class SherfireAuth {}
