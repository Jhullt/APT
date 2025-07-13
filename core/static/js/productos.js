// ------------ ESTADÍSTICAS DE PRODUCTOS MÁS VENDIDOS ------------

document.addEventListener('DOMContentLoaded', () => {

  // BOTÓN QUE MUESTRA EL RANGO ACTUAL
  const btnDrop = document.querySelector('#btn-rango');

  // TODAS LAS OPCIONES DEL DROPDOWN (3, 6, 12 meses, etc.)
  const linksDropdown = document.querySelectorAll('.dropdown-menu a');

  // REFERENCIA A LA <tbody> DE LA TABLA
  const rowsBody = document.querySelector('#tbody-productos');

  // AL HACER CLIC EN UNA OPCIÓN DEL MENÚ
  linksDropdown.forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();

      const rango = +a.dataset.rango;
      if (!isNaN(rango)) {

        // MOSTRAR MENSAJE TEMPORAL DE "CARGANDO…"
        if (rowsBody) {
          rowsBody.innerHTML = `
            <tr><td colspan="5" class="text-center py-3">CARGANDO…</td></tr>`;
        }

        // REDIRECCIÓN A LA MISMA PÁGINA CON PARÁMETRO ?m=
        setTimeout(() => {
          window.location.href = `?m=${rango}`;
        }, 300); // Pequeño delay para que el usuario vea el mensaje
      }
    });
  });

});

// ------------ FIN ESTADÍSTICAS DE PRODUCTOS MÁS VENDIDOS ------------
