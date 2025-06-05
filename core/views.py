from django.shortcuts import render
from .models import Producto, Categoria
from django.http import JsonResponse
from django.core import serializers
from django.views.decorators.csrf import csrf_exempt
import json
from datetime import datetime
from .models import Comanda, Usuario, Mesa, Estado, Producto
from .models import Comanda
from django.shortcuts import redirect
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from django.db.models import Q

# LOGIN
def login(request):
    return render(request, 'login.html')

# VISTA GARZON MESAS
def garzon(request):
    categorias = Categoria.objects.filter(id_categoria__in=[1, 2, 3, 4, 5])
    mesas = Mesa.objects.all()
    comandas_activas = Comanda.objects.exclude(estado_id=4)  # Oculta las mesas pagadas

    mesas_con_estado = []
    for mesa in mesas:
        comanda = comandas_activas.filter(mesa=mesa).order_by('-id_comanda').first()
        if comanda:
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

    return render(request, 'garzon.html', {
        'categorias': categorias,
        'mesas': mesas_con_estado
    })


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

from .models import Acompanamiento

# ACOMPAÑAMIENTOS SI EL BOOLEAN ES TRUE

def obtener_acompanamientos(request):
    acompanamientos = Acompanamiento.objects.all()
    data = [
        {'id': a.id_acompanamiento, 'nombre': a.nombre_acompanamiento}
        for a in acompanamientos
    ]
    return JsonResponse({'acompanamientos': data})

@csrf_exempt
def crear_comanda(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            # Obtener datos del JSON
            nombre_usuario = data.get('usuario')
            mesa_id = data.get('mesa_id')
            estado_id = data.get('estado_id')
            detalle = data.get('detalle')
            precio_total_comanda = data.get('precio_total_comanda')
            fecha_str = data.get('fecha_comanda')
            hora_inicio_str = data.get('hora_inicio_comanda')
            # Mostrar qué hora está llegando
            print("Hora recibida:", hora_inicio_str, type(hora_inicio_str))
            # Buscar objetos relacionados
            usuario = Usuario.objects.get(nombre_usuario=nombre_usuario)
            mesa = Mesa.objects.get(id_mesa=mesa_id)
            estado = Estado.objects.get(id_estado=estado_id)
            # Convertir fecha y hora
            fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
            hora_inicio = datetime.strptime(f"{fecha_str} {hora_inicio_str}", '%Y-%m-%d %H:%M:%S')
            # Crear la comanda
            comanda = Comanda.objects.create(
                usuario=usuario,
                mesa=mesa,
                estado=estado,
                detalle=detalle,
                precio_total_comanda=precio_total_comanda,
                fecha_comanda=fecha,
                hora_inicio_comanda=hora_inicio
            )
            
            return JsonResponse({'success': True, 'comanda_id': comanda.id_comanda})
        
        except Exception as e:
            print('ERROR EN CREACIÓN DE COMANDA:', e)
            return JsonResponse({'success': False, 'error': str(e)}, status=400)

    return JsonResponse({'error': 'Método no permitido'}, status=405)

def entregar_comanda_garzon(request, id):
    if request.method == 'POST':
        try:
            comanda = Comanda.objects.get(id_comanda=id)
            comanda.estado_id = 3
            comanda.hora_fin_comanda = timezone.now()
            comanda.save()
            return JsonResponse({'mensaje': 'Comanda entregada correctamente'})
        except Comanda.DoesNotExist:
            return JsonResponse({'error': 'Comanda no encontrada'}, status=404)
    return JsonResponse({'error': 'Método no permitido'}, status=405)




# GARZON_HISTORIAL
def historial(request):
    return render(request, 'historial.html')

# COCINA
from django.utils.timezone import now

def cocina(request):
    comandas = Comanda.objects.filter(estado_id=1).select_related('mesa', 'usuario')
    
    datos = []
    for comanda in comandas:
        duracion = now() - comanda.hora_inicio_comanda
        horas = duracion.seconds // 3600
        minutos = (duracion.seconds % 3600) // 60
        productos = comanda.detalle.split('\n') if comanda.detalle else []

        datos.append({
            'id': comanda.id_comanda,
            'mesa': comanda.mesa.id_mesa,
            'garzon': comanda.usuario.nombre_usuario,
            'duracion': f"{horas}h {minutos}m",
            'productos': productos,
        })

    return render(request, 'cocina.html', {'comandas': datos})


def entregar_comanda(request, id):
    comanda = Comanda.objects.get(id_comanda=id)
    comanda.estado_id = 2
    comanda.hora_fin_comanda = timezone.now()
    comanda.save()
    return redirect('cocina')

def obtener_comanda_por_mesa(request, numero):
    try:
        mesa = Mesa.objects.get(numero_mesa=numero)
        comanda = Comanda.objects.filter(mesa=mesa).exclude(estado_id=4).order_by('-id_comanda').first()
        if comanda:
            return JsonResponse({
                'comanda_id': comanda.id_comanda,
                'estado_id': comanda.estado_id,
                'detalle': comanda.detalle,
                'total': comanda.precio_total_comanda  # ✅ Aquí está el dato que faltaba
            })
        return JsonResponse({'comanda_id': None})
    except Mesa.DoesNotExist:
        return JsonResponse({'error': 'Mesa no encontrada'}, status=404)

def caja(request):
    mesas = Mesa.objects.all()
    comandas_activas = Comanda.objects.exclude(estado_id=4)

    mesas_con_estado = []
    for mesa in mesas:
        comanda = comandas_activas.filter(mesa=mesa).order_by('-id_comanda').first()
        if comanda:
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