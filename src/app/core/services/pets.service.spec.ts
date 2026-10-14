import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PetsService } from './pets.service';
import { environment } from '../../../environments/environment';

describe('Pet API contracts', () => {
  it('sends files and indexed vaccines in the registration multipart body, including age zero', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(PetsService);
    const http = TestBed.inject(HttpTestingController);
    const file = new File(['photo'], 'pet.jpg', { type: 'image/jpeg' });
    service
      .create(
        {
          name: 'Nina',
          about: 'Amigável',
          breed: null,
          ageInYears: 0,
          rescueDate: null,
          adopted: false,
        },
        [file],
        [{ name: 'Antirrábica', applicationDate: null }],
      )
      .subscribe();
    const request = http.expectOne(`${environment.apiUrl}/pets`);
    const body = request.request.body as FormData;
    expect(body.get('AgeInYears')).toBe('0');
    expect(body.get('PetImages')).toBe(file);
    expect(body.get('Vaccines[0].Name')).toBe('Antirrábica');
    expect(body.has('Vaccines[0].ApplicationDate')).toBe(false);
    expect(request.request.headers.has('Content-Type')).toBe(false);
    request.flush({ id: 'pet-id' });
    http.verify();
  });
});
