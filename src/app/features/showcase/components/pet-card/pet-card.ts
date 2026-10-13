import { HlmCarouselImports } from '@spartan-ng/helm/carousel';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';
import { HlmCollapsibleImports } from '@spartan-ng/helm/collapsible';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { Component, computed, effect, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { PublicPet } from '../../../../core/models/pet';
import { Icon } from '../../../../shared/components/icon/icon';

export function whatsappLink(phone: string, name: string): string | null {
  let digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (!/^[1-9]\d{8,14}$/.test(digits)) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(`Olá! Vi o pet ${name} no Adopetz e gostaria de saber mais sobre a adoção.`)}`;
}
export function emailLink(email: string, name: string): string | null {
  if (!/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email ?? '')) return null;
  return `mailto:${email}?subject=${encodeURIComponent(`Adoção de ${name} — Adopetz`)}&body=${encodeURIComponent(`Olá! Tenho interesse em adotar ${name}. Podemos conversar?`)}`;
}
@Component({
  selector: 'app-pet-card',
  host: { class: 'block h-full' },
  imports: [
    HlmCarouselImports,
    HlmPopoverImports,
    HlmCollapsibleImports,
    HlmBadgeImports,
    HlmCardImports,
    DatePipe,
    Icon,
    HlmButtonImports,
  ],
  templateUrl: './pet-card.html',
})
export class PetCard {
  readonly pet = input.required<PublicPet>();
  protected readonly brokenImages = signal<string[]>([]);
  protected readonly images = computed(() =>
    this.pet().images.filter((image) => /^https?:\/\//i.test(image.filePath)),
  );
  protected readonly whatsapp = computed(() =>
    whatsappLink(this.pet().manager.phone, this.pet().name),
  );
  protected readonly email = computed(() => emailLink(this.pet().manager.email, this.pet().name));
  protected readonly age = computed(() => {
    const age = this.pet().ageInYears;
    return age == null
      ? 'Idade não informada'
      : age === 0
        ? 'Menos de 1 ano'
        : `${age} ${age === 1 ? 'ano' : 'anos'}`;
  });
  constructor() {
    effect(() => {
      this.pet();
      this.brokenImages.set([]);
    });
  }
  protected imageFailed(url: string) {
    this.brokenImages.update((images) => [...images, url]);
  }
}
