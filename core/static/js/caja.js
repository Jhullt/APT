// ------------ SELLO DE SEGURIDAD ------------

// OBTENER EL CÓDIGO DE SEGURIDAD CONTRA FALSIFICACIÓN DE PETICIÓN ENTRE SITIOS
function getCSRFToken () {
  const name = 'csrftoken';
  const cookies = document.cookie ? document.cookie.split(';') : [];
  for (let c of cookies) {
    c = c.trim();
    if (c.startsWith(name + '=')) {
      return decodeURIComponent(c.slice(name.length + 1));
    }
  }
  return '';
}

// ------------ FIN SELLO DE SEGURIDAD ------------



// ------------ OVERLAY DE ALERTAS ------------

// CAPAS VISUALES PARA ALERTAS EN LA VISTA CAJA
const CAPAS = {

  // ERROR EN EL PROCESO 
  err: {
    id : 'overlay-comanda-6',
    gif: '/static/gif/error.gif',
    txt: 'Ha ocurrido un problema'
  },
  // ERROR DE CONEXIÓN A INTERNET
  net: {
    id : 'overlay-comanda-7',
    gif: '/static/gif/internet.gif',
    txt: 'Verifica tu conexión a internet ☹️'
  }
};

// OCULTA TODAS LAS CAPAS VISUALES
function overlayOcultarTodo () {
  Object.values(CAPAS).forEach(c =>
    document.getElementById(c.id)?.classList.add('oculto')
  );
}

// MUESTRA LA CAPA SEGÚN LA ESCENA
function overlayMostrar (escena, mensajeExtra = null) {
  const cfg = CAPAS[escena];
  if (!cfg) return;

  // OCULTA TODO LO DEMÁS
  overlayOcultarTodo();

  const capa = document.getElementById(cfg.id);
  if (!capa) return;

  // CAMBIAR TEXTO
  const h2 = capa.querySelector('h2');
  if (h2) h2.textContent = mensajeExtra ?? cfg.txt;

  // CAMBIAR GIF
  const img = capa.querySelector('img');
  if (img) img.src = cfg.gif;

  // MUESTRA EL OVERLAY
  capa.classList.remove('oculto');

  // CERRAR
  capa.querySelector('[id^="cerrar-overlay"]')
      ?.addEventListener('click', overlayOcultarTodo, { once: true });
}

// ------------ FIN OVERLAY DE ALERTAS ------------



// ------------ TERMINAR PROCESO COMANDA ------------

document.addEventListener('DOMContentLoaded', () => {

  // VARIABLE GLOBAL PARA GUARDAR LA COMANDA SELECCIONADA
  let comandaSeleccionada = null;

  // AL HACER CLICK EN UNA MESA, SE CONSULTA EL ESTADO DE LA COMANDA
  document.querySelectorAll('.mesa').forEach(mesa => {
    mesa.addEventListener('click', () => {
      const numeroMesa = mesa.dataset.numero;

      fetch(`/api/comanda/mesa/${numeroMesa}/`)
        .then(r => r.json())
        .then(d => {

          // SOLO ABRIR MODAL SI LA COMANDA EXISTE Y NO ESTÁ FINALIZADA O CANCELADA
          if (d.comanda_id && ![4, 5].includes(d.estado_id)) {
            comandaSeleccionada = d.comanda_id;
            new bootstrap.Modal(
              document.getElementById('modalConfirmarCaja')
            ).show();
          }
        });
    });
  });

  // BOTÓN "CONFIRMAR LIBERACIÓN": FINALIZA LA COMANDA (CAMBIA A ESTADO 4)
  document.getElementById('confirmarLiberacion').addEventListener('click', () => {
    if (!comandaSeleccionada) return;

    fetch(`/comanda/finalizar/${comandaSeleccionada}/`, {
      method : 'POST',
      headers: { 'X-CSRFToken': getCSRFToken() }
    })
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          location.reload();
        } else {
          overlayMostrar('error');
        }
      })
      .catch(() => overlayMostrar('sinRed'));
  });

  // BOTÓN "CANCELAR COMANDA": CAMBIA ESTADO A 5 (COMANDA CANCELADA)
  document.getElementById('cancelarComanda').addEventListener('click', () => {
    if (!comandaSeleccionada) return;

    fetch(`/comanda/cancelar/${comandaSeleccionada}/`, {
      method : 'POST',
      headers: { 'X-CSRFToken': getCSRFToken() }
    })
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          location.reload();
        } else {
          overlayMostrar('error');
        }
      })
      .catch(() => overlayMostrar('sinRed'));
  });

});

// ------------ FIN TERMINAR PROCESO COMANDA ------------