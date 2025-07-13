// ------------ SELLO DE SEGURIDAD ------------

// OBTENER EL CÓDIGO DE SEGURIDAD CONTRA FALSIFICACIÓN DE PETICIÓN ENTRE SITIOS
function getCSRFToken() {
  let cookieValue = null;
  const name = 'csrftoken';
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// ------------ FIN SELLO DE SEGURIDAD ------------



// ------------ OVERLAY DE ALERTAS ------------



const CAPAS = {
  // PROCESO VISUAL DE ENVIANDO COMANDA
  enviando: { id:'overlay-comanda',
              gif:'/static/gif/cocinar.gif',
              texto:'Enviando comanda a la cocina <span class="dot dot1">.</span><span class="dot dot2">.</span><span class="dot dot3">.</span>' },

  // COMANDA ENVIADA VISUAL
  enviado:  { id:'overlay-comanda',
              gif:'/static/gif/confirmado.gif',
              texto:'¡Comanda enviada correctamente!' },

  // CARRITO VACÍO
  vacio:    { id:'overlay-comanda-1' },

  // COMANDA ENTREGADA
  entregado:{ id:'overlay-comanda-2' },

  // ERROR AL ENTREGAR COMANDA
  errorEntregar:{ id:'overlay-comanda-3' },

  // ERROR DE CONEXIÓN
  sinRed:   { id:'overlay-comanda-4' },

  // OTROS ERRORES DE PROGRAMACIÓN
  error:    { id:'overlay-comanda-5' }
};

// OCULTA TODOS LOS OVERLAYS
function overlayOcultarTodo () {
  Object.values(CAPAS).forEach(c =>
    document.getElementById(c.id)?.classList.add('oculto')
  );
}

// MUESTRA EL OVERLAY SEGÚN LA ALERTA
function overlayMostrar (escena, mensajeExtra = null) {

  const cfg = CAPAS[escena];
  if (!cfg) return;

  overlayOcultarTodo();

  const capa = document.getElementById(cfg.id);
  if (!capa) return;

  // CAMBIAR TEXTO
  if (cfg.texto || mensajeExtra) {
    const h2 = capa.querySelector('h2');
    if (h2) h2.innerHTML = mensajeExtra ?? cfg.texto;
  }

  // CAMBIAR GIF
  if (cfg.gif) {
    const img = capa.querySelector('img');
    if (img) img.src = cfg.gif;
  }

  capa.classList.remove('oculto');

  // CERRAR
  capa.querySelector('#btn-ok, [id^="cerrar-overlay"]')
      ?.addEventListener('click', overlayOcultarTodo, { once:true });
}

// ------------ FIN OVERLAY DE ALERTAS ------------



// ------------ REDIMENSIONADOR DE PANEL ------------



// ELEMENTOS DE PANEL
const divisorCentro = document.querySelector('.registrar-comanda-centro');
const panelIzquierdo = document.querySelector('.registrar-comanda-izquierda');
const panelDerecho   = document.querySelector('.registrar-comanda-derecha');

let redimensionando = false;

// OBTENER POSICIÓN X SEGÚN DISPOSITIVO
const obtenerX = e => (e.touches ? e.touches[0].clientX : e.clientX);

// INICIAR REDIMENSIONADO
const iniciarRedimension = e => {
  redimensionando = true;
  document.body.style.cursor = 'col-resize';
  if (e.cancelable) e.preventDefault();
};

// REALIZAR REDIMENSIONADO MIENTRAS MUEVE
const moverPanel = e => {
  if (!redimensionando) return;
  const x       = obtenerX(e);
  const total   = divisorCentro.parentNode.offsetWidth;
  const nuevoAnchoIzquierdo = Math.min(Math.max(x, 200), total - 300);

  panelIzquierdo.style.width  = `${nuevoAnchoIzquierdo}px`;
  panelDerecho.style.width    = `${total - nuevoAnchoIzquierdo - divisorCentro.offsetWidth}px`;
};

// DETENER REDIMENSIONADO
const detenerRedimension = () => {
  redimensionando = false;
  document.body.style.cursor = 'default';
};

// ESCUCHAR EVENTOS DE MOUSE Y TÁCTIL
if (divisorCentro) {
  divisorCentro.addEventListener('mousedown',  iniciarRedimension);
  divisorCentro.addEventListener('touchstart', iniciarRedimension, { passive: false });
}
document.addEventListener('mousemove',  moverPanel);
document.addEventListener('touchmove',  moverPanel, { passive: false });
document.addEventListener('mouseup',    detenerRedimension);
document.addEventListener('touchend',   detenerRedimension);

// ------------ FIN REDIMENSIONADOR DE PANEL ------------



// ------------ CARGA DINÁMICA DE PRODUCTOS Y ACOMPAÑAMIENTOS ------------

document.addEventListener('DOMContentLoaded', function () {

  // OBTENER BOTONES DE CATEGORÍA Y CONTENEDOR DE PRODUCTOS
  const botones    = document.querySelectorAll('.btn-categoria');
  const contenedor = document.querySelector('.contenedor-productos');

  // CREAR TARJETA HTML PARA UN PRODUCTO O ACOMPAÑAMIENTO
  function tarjeta(nombre, precio, imagen, click) {
    const imgSrc = imagen || '/static/icons/prueba.jpg';
    const div    = document.createElement('div');
    div.className = 'producto';
    div.innerHTML = `
      <img src="${imgSrc}" alt="${nombre}">
      <p>${nombre}</p>
      <strong>${fmt(precio)}</strong>`;
    div.addEventListener('click', click);
    contenedor.appendChild(div);
  }

  // MODAL DE ACOMPAÑAMIENTO (SE ABRE SI EL PRODUCTO LO REQUIERE)
  function abrirModal(producto) {

    // BLOQUEAR SI YA HAY COMANDA ACTIVA
    if (!pedidoEditable) return;

    document.getElementById('modalProductoNombre').textContent =
      `Selecciona acompañamiento`;

    fetch('/api/acompanamientos/')
      .then(res => res.json())
      .then(data => {
        const form = document.getElementById('formAcompanamientos');
        form.innerHTML = '';

        // MOSTRAR RADIO BUTTONS PARA ACOMPAÑAMIENTOS
        data.acompanamientos.forEach(a => {
          form.insertAdjacentHTML(
            'beforeend',
            `<div class="form-check">
               <input class="form-check-input" type="radio" name="acompanamiento"
                      id="a${a.id}" data-nombre="${a.nombre}" value="${a.id}">
               <label class="form-check-label" for="a${a.id}">${a.nombre}</label>
             </div>`
          );
        });

        // BOTÓN CONFIRMAR
        const btnOK = document.getElementById('confirmarAcompanamiento');
        btnOK.disabled = true;

        form.onchange = e => {
          if (e.target.name === 'acompanamiento') btnOK.disabled = false;
        };

        btnOK.onclick = () => {
          const sel = form.querySelector('input[name="acompanamiento"]:checked');
          if (!sel) return;

          agregarProductoAlCarrito({
            id          : producto.id,
            nombre      : producto.nombre,
            precio      : producto.precio,
            acompId     : +sel.value,
            acompNombre : sel.dataset.nombre
          });

          bootstrap.Modal.getInstance(
            document.getElementById('modalAcompanamiento')
          ).hide();
        };

        new bootstrap.Modal(document.getElementById('modalAcompanamiento')).show();
      })
      .catch(() => overlayMostrar('error'));
  }

  // FUNCIÓN PRINCIPAL PARA CARGAR PRODUCTOS O ACOMPAÑAMIENTOS
  function cargar(id) {

    // SI ES CATEGORÍA DE ACOMPAÑAMIENTOS (ID = 5)
    if (+id === 5) {
      fetch('/api/acompanamientos/')
        .then(r => r.json())
        .then(d => {
          contenedor.innerHTML = '';

          (d.acompanamientos || []).forEach(a => {
            tarjeta(
              a.nombre,
              a.precio,
              a.imagen,
              () => agregarProductoAlCarrito({
                id          : null,
                acompId     : a.id,
                nombre      : a.nombre,
                precio      : a.precio,
                acompNombre : null
              })
            );
          });
        })
        .catch(e => console.error('ERROR ACOMPAÑAMIENTOS', e));

      return;
    }

    // SI ES CATEGORÍA DE PRODUCTOS NORMALES
    fetch(`/api/productos/${id}/`)
      .then(r => r.json())
      .then(d => {
        contenedor.innerHTML = '';

        (d.productos || []).forEach(p => {
          tarjeta(
            p.nombre,
            p.precio,
            p.imagen,
            () => p.acompanamiento_producto ? abrirModal(p)
                                            : agregarProductoAlCarrito(p)
          );
        });
      })
      .catch(e => console.error('ERROR PRODUCTOS', e));  
  }

  // CARGAR CATEGORÍA POR DEFECTO AL INICIAR
  cargar(1);

  // ASIGNAR EVENTO CLICK A LOS BOTONES DE CATEGORÍA
  botones.forEach(boton =>
    boton.addEventListener('click', () => cargar(boton.dataset.id))
  );
});

// ------------ FIN CARGA DINÁMICA DE PRODUCTOS Y ACOMPAÑAMIENTOS ------------



// ------------ FUNCIONALIDAD DEL CARRITO ------------

// -- FORMATO DE MONEDA CHILENA --
const fmt = v => '$' + Number(v || 0).toLocaleString('es-CL');



// -- VARIABLES DE ESTADO INTERNO --

// ÍTEMS EN EL CARRITO
let carritoData     = [];
// TOTAL EN PESOS CHILENOS
let totalCLP        = 0;
// PERMITE O NO MODIFICAR
let pedidoEditable  = true;



// -- REFERENCIAS A LA INTERFAZ DEL CARRITO --
const contCarrito = document.querySelector('.registrar-comanda-derecha-medio-pedido-contenedor');
const lblTotal    = document.getElementById('total-precio-comanda');




// ---- CONFIRMACIÓN DE ACOMPAÑAMIENTO DESDE EL MODAL ----

// BOTÓN DE CONFIRMACIÓN (DESACTIVADO POR DEFECTO)
const btnConfirm = document.getElementById('confirmarAcompanamiento');
btnConfirm.disabled = true;

// ACTIVAR BOTÓN SOLO CUANDO SE SELECCIONE UN ACOMPAÑAMIENTO
document.getElementById('formAcompanamientos').addEventListener('change', e => {
  if (e.target.name === 'acompanamiento') {
    btnConfirm.disabled = false;
  }
});

// CUANDO EL USUARIO CONFIRMA EL ACOMPAÑAMIENTO
btnConfirm.addEventListener('click', () => {
  // SI LA COMANDA YA ESTÁ ENVIADA, NO HACER NADA
  if (!pedidoEditable) return;

  // OBTENER EL RADIO SELECCIONADO
  const seleccionado = document.querySelector('input[name="acompanamiento"]:checked');
  // SI NO HAY SELECCIÓN, SALIR
  if (!seleccionado) return;

  // AGREGAR EL PRODUCTO CON EL ACOMPAÑAMIENTO AL CARRITO
  agregarProductoAlCarrito({
    // ID DEL PRODUCTO
    id          : productoSeleccionado.id,
    // NOMBRE DEL PRODUCTO
    nombre      : productoSeleccionado.nombre,
    // PRECIO DEL PRODUCTO
    precio      : productoSeleccionado.precio,
    // ID DEL ACOMPAÑAMIENTO ELEGIDO
    acompId     : parseInt(seleccionado.value, 10),
    // NOMBRE DEL ACOMPAÑAMIENTO
    acompNombre : seleccionado.dataset.nombre
  });

  // CERRAR EL MODAL
  bootstrap.Modal.getInstance(
    document.getElementById('modalAcompanamiento')
  ).hide();

  // DESACTIVAR NUEVAMENTE EL BOTÓN HASTA QUE HAYA NUEVA SELECCIÓN
  btnConfirm.disabled = true;
});

// ---- FIN CONFIRMACIÓN DE ACOMPAÑAMIENTO DESDE EL MODAL ----



// ---- AGREGAR PRODUCTO AL CARRITO ----

function agregarProductoAlCarrito(prod) {
  // NO PERMITIR SI LA COMANDA YA ESTÁ ENVIADA
  if (!pedidoEditable) return;

  // AGREGAR NUEVO ITEM AL ARREGLO INTERNO
  carritoData.push({
    // ID UNICO INTERNO
    uid               : crypto.randomUUID(),
    // ID DEL PRODUCTO (NULL SI SE AGREGA UN ACOMPAÑAMIENTO SOLO)
    product_id        : prod.id ?? null,
    // ID ACOMPAÑAMIENTO (NULL SI NO SE AGREGA EN UN PRODUCTO CON ACOMPAÑAMIENTO)
    acompanamiento_id : prod.acompId ?? null,
    // CANTIDAD DE ITEM POR DEFECTO 1, SE PUEDE CAMBIAR EN FUTURAS MEJORAS
    cantidad          : 1,
    // PRECIO INDIVIDUAL
    precio_unitario   : prod.precio,
    // NOMBRE VISIBLE
    nombreVisible     : prod.nombre + (prod.acompNombre ? ' - ' + prod.acompNombre : '')
  });

  // REFLEJAR CAMBIOS EN LA VISTA
  actualizarCarrito();
}

// ---- FIN AGREGAR PRODUCTO AL CARRITO ----



// ---- ACTUALIZAR LA INTERFAZ ----

function actualizarCarrito() {
  // DETENER SI EL CONTENEDOR NO ESTÁ PRESENTE
  if (!contCarrito) return;

  // REINICIAR CONTENIDO Y TOTAL
  contCarrito.innerHTML = '';
  totalCLP = 0;

  // RECORRER LOS ELEMENTOS Y AGREGARLOS A LA VISTA
  carritoData.forEach(item => {
    totalCLP += item.precio_unitario * item.cantidad;

    contCarrito.insertAdjacentHTML(
      'beforeend',
      `<div class="registrar-comanda-carrito" data-uid="${item.uid}">
         <div class="registrar-comanda-carrito-izquierda">
           <h1>${item.nombreVisible}</h1>
           <p>${fmt(item.precio_unitario * item.cantidad)}</p>
         </div>
         ${pedidoEditable ? `
           <div class="registrar-comanda-carrito-derecha">
             <button class="btn-eliminar">
               <i class="fa-solid fa-trash"></i>
             </button>
           </div>` : ''}
       </div>`
    );
  });

  // ACTUALIZAR TOTAL EN LA UI
  if (lblTotal) lblTotal.textContent = fmt(totalCLP);

  // ASIGNAR EVENTO A LOS BOTONES DE ELIMINAR (SOLO SI ES EDITABLE)
  if (pedidoEditable) {
    contCarrito.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.onclick = ({ currentTarget }) => {
        const uid = currentTarget.closest('.registrar-comanda-carrito').dataset.uid;

        // REMOVER DEL ARREGLO Y REDIBUJAR
        carritoData = carritoData.filter(p => p.uid !== uid);
        actualizarCarrito();
      };
    });
  }
}

