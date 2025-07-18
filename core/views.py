# LIBRERÍAS DE PYTHON
import json
from datetime import date, timedelta

# FUNCIONES PARA MOSTRAR VISTAS Y REDIRECCIONES
from django.shortcuts import render, redirect

# FUNCIONES PARA MANEJAR FECHAS Y TIEMPOS
from django.utils import timezone
from django.utils.timezone import now
from django.utils.dateparse import parse_date

# JSON, CSRF Y MENSAJES
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

# CONSULTAS A BASE DE DATOS Y TRANSACCIONES
from django.db import transaction
from django.db.models import Q, Count, Sum
from django.db.models.functions import TruncMonth

# CONFIGURACIÓN DEL PROYECTO
from django.conf import settings

# MODELOS DEL PROYECTO
from .models import Producto, Categoria, Comanda, Usuario, Mesa, Estado, Acompanamiento, DetalleComanda

# ------------ LOGIN Y CIERRE DE SESIÓN ------------

# LOGIN
@csrf_exempt
def login(request):
    error = False

    if request.method == 'POST':
        correo    = request.POST.get('correo_usuario')
        password  = request.POST.get('password_usuario')

        try:
            usuario = Usuario.objects.get(
                correo_usuario=correo,
                password_usuario=password
            )

            request.session['nombre_usuario'] = usuario.nombre_usuario

            destino = {
                1: 'cocina',
                2: 'garzon',
                3: 'caja',
                4: 'productos',
            }.get(usuario.rol_id, 'login')

            return redirect(destino)

        except Usuario.DoesNotExist:
            error = True

    return render(request, 'login.html', {'error': error})

# CERRAR SESIÓN

def logout(request):
    request.session.flush()
    return redirect('/')

# ------------ FIN LOGIN Y CIERRE DE SESIÓN ------------



# ------------ VISTA DE GARZON ------------

def garzon(request):
    categorias = Categoria.objects.filter(id_categoria__in=[1, 2, 3, 4, 5])
    mesas = Mesa.objects.all()
    comandas_activas = Comanda.objects.exclude(estado_id__in=[4, 5])

    mesas_con_estado = []
    mesas_ocupadas_numeros = set()

    for mesa in mesas:
        comanda = (
            comandas_activas
            .filter(mesa=mesa)
            .order_by('-id_comanda')
            .first()
        )

        if comanda:
            mesas_ocupadas_numeros.add(mesa.numero_mesa)

            if comanda.estado_id == 1:
                estado_class = 'mesa-estado-preparacion'
            elif comanda.estado_id == 2:
                estado_class = 'mesa-estado-entregar'
            elif comanda.estado_id == 3:
                estado_class = 'mesa-estado-entregado'
            else:
                estado_class = 'mesa-estado-libre'

            mesas_con_estado.append({
                'numero'       : mesa.numero_mesa,
                'estado_class' : estado_class,
                'estado_texto' : comanda.estado.nombre_estado,
                'pedido'       : f'Pedido {comanda.id_comanda}',
            })
        else:
            mesas_con_estado.append({
                'numero'       : mesa.numero_mesa,
                'estado_class' : 'mesa-estado-libre',
                'estado_texto' : 'Libre',
                'pedido'       : '',
            })

    mesas_disponibles = Mesa.objects.exclude(
        numero_mesa__in=mesas_ocupadas_numeros
    )

    mesas_disponibles_numeros = [
        m.numero_mesa for m in mesas_disponibles
    ]

    mesa_actual          = mesas_con_estado[0]['numero'] if mesas_con_estado else None
    mesa_actual_ocupada  = mesa_actual in mesas_ocupadas_numeros
    mesa_obj             = Mesa.objects.filter(numero_mesa=mesa_actual).first()

    return render(request, 'garzon.html', {
        'categorias'                : categorias,
        'mesas'                     : mesas_con_estado,
        'mesas_disponibles'         : mesas_disponibles,
        'mesa_actual_ocupada'       : mesa_actual_ocupada,
        'mesa'                      : mesa_obj,
        'mesas_disponibles_numeros' : mesas_disponibles_numeros,
    })

