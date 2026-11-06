import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DonutSegment {
  label: string;
  pct: number;
  color: string;
}

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './donut-chart.component.html',
  styleUrls: ['./donut-chart.component.scss'],
})
export class DonutChartComponent {
  @Input() segments: DonutSegment[] = [];
  @Input() size = 180;
  @Input() strokeWidth = 30;

  get radius(): number {
    return (this.size - this.strokeWidth) / 2;
  }
  get circumference(): number {
    return 2 * Math.PI * this.radius;
  }

  dashArray(pct: number): string {
    const len = (pct / 100) * this.circumference;
    return `${len} ${this.circumference - len}`;
  }

  offsetFor(index: number): number {
    let acc = 0;
    for (let i = 0; i < index; i++) acc += this.segments[i].pct;
    return -((acc / 100) * this.circumference);
  }
}
