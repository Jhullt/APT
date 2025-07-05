// ------------ ESTADÍSTICAS DE PRODUCTOS MÁS VENDIDOS ------------

document.addEventListener('DOMContentLoaded', () => {

  // URL A LA QUE SE PIDE LA INFO (SE LE AGREGA EL N° DE MESES)
  const ENDPOINT = '/productos/?m=';

  // MESES QUE SE MUESTRAN LA PRIMERA VEZ
  const RANGO_DEFAULT = 3;

  // REFERENCIA A LA <tbody> DONDE IRÁN LAS FILAS
  const ROWS_BODY = document.querySelector('#tbody-productos');

  // BOTÓN QUE MUESTRA EL RANGO ACTUAL
  const BTN_DROP = document.querySelector('#btn-rango');

  // TODAS LAS OPCIONES DEL DROPDOWN (3 MESES, 6 MESES, 12 MESES, ETC.)
  const LINKS_DROPDOWN = document.querySelectorAll('.dropdown-menu a');

  // FORMATEA NÚMEROS COMO PESOS CHILENOS
  const FMT_CLP = v => '$' + Number(v || 0).toLocaleString('es-CL');

  // DIBUJA LA TABLA CON LOS DATOS RECIBIDOS
  function pintar (data = []) {

    // LIMPIAR TABLA
    ROWS_BODY.innerHTML = '';

    // SI NO HAY DATOS → MOSTRAR MENSAJE
    if (!data.length) {
      ROWS_BODY.innerHTML = `
        <tr><td colspan="5" class="text-center py-3">SIN DATOS</td></tr>`;
      return;
    }

    // AGREGAR UNA FILA POR CADA PRODUCTO
    data.forEach(d => {
      ROWS_BODY.insertAdjacentHTML('beforeend', `
        <tr>
          <td>
            <div class="d-flex align-items-center">
              <img src="${d.imagen || '/static/icons/prueba.jpg'}"
                   alt="${d.nombre}"
                   class="me-2 rounded"
                   style="width:45px;height:45px;object-fit:cover;">
              <span class="fw-semibold">${d.nombre}</span>
            </div>
          </td>
          <td>${d.categoria}</td>
          <td>${d.precio ? FMT_CLP(d.precio) : '-'}</td>
          <td>${(d.vendidos ?? 0).toLocaleString('es-CL')}</td>
          <td>${d.total ? FMT_CLP(d.total) : '-'}</td>
        </tr>`);
    });
  }

  // PIDE LOS DATOS AL SERVIDOR Y LUEGO LLAMA A pintar()
  async function cargar (rango) {

    // MENSAJE DE “CARGANDO” MIENTRAS LLEGAN LOS DATOS
    ROWS_BODY.innerHTML = `
      <tr><td colspan="5" class="text-center py-3">CARGANDO…</td></tr>`;

    try {
      const res = await fetch(ENDPOINT + rango, {
        headers: {
          'ACCEPT'          : 'application/json',
          'X-REQUESTED-WITH': 'XMLHttpRequest'
        }
      });

      // SI LA RESPUESTA NO ES OK → LANZAR ERROR
      if (!res.ok) throw new Error(res.statusText);

      // PARSEAR JSON
      const datos = await res.json();

      // DIBUJAR TABLA
      pintar(datos);

      // ACTUALIZAR TEXTO DEL BOTÓN PRINCIPAL
      BTN_DROP.innerText = `ÚLTIMOS ${rango} MESES`;

      // MARCAR OPCIÓN ACTIVA EN EL DROPDOWN
      LINKS_DROPDOWN.forEach(a =>
        a.classList.toggle('active', +a.dataset.rango === rango));

    } catch (err) {

      // MOSTRAR ERROR EN CONSOLA Y EN PANTALLA
      console.error('ERROR AL CARGAR PRODUCTOS:', err);
      ROWS_BODY.innerHTML = `
        <tr><td colspan="5" class="text-center py-3 text-danger">
          ERROR AL CARGAR DATOS
        </td></tr>`;
    }
  }

  // CUANDO EL USUARIO CAMBIA EL RANGO DESDE EL DROPDOWN
  LINKS_DROPDOWN.forEach(a =>
    a.addEventListener('click', e => {
      // EVITA QUE EL ENLACE RECARGUE LA PÁGINA
      e.preventDefault();
      cargar(+a.dataset.rango);
    })
  );

  // PRIMERA CARGA DE DATOS AUTOMÁTICA
  cargar(RANGO_DEFAULT);
});

// ------------ FIN ESTADÍSTICAS DE PRODUCTOS MÁS VENDIDOS ------------