// ---- FIN ACTUALIZAR LA INTERFAZ ----



// ------------ FIN FUNCIONALIDAD DEL CARRITO ------------




// ------------ FUNCIONALIDAD MESAS ------------

// RECORRE TODAS LAS MESAS Y LES ASIGNA UN EVENTO CUANDO SE HACE CLICK
document.querySelectorAll('.mesa').forEach(mesa => {
  mesa.addEventListener('click', () => {

    // CAMBIAR A LA VISTA DE LA CARTA PARA REGISTRAR COMANDA
    document.getElementById('vista-mesas').style.display = 'none';
    document.getElementById('vista-carta').style.display = 'flex';
    document.getElementById('header').style.display      = 'none';

    // GUARDAR QUÉ MESA SELECCIONÓ EL GARZÓN
    const numeroMesa = parseInt(
      mesa.querySelector('h2').textContent.replace('Mesa ', '')
    );
    window.mesaSeleccionada = numeroMesa;

    // MOSTRAR EL NÚMERO DE MESA EN LA PARTE SUPERIOR
    const lblMesa = document.getElementById('mesa-actual');
    if (lblMesa) {
      lblMesa.textContent  = `Mesa ${String(numeroMesa).padStart(2,'0')}`;
      lblMesa.dataset.mesa = numeroMesa;
    }

    // ELIMINAR EL SELECT DE CAMBIO DE MESA SI YA EXISTE
    document.getElementById('select-mesa')?.remove();

    // CREAR UN NUEVO SELECT PARA CAMBIAR MESA (SI SE EQUIVOCÓ)
    const select = document.createElement('select');
    select.id            = 'select-mesa';
    select.style.display = 'none';

    // AGREGAR LAS MESAS DISPONIBLES AL SELECT
    (window.mesasDisponibles || []).forEach(num => {
      const opt = document.createElement('option');
      opt.value = num;
      opt.textContent = `Mesa ${String(num).padStart(2,'0')}`;
      select.appendChild(opt);
    });

    // INSERTAR SELECT JUNTO AL NOMBRE DE LA MESA
    lblMesa?.insertAdjacentElement('afterend', select);
    select.value = numeroMesa;

    // CONFIGURAR BOTÓN PARA CAMBIAR LA MESA (SI ESTÁ LIBRE)
    const btnEditar = document.getElementById('btn-editar-mesa');
    const ocupada   = !(window.mesasDisponibles || []).includes(numeroMesa);

    if (btnEditar) {
      btnEditar.disabled = ocupada;
      btnEditar.classList.toggle('btn-desactivado', ocupada);

      // EVENTO AL HACER CLICK EN EDITAR MESA
      btnEditar.onclick = () => {
        if (btnEditar.disabled) return;

        const mesaOriginal = numeroMesa;

        // MUESTRA EL SELECT PARA CAMBIAR LA MESA
        lblMesa.style.display = 'none';
        select.style.display  = 'inline-block';
        select.focus();

        // ACTUALIZA LA MESA AL SELECCIONAR UNA NUEVA DEL SELECT
        select.onchange = () => {
          const nueva = parseInt(select.value, 10);
          lblMesa.dataset.mesa = nueva;
          lblMesa.textContent  = `Mesa ${String(nueva).padStart(2,'0')}`;
          select.style.display = 'none';
          lblMesa.style.display = 'inline-block';
        };

        // SI NO SE ELIGE OTRA MESA Y SE SALE DEL SELECT, VUELVE A LA MESA ORIGINAL
        select.onblur = () => {
          if (select.style.display !== 'none') {
            select.value         = mesaOriginal;
            lblMesa.dataset.mesa = mesaOriginal;
            lblMesa.textContent  = `Mesa ${String(mesaOriginal).padStart(2,'0')}`;
            select.style.display = 'none';
            lblMesa.style.display = 'inline-block';
          }
        };
      };
    }

    // RESETEA TODOS LOS DATOS DEL PEDIDO PARA LA NUEVA MESA
    const btnEntregar = document.getElementById('entregar-comanda');
    const btnEnviar   = document.getElementById('enviar-comanda');
    const btnCaja     = document.getElementById('esperando-caja');
    const lblPedido   = document.getElementById('numero-pedido');

    contCarrito.innerHTML = '';
    if (lblPedido) lblPedido.textContent = 'COMANDA NUEVA';
    if (lblTotal)  lblTotal.textContent  = '$0';

    btnEntregar.style.display = 'none';
    btnEntregar.disabled      = true;
    btnEntregar.classList.add('btn-desactivado');

    btnEnviar.style.display = 'inline-block';
    btnEnviar.disabled      = false;

    btnCaja.style.display   = 'none';

    // CONSULTA EN EL BACKEND SI YA EXISTE UNA COMANDA PARA ESA MESA
    fetch(`/api/comanda/mesa/${numeroMesa}/`)
      .then(r => r.json())
      .then(d => {

        // REINICIAR VARIABLES INTERNAS
        carritoData.length = 0;
        totalCLP           = 0;

        // SI EXISTE UNA COMANDA YA CREADA PARA ESA MESA
        if (d.comanda_id && Array.isArray(d.items)) {

          // NO SE PUEDE EDITAR EL PEDIDO
          pedidoEditable = false;

          if (lblPedido) lblPedido.textContent = `N° COMANDA: ${d.comanda_id}`;

          // CARGA LOS PRODUCTOS DE LA COMANDA GUARDADA EN LA INTERFAZ
          d.items.forEach(it => {
            carritoData.push({
              uid               : crypto.randomUUID(),
              product_id        : it.product_id,
              acompanamiento_id : it.acompanamiento_id,
              cantidad          : it.cantidad,
              precio_unitario   : it.precio_unitario,
              nombreVisible     : it.nombre
            });
            totalCLP += it.precio_unitario * it.cantidad;
          });

          actualizarCarrito();
          if (lblTotal) lblTotal.textContent = fmt(totalCLP);

        } else {
          // SI NO EXISTE COMANDA, SE PUEDE CREAR UNA NUEVA
          pedidoEditable = true;
          actualizarCarrito();
        }

        // MUESTRA U OCULTA BOTONES SEGÚN EL ESTADO DE LA COMANDA
        switch (d.estado_id) {
          case 1:
            // EN COCINA
            btnEntregar.style.display = 'inline-block';
            btnEntregar.classList.add('btn-desactivado');
            btnEntregar.dataset.id = d.comanda_id;
            btnEnviar.style.display = 'none';
            break;

          case 2:
            // LISTA PARA ENTREGAR
            btnEntregar.style.display = 'inline-block';
            btnEntregar.disabled = false;
            btnEntregar.classList.remove('btn-desactivado');
            btnEntregar.dataset.id = d.comanda_id;
            btnEnviar.style.display = 'none';
            break;

          case 3:
            // ENTREGADA, ESPERANDO PAGO
            btnEntregar.style.display = 'none';
            btnEnviar.style.display   = 'none';
            btnCaja.style.display     = 'inline-block';
            break;
        }

        // SI NO SE PUEDE EDITAR LA COMANDA, OCULTA EL BOTÓN ENVIAR
        if (!pedidoEditable) {
          btnEnviar.style.display = 'none';
        }
      })
      .catch(err => console.error('ERROR AL OBTENER COMANDA:', err));
  });
});

