import { TestBed } from '@angular/core/testing';

import { InMemoryCache } from './in-memory-cache.service';

describe('LocalCacheService', () => {
  let service: InMemoryCache;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InMemoryCache);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
