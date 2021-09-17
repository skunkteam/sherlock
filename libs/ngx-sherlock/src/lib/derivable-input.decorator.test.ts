import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { atom, SettableDerivable } from '@skunkteam/sherlock';
import { DerivableInput } from './derivable-input.decorator';
import { NgxSherlockModule } from './ngx-sherlock.module';

describe(DerivableInput, () => {
    @Component({
        selector: 'sherlock-test-component',
        template: `{{ mapped$ | value }}`,
        changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class TestComponent {
        @Input() @DerivableInput() input$!: SettableDerivable<string>;

        readonly mapped$ = this.input$.map(s => `Hello ${s}!`).fallbackTo('Got nothing!');
    }

    let fixture: ComponentFixture<TestComponent>;
    let component: TestComponent;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgxSherlockModule],
            declarations: [TestComponent],
        }).compileComponents();
        fixture = TestBed.createComponent(TestComponent);
        component = fixture.componentInstance;
    });

    test('basic use', async () => {
        expect(component.input$.resolved).toBeFalse();
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toBe('Got nothing!');

        const myAtom = atom.unresolved<string>();
        component.input$ = myAtom;

        expect(component.input$.resolved).toBeFalse();
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toBe('Got nothing!');

        myAtom.set('you');
        expect(component.input$.get()).toBe('you');
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toBe('Hello you!');
    });

    test('settable', () => {
        const myAtom = atom.unresolved<string>();
        component.input$ = myAtom;

        myAtom.set('you');
        expect(component.input$.get()).toBe('you');
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toBe('Hello you!');

        // Setting from the component
        component.input$.set('me');

        expect(myAtom.get()).toBe('me');
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toBe('Hello me!');
    });

    test('switching inputs', () => {
        const myAtom = atom.unresolved<string>();
        component.input$ = myAtom;

        myAtom.set('you');
        expect(component.input$.get()).toBe('you');

        const myNewAtom = atom('me');
        component.input$ = myNewAtom;

        expect(component.input$.get()).toBe('me');
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toBe('Hello me!');

        component.input$.set('jumbo');

        expect(myAtom.get()).toBe('you');
        expect(myNewAtom.get()).toBe('jumbo');
    });

    test('multiple instances', () => {
        const fixture2 = TestBed.createComponent(TestComponent);
        const component2 = fixture2.componentInstance;

        expect(Object.getPrototypeOf(component2)).toBe(Object.getPrototypeOf(component));

        const firstAtom = atom('foo');
        const secondAtom = atom('bar');

        component.input$ = firstAtom;
        component2.input$ = secondAtom;

        fixture.detectChanges();
        fixture2.detectChanges();

        expect(fixture.nativeElement.textContent).toBe('Hello foo!');
        expect(fixture2.nativeElement.textContent).toBe('Hello bar!');
    });
});