// BOTÓN PARA VOLVER DESDE CARTA A MESAS MANUALMENTE
document.querySelector('.registrar-comanda-izquierda-arriba button')
        .addEventListener('click', () => {

  // MUESTRA NUEVAMENTE LAS MESAS
  document.getElementById('vista-carta').style.display = 'none';
  document.getElementById('vista-mesas').style.display = 'flex';
  document.getElementById('header').style.display      = 'flex';

  // LIMPIA EL ESTADO DE LA MESA SELECCIONADA
  window.mesaSeleccionada = null;
  const lblMesa = document.getElementById('mesa-actual');
  if (lblMesa) lblMesa.textContent = '';
});

// ------------ FIN FUNCIONALIDAD MESAS ------------



// ------------ FUNCIONALIDAD CREAR COMANDA ------------

// --- ENVIAR COMANDA
document.getElementById('enviar-comanda').addEventListener('click', async () => {

  if (carritoData.length === 0) {
    overlayMostrar('vacio');
    return;
  }
  overlayMostrar('enviando');

  /* 2. Total y estructura de ítems */
  const items = carritoData.map(r => ({
    product_id        : r.product_id,
    acompanamiento_id : r.acompanamiento_id,
    cantidad          : r.cantidad               // hoy siempre 1
  }));

  const total = carritoData.reduce(
    (acc, r) => acc + r.precio_unitario * r.cantidad, 0
  );

  /* 3. Datos generales de la comanda */
  const mesaId = parseInt(document.getElementById('select-mesa')?.value) ||
                 parseInt(document.getElementById('mesa-actual')?.dataset.mesa);

  const ahora  = new Date();

  const data = {
    usuario             : document.getElementById('usuario-logueado')?.value || 'Garzón',
    mesa_id             : mesaId,
    estado_id           : 1,
    precio_total_comanda: total,
    items               : items
  };

  /* 4. POST al backend */
  try {
    const res  = await fetch('/api/comanda/crear/', {
      method  : 'POST',
      headers : { 'Content-Type':'application/json',
                  'X-CSRFToken'  : getCSRFToken()
                },
      body    : JSON.stringify(data)
    });

    const json = await res.json().catch(() => ({}));
    console.log('status', res.status, 'json', json);

    if (res.ok && json.success !== false) {
      overlayMostrar('enviado');
      setTimeout(() => location.reload(), 1800);
    } else {
      overlayMostrar('errorEntregar');
    }

  } catch (err) {
    console.error(err);
    overlayMostrar('sinRed');
  }
});

