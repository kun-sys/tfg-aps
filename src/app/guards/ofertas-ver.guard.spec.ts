import {TestBed} from '@angular/core/testing';

import {OfertaVerGuard} from './ofertas-ver.guard';

describe('OfertaVerGuard', () => {
    let guard: OfertaVerGuard;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        guard = TestBed.inject(OfertaVerGuard);
    });

    it('should be created', () => {
        expect(guard).toBeTruthy();
    });
});
