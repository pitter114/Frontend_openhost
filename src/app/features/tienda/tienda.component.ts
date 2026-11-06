import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { TiendaService, ProductoTienda, HorariosHotel } from '../../core/services/tienda.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { LoadingModalComponent } from '../../shared/loading-modal/loading-modal.component';

interface CartItem {
  producto: ProductoTienda;
  cantidad: number;
}

@Component({
  selector: 'app-tienda',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, LoadingModalComponent],
  templateUrl: './tienda.component.html',
  styleUrls: ['./tienda.component.scss'],
})
export class TiendaComponent implements OnInit {
  private tiendaService = inject(TiendaService);
  private orgService = inject(OrganizacionService);
  private toast = inject(ToastService);

  cargando = signal(true);
  vistaActiva = signal<'pos' | 'ventas'>('pos');
  categoriaSeleccionada = signal<string>('Todas');
  busqueda = '';

  productos = signal<ProductoTienda[]>([]);
  habitaciones = signal<{ alojamiento_id: number; etiqueta: string; reserva_id: number; huesped: string; dni: string }[]>([]);
  ventas = signal<any[]>([]);
  resumenVentas = signal<{ total_ventas_hoy: number; cargos_pendientes_checkout: number }>({
    total_ventas_hoy: 0,
    cargos_pendientes_checkout: 0,
  });

  // Carrito de compras
  carrito = signal<CartItem[]>([]);
  metodoPago = signal<'Efectivo' | 'Yape' | 'Plin' | 'Tarjeta' | 'Cargo a Habitación'>('Efectivo');
  habitacionElegida = signal<any | null>(null);
  procesandoVenta = signal(false);

  // Modal Horarios & Check-Out Automático
  mostrarModalHorarios = signal(false);
  guardandoHorarios = signal(false);
  ejecutandoCheckout = signal(false);
  horariosForm: HorariosHotel = {
    organizacion_id: 0,
    nombre_comercial: '',
    hora_check_in: '14:00',
    hora_check_out: '12:00',
    checkout_automatico: true,
    checkout_tolerancia_minutos: 30,
  };

  // Modal Nuevo Producto
  mostrarModalProducto = signal(false);
  nuevoProd = {
    nombre: '',
    categoria: 'Bebidas' as any,
    precio_venta: 5.0,
    stock_actual: 30,
    icono: 'coffee',
  };

  categorias = ['Todas', 'Bebidas', 'Snacks', 'Higiene', 'Servicios', 'Souvenirs'];

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    const orgId = this.orgService.orgActivaId();
    if (!orgId) return;

    this.cargando.set(true);
    this.tiendaService.listarProductos(orgId).subscribe({
      next: (res) => {
        this.productos.set(res.data || []);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });

    this.tiendaService.habitacionesActivas(orgId).subscribe({
      next: (res) => this.habitaciones.set(res.data || []),
    });

    this.tiendaService.listarVentas(orgId).subscribe({
      next: (res) => {
        this.ventas.set(res.data || []);
        if (res.resumen) this.resumenVentas.set(res.resumen);
      },
    });

    this.tiendaService.obtenerHorarios(orgId).subscribe({
      next: (res) => {
        if (res.data) this.horariosForm = { ...res.data };
      },
    });
  }

  productosFiltrados = computed(() => {
    const cat = this.categoriaSeleccionada();
    const term = this.busqueda.trim().toLowerCase();
    let list = this.productos();

    if (cat !== 'Todas') {
      list = list.filter((p) => p.categoria === cat);
    }
    if (term) {
      list = list.filter((p) => p.nombre.toLowerCase().includes(term) || p.categoria.toLowerCase().includes(term));
    }
    return list;
  });

  totalCarrito = computed(() => {
    return this.carrito().reduce((sum, item) => sum + item.producto.precio_venta * item.cantidad, 0);
  });

  agregarAlCarrito(p: ProductoTienda): void {
    if (p.stock_actual <= 0 && p.categoria !== 'Servicios') {
      this.toast.error(`"${p.nombre}" no tiene stock disponible.`);
      return;
    }
    this.carrito.update((actual) => {
      const idx = actual.findIndex((i) => i.producto.producto_id === p.producto_id);
      if (idx >= 0) {
        const copy = [...actual];
        copy[idx].cantidad++;
        return copy;
      }
      return [...actual, { producto: p, cantidad: 1 }];
    });
  }

