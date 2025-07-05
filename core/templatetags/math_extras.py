# core/templatetags/math_extras.py
from django import template
register = template.Library()

@register.filter
def suma(iterable):
    """Devuelve la suma de un iterable numérico; 0 si falla."""
    try:
        return sum(iterable)
    except Exception:
        return 0