# COMANDAS CON ESTADO ID 1, 2 Y 3 APAREZCAN
@csrf_exempt
def obtener_comanda_por_mesa(request, numero):
    try:
        mesa = Mesa.objects.get(numero_mesa=numero)

        comanda = (
            Comanda.objects
            .filter(mesa=mesa)
            .exclude(estado_id__in=[4, 5])
            .order_by('-id_comanda')
            .first()
        )

        if not comanda:
            return JsonResponse({'comanda_id': None})

        productos = []
        total     = 0

        detalles = (
            DetalleComanda.objects
            .select_related('producto', 'acompanamiento')
            .filter(comanda=comanda)
        )

        for d in detalles:

            partes = []
            if d.producto:
                partes.append(d.producto.nombre_producto)
            if d.acompanamiento:
                partes.append(d.acompanamiento.nombre_acompanamiento)
            nombre = ' - '.join(partes)


            precio_unitario = 0
            if d.producto:
                precio_unitario += d.producto.precio_producto

            if d.acompanamiento and not (
                d.producto and d.producto.acompanamiento_producto
            ):
                precio_unitario += d.acompanamiento.precio_acompanamiento

            subtotal = precio_unitario * d.cantidad_detalle_comanda
            total   += subtotal

            productos.append({
                'product_id'        : d.producto_id,
                'acompanamiento_id' : d.acompanamiento_id,
                'cantidad'          : d.cantidad_detalle_comanda,
                'precio_unitario'   : precio_unitario,
                'nombre'            : nombre,
            })

        return JsonResponse({
            'comanda_id': comanda.pk,
            'estado_id' : comanda.estado_id,
            'items'     : productos,
            'total'     : total,
        })

    except Mesa.DoesNotExist:
        return JsonResponse({'error': 'Mesa no encontrada'}, status=404)

