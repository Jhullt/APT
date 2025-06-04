from django.urls import path
from . import views

urlpatterns = [
    path('', views.login, name='login'),
    path('garzon/', views.garzon, name='garzon'),
    path('historial/', views.historial, name='historial'),
    path('cocina/', views.cocina, name='cocina'),
    path('api/productos/<int:categoria_id>/', views.obtener_productos_por_categoria, name='obtener_productos_por_categoria'),
    path('api/acompanamientos/', views.obtener_acompanamientos, name='obtener_acompanamientos'),    
    path('api/comanda/crear/', views.crear_comanda, name='crear_comanda'),
    path('comanda/entregar/<int:id>/', views.entregar_comanda, name='entregar_comanda'),
]
