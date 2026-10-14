import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ManagerPet, Page, PublicPet, PetDetails, VaccineDetails } from '../models/pet';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PetsService {
  private readonly http = inject(HttpClient);
  search(pageNumber = 1, searchTerm = '') {
    let params = new HttpParams()
      .set('Pagination.PageNumber', pageNumber)
      .set('Pagination.PageSize', 9)
      .set('Filter.AdoptionStatus', 'Available');
    if (searchTerm.trim()) params = params.set('Filter.SearchTerm', searchTerm.trim());
    return this.http.get<Page<PublicPet>>(`${environment.apiUrl}/pets`, { params });
  }
  mine(pageNumber = 1) {
    return this.http.get<Page<ManagerPet>>(`${environment.apiUrl}/pets/me`, {
      params: { pageNumber, pageSize: 9 },
    });
  }
  get(id: string) {
    return this.http.get<ManagerPet>(`${environment.apiUrl}/pets/me/${id}`);
  }
  create(details: PetDetails, images: File[], vaccines: VaccineDetails[]) {
    const body = new FormData();
    body.append('Name', details.name);
    body.append('About', details.about);
    if (details.breed) body.append('Breed', details.breed);
    if (details.ageInYears != null) body.append('AgeInYears', String(details.ageInYears));
    if (details.rescueDate) body.append('RescueDate', details.rescueDate);
    images.forEach((image) => body.append('PetImages', image));
    vaccines.forEach((vaccine, index) => {
      body.append(`Vaccines[${index}].Name`, vaccine.name);
      if (vaccine.applicationDate)
        body.append(`Vaccines[${index}].ApplicationDate`, vaccine.applicationDate);
    });
    return this.http.post<{ id: string }>(`${environment.apiUrl}/pets`, body);
  }
  update(id: string, details: PetDetails) {
    return this.http.put<void>(`${environment.apiUrl}/pets/${id}`, details);
  }
  delete(id: string) {
    return this.http.delete<void>(`${environment.apiUrl}/pets/${id}`);
  }
  addImage(id: string, file: File) {
    const body = new FormData();
    body.append('File', file);
    return this.http.post<void>(`${environment.apiUrl}/pets/${id}/images`, body);
  }
  deleteImage(id: string, imageId: string) {
    return this.http.delete<void>(`${environment.apiUrl}/pets/${id}/images/${imageId}`);
  }
  addVaccine(id: string, vaccine: VaccineDetails) {
    return this.http.post<void>(`${environment.apiUrl}/pets/${id}/vaccines`, vaccine);
  }
  updateVaccine(id: string, vaccineId: string, vaccine: VaccineDetails) {
    return this.http.put<void>(`${environment.apiUrl}/pets/${id}/vaccines/${vaccineId}`, vaccine);
  }
  deleteVaccine(id: string, vaccineId: string) {
    return this.http.delete<void>(`${environment.apiUrl}/pets/${id}/vaccines/${vaccineId}`);
  }
}
