import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuperadminDataService } from '../../../core/services/superadmin-data.service';

@Component({
  selector: 'app-reservas-plataforma',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservas-plataforma.component.html',
  styleUrls: ['./reservas-plataforma.component.scss'],
})
export class ReservasPlataformaComponent implements OnInit {
  constructor(public data: SuperadminDataService) {}

  ngOnInit(): void {
    this.data.cargarDesdeBackend();
  }

  get comisionesGeneradas(): number {
    return this.data.reservasPlataforma.reduce((s, r) => s + r.comision, 0);
  }
  get netoHoteles(): number {
    return this.data.reservasPlataforma.reduce((s, r) => s + r.neto, 0);
  }

  estadoClass(e: string): string {
    return e === 'Confirmada' || e === 'completada' ? 'green' : 'blue';
  }
}
