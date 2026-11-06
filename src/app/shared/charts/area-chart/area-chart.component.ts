import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface AreaSeries {
  name: string;
  color: string;
  values: number[];
  fill?: boolean;
}

@Component({
  selector: 'app-area-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './area-chart.component.html',
  styleUrls: ['./area-chart.component.scss'],
})
export class AreaChartComponent {
  @Input() labels: string[] = [];
  @Input() series: AreaSeries[] = [];
  @Input() height = 220;
  @Input() yTicks: string[] = [];
  @Input() maxValue?: number;

  readonly width = 900;
  padLeft = 46;
  padRight = 16;
  padTop = 12;
  padBottom = 26;

  get innerWidth(): number {
    return this.width - this.padLeft - this.padRight;
  }

  get innerHeight(): number {
    return this.height - this.padTop - this.padBottom;
  }

  get maxVal(): number {
    if (this.maxValue) return this.maxValue;
    const all = this.series.flatMap((s) => s.values);
    return Math.max(...all, 1) * 1.12;
  }

  xFor(i: number): number {
    const step = this.innerWidth / Math.max(this.labels.length - 1, 1);
    return this.padLeft + step * i;
  }

  yFor(v: number): number {
    return this.padTop + this.innerHeight - (v / this.maxVal) * this.innerHeight;
  }

  linePath(series: AreaSeries): string {
    return series.values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${this.xFor(i)} ${this.yFor(v)}`).join(' ');
  }

  areaPath(series: AreaSeries): string {
    const line = series.values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${this.xFor(i)} ${this.yFor(v)}`).join(' ');
    const lastX = this.xFor(series.values.length - 1);
    const firstX = this.xFor(0);
    const base = this.padTop + this.innerHeight;
    return `${line} L ${lastX} ${base} L ${firstX} ${base} Z`;
  }

  gridLines(): number[] {
    const count = 4;
    return Array.from({ length: count + 1 }, (_, i) => this.padTop + (this.innerHeight / count) * i);
  }
}
