import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Showcase } from './showcase';
import { API_URL } from '../../../../core/config/api';
import { PublicPet } from '../../../../core/models/pet';

const pet: PublicPet = {
  name: 'Thor',
  about: 'Dócil e companheiro.',
  breed: 'SRD',
  ageInYears: 2,
  isAdopted: false,
  rescueDate: null,
  images: [{ filePath: 'https://example.org/thor.jpg' }],
  vaccines: [],
  manager: { name: 'ONG de teste', email: 'ong@example.org', phone: '11999999999' },
};

describe('Public showcase', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Showcase],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('requests only available pets and paginates on the server', async () => {
    const fixture = TestBed.createComponent(Showcase);
    const request = http.expectOne((req) => req.url === `${API_URL}/pets`);
    expect(request.request.params.get('Filter.AdoptionStatus')).toBe('Available');
    expect(request.request.params.get('Pagination.PageSize')).toBe('9');
    request.flush({ items: [pet], pageNumber: 1, totalPages: 2, totalCount: 10 });
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h3')?.textContent).toBe('Thor');
    element.querySelector<HTMLButtonElement>('[aria-label="Próxima página"]')!.click();
    const next = http.expectOne((req) => req.params.get('Pagination.PageNumber') === '2');
    next.flush({ items: [], pageNumber: 2, totalPages: 2, totalCount: 10 });
  });

  it('shows an honest error and allows retrying', async () => {
    const fixture = TestBed.createComponent(Showcase);
    http.expectOne((req) => req.url === `${API_URL}/pets`).error(new ProgressEvent('error'));
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Não foi possível carregar',
    );
    element.querySelector<HTMLButtonElement>('.empty-state button')!.click();
    http
      .expectOne((req) => req.url === `${API_URL}/pets`)
      .flush({ items: [], pageNumber: 1, totalPages: 0, totalCount: 0 });
    await fixture.whenStable();
    expect(element.querySelector('.empty-state')?.textContent).toContain('Novas histórias');
  });
});
