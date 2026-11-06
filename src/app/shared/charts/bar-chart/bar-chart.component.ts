import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BarSeries {
  name: string;
  color: string;
  values: number[];
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss'],
})
export class BarChartComponent {
  @Input() labels: string[] = [];
  @Input() series: BarSeries[] = [];
  @Input() height = 220;
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
    return Math.max(...all, 1) * 1.15;
  }

  groupWidth(): number {
    return this.innerWidth / Math.max(this.labels.length, 1);
  }

  barWidth(): number {
    const gw = this.groupWidth();
    const n = Math.max(this.series.length, 1);
    return Math.min(22, (gw * 0.56) / n);
  }

  barX(groupIndex: number, seriesIndex: number): number {
    const gw = this.groupWidth();
    const bw = this.barWidth();
    const n = this.series.length;
    const totalW = bw * n + (n - 1) * 4;
    const groupStart = this.padLeft + gw * groupIndex + (gw - totalW) / 2;
    return groupStart + seriesIndex * (bw + 4);
  }

  barY(v: number): number {
    return this.padTop + this.innerHeight - (v / this.maxVal) * this.innerHeight;
  }

  barHeight(v: number): number {
    return (v / this.maxVal) * this.innerHeight;
  }

  groupCenter(i: number): number {
    return this.padLeft + this.groupWidth() * i + this.groupWidth() / 2;
  }

  gridLines(): number[] {
    const count = 4;
    return Array.from({ length: count + 1 }, (_, i) => this.padTop + (this.innerHeight / count) * i);
  }
}
