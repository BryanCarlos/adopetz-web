import { TestBed } from '@angular/core/testing';
import { PetCard, whatsappLink, emailLink } from './pet-card';

describe('Pet contacts and photos', () => {
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

  it('cycles photos and provides a fallback for a failed image', async () => {
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
    const next = element.querySelector<HTMLButtonElement>('[aria-label="Próxima foto de Thor"]')!;
    next.click();
    await fixture.whenStable();
    expect(element.querySelector('img')?.getAttribute('src')).toBe('https://example.org/2.jpg');
    element.querySelector('img')!.dispatchEvent(new Event('error'));
    await fixture.whenStable();
    expect(element.querySelector('.photo-placeholder')).toBeTruthy();
    next.click();
    await fixture.whenStable();
    expect(element.querySelector('img')?.getAttribute('src')).toBe('https://example.org/1.jpg');
    expect(element.textContent).toContain('Menos de 1 ano');
  });
});
