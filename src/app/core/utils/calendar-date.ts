/** Read the calendar day returned by the API without applying a timezone offset. */
export function dateFromApi(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** The API represents date-only fields as UTC midnight. */
export function dateToApi(value: Date | null | undefined): string | null {
  if (!value) return null;
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}T00:00:00Z`;
}

export function formatCalendarDate(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(value);
}
