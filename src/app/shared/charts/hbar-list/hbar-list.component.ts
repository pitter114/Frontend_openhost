import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface HBarItem {
  label: string;
  sublabel?: string;
  value: string;
  pct: number;
  color?: string;
}

@Component({
  selector: 'app-hbar-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hbar-item" *ngFor="let item of items">
      <div class="hbar-item__top">
        <span class="hbar-item__label">{{ item.label }}</span>
        <span class="hbar-item__value">{{ item.value }}</span>
      </div>
      <div class="hbar-item__track">
        <div class="hbar-item__fill" [style.width.%]="item.pct" [style.background]="item.color || 'var(--pms-blue)'"></div>
      </div>
      <div class="hbar-item__sub" *ngIf="item.sublabel">{{ item.sublabel }}</div>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .hbar-item { margin-bottom: 18px; }
      .hbar-item:last-child { margin-bottom: 0; }
      .hbar-item__top { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13.5px; }
      .hbar-item__label { font-weight: 600; color: var(--pms-text); }
      .hbar-item__value { color: var(--pms-text-soft); font-weight: 600; }
      .hbar-item__track { height: 6px; background: #eef0f4; border-radius: 999px; overflow: hidden; }
      .hbar-item__fill { height: 100%; border-radius: 999px; }
      .hbar-item__sub { margin-top: 5px; font-size: 12px; color: var(--pms-text-muted); }
    `,
  ],
})
export class HbarListComponent {
  @Input() items: HBarItem[] = [];
}