// ------------ FIN FUNCIONALIDAD CREAR COMANDA ------------



// ------------ FUNCIONALIDAD ENTREGAR COMANDA ------------

// AL HACER CLICK EN EL BOTÓN ENTREGAR COMANDA
document.getElementById('entregar-comanda').addEventListener('click', function () {

  // SI EL BOTÓN ESTÁ DESACTIVADO, NO SE HACE NADA
  if (this.disabled) return;

  // OBTENER ID DE LA COMANDA DESDE EL ATRIBUTO DATASET
  const comandaId = this.dataset.id;
  if (!comandaId) {
    alert('No hay comanda activa');
    return;
  }

  // ENVIAR LA SOLICITUD AL BACKEND PARA ENTREGAR LA COMANDA
  fetch(`/comanda/entregar-garzon/${comandaId}/`, {
    method : 'POST',
    headers: { 'X-CSRFToken': getCSRFToken() }
  })

  // RESPUESTA DEL SERVIDOR
  .then(r => r.json())
  .then(d => {
    if (d.mensaje) {

      // CONFIRMACIÓN VISUAL DE COMANDA ENTREGADA Y QUE SE CAMBIO EN EL BACKEND
      overlayMostrar('entregado');
      setTimeout(() => location.reload(), 1800);
    } else {

      // ALERTA VISUAL DE ERROR AL ENTREGAR
      overlayMostrar('errorEntregar');
    }
  })

  // ALERTA VISUAL DE ERROR EN CONEXIÓN
  .catch(() => {
    overlayMostrar('sinRed');  
  });
});

// ------------ FIN FUNCIONALIDAD ENTREGAR COMANDA ------------