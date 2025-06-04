from django.shortcuts import render

# LOGIN
def login(request):
    return render(request, 'login.html')

# GARZON
def garzon(request):
    return render(request, 'garzon.html')

# GARZON_HISTORIAL
def historial(request):
    return render(request, 'historial.html')
