from django.urls import path
from . import views

urlpatterns = [
    path('', views.login, name='login'),
    path('garzon/', views.garzon, name='garzon'),
    path('historial/', views.historial, name='historial'),
    path('historial_caja/', views.historialcaja, name='historial_caja'),
    path('cocina/', views.cocina, name='cocina'),

    #API PARA PRODUCTOS Y ACOMPAÑAMIENTOS
    path('api/productos/<int:categoria_id>/', views.obtener_productos_por_categoria, name='obtener_productos_por_categoria'),
    path('api/acompanamientos/', views.obtener_acompanamientos, name='obtener_acompanamientos'),

    #API PARA CREAR COMANDA Y OBTENER COMANDA ACTIVA POR MESA
    path('api/comanda/crear/', views.crear_comanda, name='crear_comanda'),
    path('api/comanda/mesa/<int:numero>/', views.obtener_comanda_por_mesa, name='obtener_comanda_por_mesa'),

    # ENTREGAR COMANDAS
    path('comanda/entregar-cocina/<int:id>/', views.entregar_comanda, name='entregar_comanda'),
    path('comanda/entregar-garzon/<int:id>/', views.entregar_comanda_garzon, name='entregar_comanda_garzon'),

    # FINALIZAR COMANDAS
    path('caja/', views.caja, name='caja'),
    path('comanda/finalizar/<int:id>/', views.finalizar_comanda, name='finalizar_comanda'),
]
