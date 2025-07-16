// ------------ ESTADÍSTICAS / GRÁFICO DE COMANDAS (APEXCHART) ------------

document.addEventListener('DOMContentLoaded', () => {

  // DICCIONARIO PARA MOSTRAR EL MES COMPLETO EN EL TOOLTIP
  const MES_LARGO = {
    Jan: 'Enero',      Feb: 'Febrero',   Mar: 'Marzo',
    Apr: 'Abril',      May: 'Mayo',      Jun: 'Junio',
    Jul: 'Julio',      Aug: 'Agosto',    Sep: 'Septiembre',
    Oct: 'Octubre',    Nov: 'Noviembre', Dec: 'Diciembre'
  };

  // CONFIGURACIÓN PRINCIPAL DE APEXCHARTS
  const options = {
    chart: {
      // GRÁFICO DE BARRAS
      type  : 'bar',
      // ALTO EN PIXELES
      height: 320
    },

    // SERIES DE DATOS — VIENEN RENDERIZADAS DESDE DJANGO:
    //   - SERIE4 : COMANDAS COMPLETADAS
    //   - SERIE5 : COMANDAS CANCELADAS
    series: [
      { name: 'Completadas', data: SERIE4, color: '#243346' },
      { name: 'Canceladas' , data: SERIE5, color: '#bb2633' }
    ],

    // CATEGORÍAS DEL EJE X (MESES EN FORMATO CORTO)
    xaxis: { categories: MESES },

    // ESTILOS DE LAS BARRAS
    plotOptions: {
      bar: {
        // ANCHO RELATIVO DE CADA BARRA
        columnWidth: '45%',
        // ESQUINAS REDONDEADAS
        borderRadius: 4,
        endingShape: 'rounded'
      }
    },

    // OCULTAR NÚMEROS SOBRE LAS BARRAS
    dataLabels: { enabled: false },

    // LEYENDA ARRIBA DEL GRÁFICO
    legend     : { position: 'top' },

    // TOOLTIP PERSONALIZADO (AL PASAR EL MOUSE)
    tooltip: {
      x: {
        // MES COMPLETO
        formatter: val => MES_LARGO[val] ?? val
      },
      y: {
         // SUFIJO
        formatter: v => `${v} comandas`
      }
    }
  };

  // RENDERIZAR EL GRÁFICO EN EL DIV #CHART
  new ApexCharts(
    document.querySelector('#chart'),
    options
  ).render();

});

// ------------ FIN ESTADÍSTICAS / GRÁFICO DE COMANDAS ------------