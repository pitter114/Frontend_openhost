import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IconComponent } from '../../shared/icon/icon.component';
import { environment } from '../../../environments/environment';

import { PmsDataService } from '../../core/services/pms-data.service';

@Component({
  selector: 'app-reservar-publico',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './reservar-publico.component.html',
  styleUrls: ['./reservar-publico.component.scss'],
})
export class ReservarPublicoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private pmsDataService = inject(PmsDataService);

  hotelNombre = '';
  unidad = '';
  tipo = '';
  precioBase = 0;
  imagen = '';
  checkin = '';
  checkout = '';
  descuento = 0;
  numHuespedes = 1;
  maxHuespedesBase = 1;
  costoHuespedExtra = 0;

  enviado = signal(false);
  guardando = signal(false);
  errorGuardar = signal<string | null>(null);

  metodoPago = signal<'mercadopago' | 'hotel'>('mercadopago');
  mercadoPagoData = signal<{ preference_id: string; init_point: string; sandbox_init_point?: string } | null>(null);
  reservaCreadaId = signal<number | null>(null);

  form = this.fb.group({
    nombreCompleto: ['', [Validators.required, Validators.maxLength(100)]],
    dni: ['', [Validators.required, Validators.maxLength(15)]],
    celular: ['', [Validators.required, Validators.pattern(/^[0-9+ ]+$/), Validators.maxLength(20)]],
  });

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const numero = this.route.snapshot.paramMap.get('numero');

    this.hotelNombre = params.get('hotel') ?? '';
    this.unidad = params.get('unidad') ?? '';
    this.tipo = params.get('tipo') ?? '';
    this.precioBase = Number(params.get('precio')) || 0;
    this.imagen = params.get('imagen') ?? '';
    this.checkin = params.get('checkin') ?? '';
    this.checkout = params.get('checkout') ?? '';
    this.descuento = Number(params.get('descuento')) || 0;
    this.numHuespedes = Number(params.get('huespedes')) || 1;
    if (params.get('base')) this.maxHuespedesBase = Number(params.get('base')) || 1;
    if (params.get('costoExtra')) this.costoHuespedExtra = Number(params.get('costoExtra')) || 0;

    if (numero) {
      this.http.get<{ data: any }>(`${environment.apiUrl}/publico/alojamientos/${numero}`).subscribe({
        next: (res) => {
          const data = res?.data;
          if (data) {
            if (!this.hotelNombre) this.hotelNombre = data.hotel_nombre || 'HotelPMS';
            if (!this.unidad) this.unidad = data.etiqueta_unidad || '';
            if (!this.tipo) this.tipo = data.tipo_alojamiento || '';
            if (!this.precioBase) this.precioBase = Number(data.precio_base) || 0;
            if (!this.imagen) this.imagen = data.imagen_principal || '';
            this.maxHuespedesBase = data.max_huespedes_base || 1;
            this.costoHuespedExtra = Number(data.costo_huesped_extra) || 0;
          }
        },
        error: (err) => {
          console.error('Error al cargar información de la habitación', err);
          if (!this.hotelNombre) this.hotelNombre = 'HotelPMS';
        },
      });
    } else if (!this.hotelNombre) {
      this.hotelNombre = 'HotelPMS';
    }
  }

  noches = computed(() => {
    if (!this.checkin || !this.checkout) return 0;
    const diff = Math.round(
      (new Date(this.checkout).getTime() - new Date(this.checkin).getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff > 0 ? diff : 0;
  });

  extraHuespedesCount = computed(() => Math.max(0, this.numHuespedes - this.maxHuespedesBase));
  costoExtraTotal = computed(() => this.extraHuespedesCount() * this.costoHuespedExtra * this.noches());
  subtotal = computed(() => (this.noches() * this.precioBase) + this.costoExtraTotal());
  total = computed(() => Math.max(0, Math.round(this.subtotal() * (1 - this.descuento / 100))));

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const numero = this.route.snapshot.paramMap.get('numero');

    const celularSoloDigitos = (v.celular || '').replace(/\D/g, '') || '000000000';

    const payload = {
      alojamiento_id: Number(numero),
      nombre_completo: v.nombreCompleto,
      dni: v.dni,
      celular: celularSoloDigitos,
      fecha_ingreso: this.checkin || new Date().toISOString().slice(0, 10),
      fecha_salida: this.checkout || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      num_huespedes: this.numHuespedes,
      descuento: this.descuento,
    };

    this.guardando.set(true);
    this.errorGuardar.set(null);

    this.http.post<{ message: string; data: any }>(`${environment.apiUrl}/publico/reservas`, payload).subscribe({
      next: (res) => {
        const reservaId = res?.data?.reserva_id;
        this.reservaCreadaId.set(reservaId);
        this.pmsDataService.cargarReservas();

        try {
          localStorage.setItem(
            'pms_nueva_reserva_publica',
            JSON.stringify({
              time: Date.now(),
              unidad: this.unidad,
              cliente: v.nombreCompleto,
            })
          );
        } catch {}

        if (this.metodoPago() === 'mercadopago' && reservaId) {
          // Generar preferencia de Mercado Pago
          this.http.post<{ ok: boolean; data: any }>(
            `${environment.apiUrl}/publico/reservas/${reservaId}/mercadopago/preferencia`,
            {
              monto: this.total(),
              nombre: v.nombreCompleto,
              email: `${v.dni}@reserva.com`,
            }
          ).subscribe({
            next: (mpRes) => {
              this.guardando.set(false);
              this.enviado.set(true);
              if (mpRes.ok && mpRes.data) {
                this.mercadoPagoData.set(mpRes.data);
                // Si tiene init_point válido, redirigir automáticamente o abrir
                if (mpRes.data.init_point) {
                  window.location.href = mpRes.data.init_point;
                }
              }
            },
            error: () => {
              this.guardando.set(false);
              this.enviado.set(true);
            },
          });
        } else {
          this.guardando.set(false);
          this.enviado.set(true);
        }
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorGuardar.set(err?.error?.message ?? 'No se pudo guardar la reserva.');
      },
    });
  }

  irAMercadoPago(): void {
    const mp = this.mercadoPagoData();
    if (mp?.init_point) {
      window.location.href = mp.init_point;
    }
  }
}