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

# LOGIN
def login(request):
    return render(request, 'login.html')

# VISTA GARZON MESAS
def garzon(request):
    categorias = Categoria.objects.filter(id_categoria__in=[1, 2, 3, 4, 5])
    return render(request, 'garzon.html', {'categorias': categorias})

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
            print("🕒 Hora recibida:", hora_inicio_str, type(hora_inicio_str))

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
            print('❌ ERROR EN CREACIÓN DE COMANDA:', e)
            return JsonResponse({'success': False, 'error': str(e)}, status=400)

    
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
    comanda.estado_id = 2  # Cambia el estado a 'Esperando entrega'
    comanda.hora_fin_comanda = timezone.now()
    comanda.save()
    return redirect('cocina')