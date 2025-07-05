from django.db import models
from cloudinary.models import CloudinaryField

# CATEGORIA
class Categoria(models.Model):
    id_categoria = models.AutoField(primary_key=True)
    nombre_categoria = models.CharField(max_length=15)

    def __str__(self):
        return self.nombre_categoria

# ACOMPAÑAMIENTO
class Acompanamiento(models.Model):
    id_acompanamiento = models.AutoField(primary_key=True)
    nombre_acompanamiento = models.CharField(max_length=30)
    imagen_acompanamiento = CloudinaryField('image', blank=True, null=True)
    precio_acompanamiento = models.DecimalField(max_digits=5, decimal_places=0)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE)

    def __str__(self):
        return self.nombre_acompanamiento

# PRODUCTO
class Producto(models.Model):
    id_producto = models.AutoField(primary_key=True)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE)
    acompanamiento = models.ForeignKey(Acompanamiento, on_delete=models.SET_NULL, null=True, blank=True)
    nombre_producto = models.CharField(max_length=50)
    imagen_producto = CloudinaryField('image', blank=True, null=True)
    precio_producto = models.DecimalField(max_digits=7, decimal_places=0)
    acompanamiento_producto = models.BooleanField(default=False)

    def __str__(self):
        return self.nombre_producto

# ESTADO
class Estado(models.Model):
    id_estado = models.AutoField(primary_key=True)
    nombre_estado = models.CharField(max_length=20)

    def __str__(self):
        return self.nombre_estado

# MESA
class Mesa(models.Model):
    id_mesa = models.AutoField(primary_key=True)
    numero_mesa = models.PositiveSmallIntegerField()

    def __str__(self):
        return f"Mesa {self.numero_mesa:02d}"

# ROL
class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=15)

    def __str__(self):
        return self.nombre_rol

# USUARIO
class Usuario(models.Model):
    id_usuario = models.AutoField(primary_key=True)
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE)
    password_usuario = models.CharField(max_length=100)
    nombre_usuario = models.CharField(max_length=20)
    correo_usuario = models.EmailField(max_length=100)

    def __str__(self):
        return self.nombre_usuario

# COMANDA
class Comanda(models.Model):
    id_comanda = models.AutoField(primary_key=True)
    mesa = models.ForeignKey(Mesa, on_delete=models.CASCADE)
    estado = models.ForeignKey(Estado, on_delete=models.CASCADE)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    fecha_comanda = models.DateField()
    hora_inicio_comanda = models.DateTimeField()
    hora_fin_comanda = models.DateTimeField(null=True, blank=True)
    precio_total_comanda = models.DecimalField(max_digits=7, decimal_places=0)

    def __str__(self):
        return f"Comanda {self.id_comanda}"

# DETALLE COMANDA
class DetalleComanda(models.Model):
    id_detalle_comanda = models.AutoField(primary_key=True)
    comanda = models.ForeignKey(Comanda, on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.SET_NULL, null=True, blank=True)
    acompanamiento = models.ForeignKey(Acompanamiento, on_delete=models.SET_NULL, null=True, blank=True)
    cantidad_detalle_comanda = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"Detalle {self.id_detalle_comanda} - Comanda {self.comanda.id_comanda}"

