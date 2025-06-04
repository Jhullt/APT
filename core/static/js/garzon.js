// REZISER (mantienes esto como ya lo tenías)
const resizer = document.querySelector('.registrar-comanda-centro');
const leftPanel = document.querySelector('.registrar-comanda-izquierda');
const rightPanel = document.querySelector('.registrar-comanda-derecha');

let isResizing = false;

if (resizer) {
  resizer.addEventListener('mousedown', () => {
    isResizing = true;
    document.body.style.cursor = 'col-resize';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    const offsetLeft = e.clientX;
    const totalWidth = resizer.parentNode.offsetWidth;
    const minLeft = 200;
    const maxLeft = totalWidth - 300;

    const newLeftWidth = Math.min(Math.max(offsetLeft, minLeft), maxLeft);
    leftPanel.style.width = `${newLeftWidth}px`;
    rightPanel.style.width = `${totalWidth - newLeftWidth - resizer.offsetWidth}px`;
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = 'default';
    }
  });
}

// CARGA DINÁMICA DE PRODUCTOS POR CATEGORÍA
document.addEventListener('DOMContentLoaded', function () {
  const botones = document.querySelectorAll('.btn-categoria');
  const contenedor = document.querySelector('.contenedor-productos');

  function cargarProductos(categoriaId) {
    fetch(`/api/productos/${categoriaId}/`)
      .then(response => response.json())
      .then(data => {
        contenedor.innerHTML = '';
        data.productos.forEach(p => {
          const div = document.createElement('div');
          div.className = 'producto';
          div.innerHTML = `
            <img src="${p.imagen}" alt="${p.nombre}">
            <p>${p.nombre}</p>
            <strong>$${p.precio.toLocaleString()}</strong>
          `;

          div.addEventListener('click', () => {
            if (p.acompanamiento_producto) {
              console.log(`Abrir modal para: ${p.nombre}`);
              abrirModal(p);
            } else {
              console.log(`Agregar directo al carrito: ${p.nombre}`);
              agregarProductoAlCarrito(p);
            }            
          });

          contenedor.appendChild(div);
        });
      });
  }

  // Cargar categoría 1 al iniciar
  cargarProductos(1);

  // Cargar categoría al hacer clic
  botones.forEach(boton => {
    boton.addEventListener('click', function () {
      const categoriaId = this.dataset.id;
      cargarProductos(categoriaId);
    });
  });
});

// AGREGAR PRODUCTO AL CARRITO
function agregarProductoAlCarrito(p) {
  const carrito = document.querySelector('.registrar-comanda-derecha-medio-pedido-contenedor');
  const item = document.createElement('div');
  item.className = 'registrar-comanda-carrito';

  item.innerHTML = `
    <div class="registrar-comanda-carrito-izquierda">
    <h1>${p.nombre}${p.acompanamiento ? ' - ' + p.acompanamiento : ''}</h1>

      <p>$${p.precio.toLocaleString()}</p>
    </div>
    <div class="registrar-comanda-carrito-derecha">
      <button class="btn-eliminar"><i class="fa-solid fa-trash"></i></button>
    </div>
  `;

  item.querySelector('.btn-eliminar').addEventListener('click', () => {
    item.remove();
  });

  carrito.appendChild(item);
}

// Abrir modal con acompañamientos
function abrirModal(p) {
  productoSeleccionado = p;
  document.getElementById('modalProductoNombre').textContent = 'Selecciona acompañamiento';

  fetch('/api/acompanamientos/')
    .then(res => res.json())
    .then(data => {
      const form = document.getElementById('formAcompanamientos');
      form.innerHTML = '';

      data.acompanamientos.forEach(a => {
        const input = document.createElement('div');
        input.innerHTML = `
          <div class="form-check">
            <input class="form-check-input" type="radio" name="acompanamiento" id="a${a.id}" value="${a.nombre}">
            <label class="form-check-label" for="a${a.id}">${a.nombre}</label>
          </div>
        `;
        form.appendChild(input);
      });

      const modal = new bootstrap.Modal(document.getElementById('modalAcompanamiento'));
      modal.show();
    });
}

// Confirmar selección y agregar al carrito
document.getElementById('confirmarAcompanamiento').addEventListener('click', () => {
  const seleccionado = document.querySelector('input[name="acompanamiento"]:checked');
  if (!seleccionado) {
    alert('Debes seleccionar un acompañamiento');
    return;
  }

  productoSeleccionado.acompanamiento = seleccionado.value;
  agregarProductoAlCarrito(productoSeleccionado);

  const modalElement = bootstrap.Modal.getInstance(document.getElementById('modalAcompanamiento'));
  modalElement.hide();
});

// Mostrar vista-carta y ocultar header + vista-mesas al hacer clic en una mesa
document.querySelectorAll('.mesa').forEach(mesa => {
  mesa.addEventListener('click', () => {
    document.getElementById('vista-mesas').style.display = 'none';
    document.getElementById('vista-carta').style.display = 'flex';
    document.getElementById('header').style.display = 'none';
  });
});

// Volver desde vista-carta a vista-mesas
document.querySelector('.registrar-comanda-izquierda-arriba button').addEventListener('click', () => {
  document.getElementById('vista-carta').style.display = 'none';
  document.getElementById('vista-mesas').style.display = 'flex';
  document.getElementById('header').style.display = 'flex';
});



// ENVIAR COMANDA
document.getElementById('enviar-comanda').addEventListener('click', () => {
  const carritoItems = document.querySelectorAll('.registrar-comanda-carrito');
  if (carritoItems.length === 0) {
    alert('El carrito está vacío');
    return;
  }

  const detalle = [];
  let total = 0;

  carritoItems.forEach(item => {
    const nombre = item.querySelector('h1').textContent;
    const precioTexto = item.querySelector('p').textContent.replace('$', '').replace('.', '').replace(',', '');
    const precio = parseInt(precioTexto);
    detalle.push(nombre);
    total += precio;
  });

  const ahora = new Date();
  const fecha = ahora.toISOString().split('T')[0];
  const hora = ahora.toTimeString().split(' ')[0];

  // Datos a enviar
  const data = {
    usuario: 'Natalia',
    mesa_id: 1,
    estado_id: 1,
    detalle: detalle.join('\n'),
    precio_total_comanda: total,
    fecha_comanda: fecha,
    hora_inicio_comanda: hora
  };


  fetch('/api/comanda/crear/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCSRFToken()
    },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (response.ok) {
      alert('Comanda enviada correctamente');
      // Limpiar el carrito
      document.querySelector('.registrar-comanda-derecha-medio-pedido-contenedor').innerHTML = '';
      document.querySelector('.registrar-comanda-derecha-precio h1:last-child').textContent = '$0';
    } else {
      alert('Error al enviar la comanda');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Error al conectar con el servidor');
  });
});

// Función para obtener el token CSRF
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
