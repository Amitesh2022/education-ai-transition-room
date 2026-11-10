import { ChangeDetectionStrategy, Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

type TransitionPlan = { id: number; title: string; owner: string; status: 'Draft' | 'Review' | 'Approved'; priority: 'Low' | 'Medium' | 'High' };

@Component({ selector: 'app-root', templateUrl: './app.html', styleUrl: './app.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class App {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly journeys = signal<TransitionPlan[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly query = signal('');
  protected readonly ready = computed(() => this.journeys().filter((item) => item.status === 'Approved').length);
  protected readonly needsAttention = computed(() => this.journeys().filter((item) => item.priority === 'High').length);
  protected readonly visibleJourneys = computed(() => this.journeys().filter((item) => `${item.title} ${item.owner} ${item.status}`.toLowerCase().includes(this.query().toLowerCase())).sort((a, b) => a.title.localeCompare(b.title)));

  constructor() { if (isPlatformBrowser(this.platformId)) this.load(); else this.loading.set(false); }

  protected load() {
    this.loading.set(true);
    this.http.get<TransitionPlan[]>('/api/items').subscribe({ next: (items) => { this.journeys.set(items); this.loading.set(false); }, error: () => { this.error.set('Education and AI transition information is temporarily unavailable.'); this.loading.set(false); } });
  }

  protected addJourney() {
    const request = { title: 'Benelux classroom AI literacy plan', owner: 'Benelux Teacher Development Team', status: 'Draft', priority: 'Medium' };
    this.http.post<TransitionPlan>('/api/items', request).subscribe({ next: (item) => this.journeys.update((items) => [...items, item]), error: () => this.error.set('The transition plan could not be saved.') });
  }

  protected advance(item: TransitionPlan) {
    const status = item.status === 'Draft' ? 'Review' : 'Approved';
    this.http.put<TransitionPlan>(`/api/items/${item.id}`, { ...item, status }).subscribe({ next: (updated) => this.journeys.update((items) => items.map((entry) => entry.id === updated.id ? updated : entry)), error: () => this.error.set('The transition plan could not be updated.') });
  }
}