# CREAR COMANDA
@csrf_exempt
def crear_comanda(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        data = json.loads(request.body or '{}')

        usuario = Usuario.objects.get(
            nombre_usuario=request.session['nombre_usuario']
        )
        mesa   = Mesa.objects.get(pk=data['mesa_id'])
        estado = Estado.objects.get(pk=data['estado_id'])

        ahora = timezone.localtime()

        with transaction.atomic():
            comanda = Comanda.objects.create(
                usuario              = usuario,
                mesa                 = mesa,
                estado               = estado,
                precio_total_comanda = data['precio_total_comanda'],
                fecha_comanda        = ahora.date(),
                hora_inicio_comanda  = ahora
            )

            for it in data.get('items', []):
                DetalleComanda.objects.create(
                    comanda                   = comanda,
                    producto_id              = it.get('product_id'),
                    acompanamiento_id        = it.get('acompanamiento_id'),
                    cantidad_detalle_comanda = it.get('cantidad', 1)
                )

        return JsonResponse({'success': True, 'comanda_id': comanda.pk})

    except Exception as e:
        print('ERROR EN CREACIÓN DE COMANDA:', e)
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

# ENTREGAR COMANDA SOLO CUANDO LA ID DE ESTADO ES 2
@csrf_exempt
def entregar_comanda_garzon(request, id):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        comanda = Comanda.objects.get(id_comanda=id)
    except Comanda.DoesNotExist:
        return JsonResponse({'error': 'Comanda no encontrada'}, status=404)

    if comanda.estado_id != 2:
        return JsonResponse(
            {'error': 'Solo puedes marcar como entregada una comanda en estado "Esperando entrega".'},
            status=400
        )

    comanda.estado_id = 3
    comanda.hora_fin_comanda = timezone.now()
    comanda.save()
    return JsonResponse({'mensaje': 'Comanda entregada correctamente'})

# HISTORIAL DE COMANDAS
def historial(request):
    fecha_filtrada = request.GET.get('fecha')
    comandas = Comanda.objects.filter(estado_id=4).order_by('-fecha_comanda', '-hora_inicio_comanda')

    if fecha_filtrada:
        comandas = comandas.filter(fecha_comanda=parse_date(fecha_filtrada))

    context = {
        'comandas': comandas,
        'fecha_filtrada': fecha_filtrada
    }
    return render(request, 'historial.html', context)

# ------------ FIN VISTA DE GARZON ------------


# ------------ API DE PRODUCTOS Y ACOMPAÑAMIENTOS ------------

# OBTENER PRODUCTOS POR ID DE CATEGORIA EN LA BASE DE DATOS
def obtener_productos_por_categoria(request, categoria_id):
    productos = Producto.objects.filter(categoria_id=categoria_id)
    data = [
        {
            'id': p.id_producto,
            'nombre': p.nombre_producto,
            'precio': int(p.precio_producto),
            'imagen': p.imagen_producto.url if p.imagen_producto else '/static/icons/prueba.jpg',
            'acompanamiento_producto': p.acompanamiento_producto,
        }
        for p in productos
    ]
    return JsonResponse({'productos': data})

# OBTENER ACOMPAÑAMIENTOS BASE DE DATOS
def obtener_acompanamientos(request):
    acompanamientos = Acompanamiento.objects.all()
    data = [
        {
            'id'    : a.id_acompanamiento,
            'nombre': a.nombre_acompanamiento,
            'precio': int(a.precio_acompanamiento),
            'imagen': a.imagen_acompanamiento.url if a.imagen_acompanamiento else ''
        }
        for a in acompanamientos
    ]
    return JsonResponse({'acompanamientos': data})

# ------------ FIN API DE PRODUCTOS Y ACOMPAÑAMIENTOS ------------



# ------------ VISTA COCINA ------------

def cocina(request):

    comandas = (
        Comanda.objects
        .filter(estado_id=1)
        .select_related('mesa', 'usuario')
    )

    datos = []
    for comanda in comandas:
        delta    = now() - comanda.hora_inicio_comanda
        horas    = delta.seconds // 3600
        minutos  = (delta.seconds % 3600) // 60

        productos = []
        detalles = (
            DetalleComanda.objects
            .filter(comanda=comanda)
            .select_related('producto', 'acompanamiento')
        )

        for det in detalles:
            nombre_partes = []
            if det.producto:
                nombre_partes.append(det.producto.nombre_producto)
            if det.acompanamiento:
                nombre_partes.append(det.acompanamiento.nombre_acompanamiento)

            productos.append(' - '.join(nombre_partes))

        datos.append({
            'id'       : comanda.id_comanda,
            'mesa'     : comanda.mesa.numero_mesa,
            'garzon'   : comanda.usuario.nombre_usuario,
            'duracion' : f"{horas}h {minutos}m",
            'productos': productos,
        })

    return render(request, 'cocina.html', {'comandas': datos})

# ENTREGAR COMANDA (CAMBIAR ID A 2)

def entregar_comanda(request, id):
    comanda = Comanda.objects.get(id_comanda=id)
    comanda.estado_id = 2
    comanda.hora_fin_comanda = timezone.now()
    comanda.save()
    return redirect('cocina')

# ------------ FIN VISTA COCINA ------------



# ------------ VISTA CAJA ------------

def caja(request):
    mesas = Mesa.objects.all()
    comandas_activas = Comanda.objects.exclude(estado_id__in=[4, 5])

    mesas_con_estado = []
    for mesa in mesas:
        comanda = comandas_activas.filter(mesa=mesa).order_by('-id_comanda').first()
        if comanda:
            # MESAS SOLO CON PEDIDOS DE ID DEL 1 AL 3
            if comanda.estado_id == 1:
                estado_class = 'mesa-estado-preparacion'
            elif comanda.estado_id == 2:
                estado_class = 'mesa-estado-entregar'
            elif comanda.estado_id == 3:
                estado_class = 'mesa-estado-entregado'
            else:
                estado_class = 'mesa-estado-libre'

            mesas_con_estado.append({
                'numero': mesa.numero_mesa,
                'estado_class': estado_class,
                'estado_texto': comanda.estado.nombre_estado,
                'pedido': f'Pedido {comanda.id_comanda}'
            })
        else:
            mesas_con_estado.append({
                'numero': mesa.numero_mesa,
                'estado_class': 'mesa-estado-libre',
                'estado_texto': 'Libre',
                'pedido': ''
            })

    return render(request, 'caja.html', {'mesas': mesas_con_estado})

# CAMBIAR ESTADO A 4 QUE ES COMPLETADO
@csrf_exempt
def finalizar_comanda(request, id):
    if request.method == 'POST':
        try:
            comanda = Comanda.objects.get(id_comanda=id)
            comanda.estado_id = 4
            comanda.save()
            return JsonResponse({'ok': True})
        except Comanda.DoesNotExist:
            return JsonResponse({'ok': False, 'error': 'No encontrada'})
    return JsonResponse({'ok': False, 'error': 'Método no permitido'})

# CAMBIAR ESTADO A 5 QUE ES CANCELADA
@csrf_exempt
def cancelar_comanda(request, id):
    if request.method == 'POST':
        try:
            comanda = Comanda.objects.get(id_comanda=id)
            comanda.estado_id = 5
            comanda.hora_fin_comanda = timezone.now()
            comanda.save()
            return JsonResponse({'ok': True})
        except Comanda.DoesNotExist:
            return JsonResponse({'ok': False, 'error': 'Comanda no encontrada'})
    return JsonResponse({'ok': False, 'error': 'Método no permitido'})

# HISTORIAL DE COMANDAS
def historialcaja(request):
    fecha_filtrada = request.GET.get('fecha')
    comandas = Comanda.objects.filter(estado_id=4).order_by('-fecha_comanda', '-hora_inicio_comanda')

    if fecha_filtrada:
        comandas = comandas.filter(fecha_comanda=parse_date(fecha_filtrada))

    context = {
        'comandas': comandas,
        'fecha_filtrada': fecha_filtrada
    }
    return render(request, 'historial_caja.html', context)

# ------------ FIN VISTA CAJA ------------



# ------------ VISTA ADMINISTRADOR ------------

# PRODUCTOS Y ESTADISTICAS DE ESTOS VENDIDOS

@csrf_exempt
def productos(request):
    rango = int(request.GET.get("m", 3))
    fecha_limite = now() - timedelta(days=30 * rango)

    items = []

    prod = (
        DetalleComanda.objects
        .filter(comanda__hora_inicio_comanda__gte=fecha_limite,
                producto__isnull=False)
        .values('producto_id')
        .annotate(vendidos=Sum('cantidad_detalle_comanda'))
    )

    for row in prod:
        p = Producto.objects.select_related('categoria').get(pk=row['producto_id'])
        precio = int(p.precio_producto)
        vendidos = row['vendidos']
        items.append({
            'nombre': p.nombre_producto,
            'categoria': p.categoria.nombre_categoria if p.categoria else '-',
            'precio': precio,
            'imagen': p.imagen_producto.url if p.imagen_producto else '',
            'vendidos': vendidos,
            'total': precio * vendidos,
        })

    acomp = (
        DetalleComanda.objects
        .filter(comanda__hora_inicio_comanda__gte=fecha_limite,
                acompanamiento__isnull=False)
        .values('acompanamiento_id')
        .annotate(vendidos=Sum('cantidad_detalle_comanda'))
    )

    for row in acomp:
        a = Acompanamiento.objects.get(pk=row['acompanamiento_id'])
        precio = int(a.precio_acompanamiento)
        vendidos = row['vendidos']
        items.append({
            'nombre': a.nombre_acompanamiento,
            'categoria': a.categoria.nombre_categoria if a.categoria else '-',
            'precio': precio,
            'imagen': a.imagen_acompanamiento.url if a.imagen_acompanamiento else '',
            'vendidos': vendidos,
            'total': precio * vendidos,
        })

    items = sorted(items, key=lambda x: x['vendidos'], reverse=True)[:5]

    if request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.headers.get('accept') == 'application/json':
        return JsonResponse(items, safe=False)

    return render(request, 'productos.html', {
        'items': items,
        'rango': rango,
    })

# ESTADISTICAS DE COMANDAS COMPLETADAS Y CANCELADAS
@csrf_exempt
def estadisticas(request):
    rango = int(request.GET.get('m', 3))

    hoy = date.today().replace(day=1)
    fecha_inicio = hoy - timedelta(days=30 * (rango - 1))

    qs = (
        Comanda.objects
        .filter(fecha_comanda__gte=fecha_inicio, estado_id__in=[4, 5])
        .annotate(mes=TruncMonth('fecha_comanda'))
        .values('mes', 'estado_id')
        .annotate(total=Count('id_comanda'))
        .order_by('mes')
    )

    meses_labels = []
    datos_4 = []
    datos_5 = []

    mapa = {(r['mes'], r['estado_id']): r['total'] for r in qs}

    for i in range(rango):
        m = (fecha_inicio + timedelta(days=30 * i)).replace(day=1)
        meses_labels.append(m.strftime('%b'))
        datos_4.append(mapa.get((m, 4), 0))
        datos_5.append(mapa.get((m, 5), 0))

    context = {
        'meses': meses_labels,
        'serie4': datos_4,
        'serie5': datos_5,
        'total_4': sum(datos_4),
        'total_5': sum(datos_5),
        'rango': rango,
    }

    return render(request, 'estadisticas.html', context)

# ------------ FIN VISTA ADMINISTRADOR ------------
