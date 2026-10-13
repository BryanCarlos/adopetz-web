export interface Page<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
}
export interface PetImage {
  filePath: string;
}
export interface Vaccine {
  name: string;
  applicationDate: string | null;
}
export interface PublicPet {
  name: string;
  about: string;
  isAdopted: boolean;
  breed: string | null;
  ageInYears: number | null;
  rescueDate: string | null;
  manager: { email: string; phone: string; name: string };
  vaccines: Vaccine[];
  images: PetImage[];
}
export interface ManagerPet extends Omit<PublicPet, 'manager' | 'images' | 'vaccines'> {
  id: string;
  images: (PetImage & { id: string })[];
  vaccines: (Vaccine & { id: string })[];
}

export interface PetDetails {
  name: string;
  breed: string | null;
  about: string;
  ageInYears: number | null;
  rescueDate: string | null;
  adopted: boolean;
}
export interface VaccineDetails {
  name: string;
  applicationDate: string | null;
}
