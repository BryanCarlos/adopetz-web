import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { FormControl } from '@angular/forms';
import { PetEditor, integerAge, pastDate, validPhoto } from './pet-editor';
import { API_URL } from '../../../../core/config/api';

describe('Pet editor', () => {
  it('rejects fractional ages, future dates, and invalid photo formats', () => {
    expect(integerAge(new FormControl(1.5))).toEqual({ integer: true });
    expect(integerAge(new FormControl(0))).toBeNull();
    expect(pastDate(new FormControl('2999-01-01'))).toEqual({ futureDate: true });
    expect(validPhoto(new File(['x'], 'file.svg', { type: 'image/svg+xml' }))).toContain('JPEG');
  });
  it('preserves unsaved fields and retries only photos that failed to upload', async () => {
    TestBed.configureTestingModule({
      imports: [PetEditor],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'pet-id' }) } },
        },
      ],
    });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(PetEditor);
    const editor = fixture.componentInstance;
    const pet = {
      id: 'pet-id',
      name: 'Thor',
      about: 'Amigável',
      ageInYears: 2,
      breed: 'SRD',
      rescueDate: null,
      isAdopted: false,
      images: [],
      vaccines: [],
    };
    http.expectOne(`${API_URL}/pets/me/pet-id`).flush(pet);
    editor['form'].controls.about.setValue('Descrição ainda não salva');
    editor['form'].markAsDirty();
    const first = { file: new File(['a'], 'first.jpg', { type: 'image/jpeg' }), url: 'blob:first' };
    const second = {
      file: new File(['b'], 'second.jpg', { type: 'image/jpeg' }),
      url: 'blob:second',
    };
    const revoke = vi.fn();
    Object.defineProperty(URL, 'revokeObjectURL', { value: revoke, configurable: true });
    editor['pendingPhotos'].set([first, second]);
    editor['uploadPhotos']();
    http.expectOne(`${API_URL}/pets/pet-id/images`).flush(null);
    http
      .expectOne(`${API_URL}/pets/pet-id/images`)
      .flush({}, { status: 502, statusText: 'Bad Gateway' });
    http
      .expectOne(`${API_URL}/pets/me/pet-id`)
      .flush({ ...pet, images: [{ id: 'image-id', filePath: 'https://example.org/first.jpg' }] });
    expect(editor['pendingPhotos']()).toEqual([second]);
    expect(editor['form'].controls.about.value).toBe('Descrição ainda não salva');
    expect(editor.hasUnsavedChanges()).toBe(true);
    editor['uploadPhotos']();
    const retry = http.expectOne(`${API_URL}/pets/pet-id/images`);
    expect((retry.request.body as FormData).get('File')).toBe(second.file);
    retry.flush(null);
    http.expectOne(`${API_URL}/pets/me/pet-id`).flush(pet);
    expect(editor['pendingPhotos']()).toEqual([]);
    http.verify();
  });
});
