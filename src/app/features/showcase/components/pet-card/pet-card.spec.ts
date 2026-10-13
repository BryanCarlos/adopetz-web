import { TestBed } from '@angular/core/testing';
import { PetCard, whatsappLink, emailLink } from './pet-card';
import { provideBrowserObservers } from '../../../../shared/testing/browser-observers';
import { vi } from 'vitest';

describe('Pet contacts and photos', () => {
  beforeEach(() => provideBrowserObservers());
  afterEach(() => vi.unstubAllGlobals());
  it('normalizes Brazilian phones and URL encodes the pet name', () => {
    expect(whatsappLink('(11) 99999-9999', 'Mel & Sol')).toBe(
      'https://wa.me/5511999999999?text=' +
        encodeURIComponent(
          'Olá! Vi o pet Mel & Sol no Adopetz e gostaria de saber mais sobre a adoção.',
        ),
    );
    expect(whatsappLink('', 'Thor')).toBeNull();
    expect(emailLink('ong@example.org', 'Mel & Sol')).toContain(
      'subject=Ado%C3%A7%C3%A3o%20de%20Mel%20%26%20Sol',
    );
    expect(emailLink('invalid', 'Thor')).toBeNull();
  });

  it('renders every photo in the carousel and replaces only a failed image', async () => {
    TestBed.configureTestingModule({ imports: [PetCard] });
    const fixture = TestBed.createComponent(PetCard);
    fixture.componentRef.setInput('pet', {
      name: 'Thor',
      about: 'Amigável',
      ageInYears: 0,
      breed: null,
      manager: { name: 'ONG', email: '', phone: '' },
      vaccines: [],
      images: [
        { filePath: 'https://example.org/1.jpg' },
        { filePath: 'https://example.org/2.jpg' },
      ],
    });
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('img').length).toBe(2);
    expect(element.querySelector('[aria-label="Próxima foto de Thor"]')).toBeTruthy();
    element.querySelector('img')!.dispatchEvent(new Event('error'));
    await fixture.whenStable();
    expect(element.querySelector('.photo-placeholder')).toBeTruthy();
    expect(element.querySelector('img')?.getAttribute('src')).toBe('https://example.org/2.jpg');
    expect(element.textContent).toContain('Menos de 1 ano');
  });

  it('reveals vaccine names and dates through an accessible collapsible trigger', async () => {
    TestBed.configureTestingModule({ imports: [PetCard] });
    const fixture = TestBed.createComponent(PetCard);
    fixture.componentRef.setInput('pet', {
      name: 'Nina',
      about: 'Amigável',
      ageInYears: 1,
      breed: null,
      manager: { name: 'ONG', email: '', phone: '' },
      images: [],
      vaccines: [
        { name: 'Antirrábica', applicationDate: '2026-09-15T00:00:00Z' },
        { name: 'V10', applicationDate: null },
      ],
    });
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const trigger = element.querySelector<HTMLButtonElement>('[hlmCollapsibleTrigger]')!;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    trigger.click();
    await fixture.whenStable();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const list = element.querySelector('[aria-label="Vacinas registradas de Nina"]')!;
    expect(list.textContent).toContain('Antirrábica');
    expect(list.textContent).toContain('15/09/2026');
    expect(list.textContent).toContain('V10');
    expect(list.textContent).toContain('Data de aplicação não informada');
  });
});
