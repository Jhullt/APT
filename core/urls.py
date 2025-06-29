from django.urls import path
from . import views

urlpatterns = [
    # Login y cierre de sesión
    path('', views.login, name='login'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),

    # Vista garzón
    path('garzon/', views.garzon, name='garzon'),

    # Vista cocina
    path('cocina/', views.cocina, name='cocina'),
    path('comanda/entregar-cocina/<int:id>/', views.entregar_comanda, name='entregar_comanda'),
    path('comanda/entregar-garzon/<int:id>/', views.entregar_comanda_garzon, name='entregar_comanda_garzon'),

    # Vista caja
    path('caja/', views.caja, name='caja'),
    path('comanda/finalizar/<int:id>/', views.finalizar_comanda, name='finalizar_comanda'),
    path('comanda/eliminar/<int:id>/', views.eliminar_comanda, name='eliminar_comanda'),

    # Historial
    path('historial/', views.historial, name='historial'),
    path('historial_caja/', views.historialcaja, name='historial_caja'),

    # API - Productos y acompañamientos
    path('api/productos/<int:categoria_id>/', views.obtener_productos_por_categoria, name='obtener_productos_por_categoria'),
    path('api/acompanamientos/', views.obtener_acompanamientos, name='obtener_acompanamientos'),

    # API - Comandas
    path('api/comanda/crear/', views.crear_comanda, name='crear_comanda'),
    path('api/comanda/mesa/<int:numero>/', views.obtener_comanda_por_mesa, name='obtener_comanda_por_mesa'),
]
