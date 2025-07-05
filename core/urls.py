from django.urls import path
from . import views

urlpatterns = [
    
    # ------------ LOGIN Y CIERRE DE SESIÓN ------------
    path('', views.login, name='login'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),

    # ------------ VISTA DE GARZON ------------
    path('garzon/', views.garzon, name='garzon'),
    path('api/comanda/mesa/<int:numero>/', views.obtener_comanda_por_mesa, name='obtener_comanda_por_mesa'),
    path('api/comanda/crear/', views.crear_comanda, name='crear_comanda'),
    path('comanda/entregar-garzon/<int:id>/', views.entregar_comanda_garzon, name='entregar_comanda_garzon'),
    path('historial/', views.historial, name='historial'),

    # ------------ API DE PRODUCTOS Y ACOMPAÑAMIENTOS ------------
    path('api/productos/<int:categoria_id>/', views.obtener_productos_por_categoria, name='obtener_productos_por_categoria'),
    path('api/acompanamientos/', views.obtener_acompanamientos, name='obtener_acompanamientos'),

    # ------------ VISTA COCINA ------------
    path('cocina/', views.cocina, name='cocina'),
    path('comanda/entregar-cocina/<int:id>/', views.entregar_comanda, name='entregar_comanda'),

    # ------------ VISTA CAJA ------------
    path('caja/', views.caja, name='caja'),
    path('comanda/finalizar/<int:id>/', views.finalizar_comanda, name='finalizar_comanda'),
    path('comanda/cancelar/<int:id>/', views.cancelar_comanda, name='cancelar_comanda'),
    path('historial_caja/', views.historialcaja, name='historial_caja'),

    # ------------ VISTA ADMINISTRADOR ------------
    path('productos/', views.productos, name='productos'),
    path('estadisticas/', views.estadisticas, name='estadisticas'),

]
