// ------------ ESTADÍSTICAS DE PRODUCTOS MÁS VENDIDOS ------------

document.addEventListener('DOMContentLoaded', () => {

  // BOTÓN QUE MUESTRA EL RANGO ACTUAL
  const btnDrop = document.querySelector('#btn-rango');

  // TODAS LAS OPCIONES DEL MENÚ DESPLEGABLE (3, 6, 12 MESES, ETC.)
  const linksDropdown = document.querySelectorAll('.dropdown-menu a');

  // CUERPO DE LA TABLA DONDE SE MOSTRARÁN LOS PRODUCTOS
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

        // RECARGA LA PÁGINA CON EL RANGO SELECCIONADO
        setTimeout(() => {
          window.location.href = `?m=${rango}`;
        // PEQUEÑO DELAY PARA QUE EL USUARIO VEA EL MENSAJE
        }, 300);
      }
    });
  });

});

// ------------ FIN ESTADÍSTICAS DE PRODUCTOS MÁS VENDIDOS ------------