  decrementarItem(pId: number): void {
    this.carrito.update((actual) => {
      const idx = actual.findIndex((i) => i.producto.producto_id === pId);
      if (idx === -1) return actual;
      if (actual[idx].cantidad > 1) {
        const copy = [...actual];
        copy[idx].cantidad--;
        return copy;
      }
      return actual.filter((i) => i.producto.producto_id !== pId);
    });
  }

  eliminarItem(pId: number): void {
    this.carrito.update((actual) => actual.filter((i) => i.producto.producto_id !== pId));
  }

  limpiarCarrito(): void {
    this.carrito.set([]);
    this.habitacionElegida.set(null);
  }

  confirmarVenta(): void {
    const items = this.carrito();
    if (items.length === 0) {
      this.toast.error('El carrito de compras está vacío.');
      return;
    }

    const metodo = this.metodoPago();
    const hab = this.habitacionElegida();

    if (metodo === 'Cargo a Habitación' && !hab) {
      this.toast.error('Selecciona la habitación a la que se cargará este consumo.');
      return;
    }

    const orgId = this.orgService.orgActivaId();
    if (!orgId) return;

    this.procesandoVenta.set(true);

    const payload = {
      items: items.map((i) => ({
        producto_id: i.producto.producto_id,
        nombre: i.producto.nombre,
        cantidad: i.cantidad,
        precio_unitario: i.producto.precio_venta,
      })),
      metodo_pago: metodo,
      huesped_nombre: hab ? hab.huesped : 'Cliente Mostrador',
      reserva_id: hab?.reserva_id ?? null,
      alojamiento_id: hab?.alojamiento_id ?? null,
      habitacion_etiqueta: hab?.etiqueta ?? null,
    };

    this.tiendaService.registrarVenta(orgId, payload).subscribe({
      next: (res) => {
        this.procesandoVenta.set(false);
        this.toast.success(res.mensaje || 'Venta registrada exitosamente.');
        this.limpiarCarrito();
        this.cargarDatos();
      },
      error: (err) => {
        this.procesandoVenta.set(false);
        this.toast.error(err?.error?.mensaje || 'Error al procesar la venta.');
      },
    });
  }

  // --- Modal Horarios ---
  abrirModalHorarios(): void {
    this.mostrarModalHorarios.set(true);
  }

  cerrarModalHorarios(): void {
    this.mostrarModalHorarios.set(false);
  }

  guardarHorarios(): void {
    const orgId = this.orgService.orgActivaId();
    if (!orgId) return;

    this.guardandoHorarios.set(true);
    this.tiendaService.actualizarHorarios(orgId, this.horariosForm).subscribe({
      next: (res) => {
        this.guardandoHorarios.set(false);
        this.toast.success('Horarios y configuración de Check-out guardados.');
        this.cerrarModalHorarios();
      },
      error: () => {
        this.guardandoHorarios.set(false);
        this.toast.error('Error al guardar horarios.');
      },
    });
  }

  ejecutarCheckoutManual(): void {
    const orgId = this.orgService.orgActivaId();
    if (!orgId) return;

    this.ejecutandoCheckout.set(true);
    this.tiendaService.ejecutarCheckoutManual(orgId).subscribe({
      next: (res) => {
        this.ejecutandoCheckout.set(false);
        this.toast.info(res.detalle || 'Check-out automático ejecutado.');
        this.cargarDatos();
      },
      error: () => {
        this.ejecutandoCheckout.set(false);
        this.toast.error('No se pudo ejecutar el check-out.');
      },
    });
  }

  // --- Modal Producto ---
  abrirModalProducto(): void {
    this.nuevoProd = {
      nombre: '',
      categoria: 'Bebidas',
      precio_venta: 5.0,
      stock_actual: 30,
      icono: 'coffee',
    };
    this.mostrarModalProducto.set(true);
  }

  cerrarModalProducto(): void {
    this.mostrarModalProducto.set(false);
  }

  crearProducto(): void {
    if (!this.nuevoProd.nombre.trim()) {
      this.toast.error('Ingresa el nombre del producto.');
      return;
    }

    const orgId = this.orgService.orgActivaId();
    if (!orgId) return;

    this.tiendaService.guardarProducto(orgId, this.nuevoProd).subscribe({
      next: () => {
        this.toast.success(`"${this.nuevoProd.nombre}" agregado a la tienda.`);
        this.cerrarModalProducto();
        this.cargarDatos();
      },
      error: () => this.toast.error('Error al crear producto.'),
    });
  }
}
