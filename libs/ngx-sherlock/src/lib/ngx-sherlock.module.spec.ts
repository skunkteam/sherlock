import { async, TestBed } from '@angular/core/testing';
import { NgxSherlockModule } from './ngx-sherlock.module';

describe('NgxSherlockModule', () => {
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [NgxSherlockModule],
        }).compileComponents();
    }));

    // TODO: Add real tests here.
    //
    // NB: This particular test does not do anything useful.
    //     It does NOT check for correct instantiation of the module.
    it('should have a module definition', () => {
        expect(NgxSherlockModule).toBeDefined();
    });
});
