from django.contrib import admin
from .models import (
    Categoria,
    Acompanamiento,
    Producto,
    Estado,
    Mesa,
    Rol,
    Usuario,
    Comanda
)

admin.site.register(Categoria)
admin.site.register(Acompanamiento)
admin.site.register(Producto)
admin.site.register(Estado)
admin.site.register(Mesa)
admin.site.register(Rol)
admin.site.register(Usuario)
admin.site.register(Comanda)
