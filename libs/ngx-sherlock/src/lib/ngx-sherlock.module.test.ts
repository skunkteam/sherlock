import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { atom } from '@skunkteam/sherlock';
import { NgxSherlockModule } from './ngx-sherlock.module';

describe(NgxSherlockModule, () => {
    @Component({
        template: `{{ value$ | value }}`,
        changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TestComponent {
        value$ = atom('the value');
    }

    test('value pipe used in component HTML', async () => {
        await TestBed.configureTestingModule({
            imports: [NgxSherlockModule],
            declarations: [TestComponent],
        }).compileComponents();

        const fixture = TestBed.createComponent(TestComponent);
        const component = fixture.componentInstance;

        expect(component.value$.connected).toBeFalse();
        fixture.detectChanges();
        expect(component.value$.connected).toBeTrue();
        expect(fixture.nativeElement.textContent).toBe('the value');

        fixture.componentInstance.value$.set('other value');
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toBe('other value');
    });
});
