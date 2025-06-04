from django.urls import path
from . import views

urlpatterns = [
    path('', views.login, name='login'),
    path('garzon/', views.garzon, name='garzon'),
    path('historial/', views.historial, name='historial'),
]
