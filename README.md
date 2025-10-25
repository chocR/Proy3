Simulador de Planificación de Procesos.

Este proyecto es una aplicación web que simula la ejecución de procesos en un sistema operativo utilizando tres algoritmos clásicos de planificación de procesos: FCFS (First-Come, First-Served), SJF (Shortest Job First) y Round Robin. La simulación se visualiza en un gráfico de Gantt y proporciona métricas de rendimiento como el tiempo de espera, tiempo de respuesta y eficiencia.

Características

Algoritmos de Planificación:

FCFS: Planificación en la que los procesos se ejecutan en el orden de llegada.

SJF: Planificación que ejecuta primero el proceso con el menor tiempo de CPU.

Round Robin: Planificación cíclica, donde los procesos se ejecutan en turnos con un quantum de tiempo.

Interfaz de Usuario:

Agregar, eliminar y gestionar procesos.

Selección de algoritmo de planificación y parámetros.

Visualización de la simulación con un gráfico de Gantt.

Visualización del historial de ejecución y las colas de procesos.

Métricas:

Promedio de tiempo de espera (WT), tiempo de respuesta (RT) y tiempo de vuelta (TAT).

Eficiencia de cada proceso (proceso con mayor eficiencia resaltado).

Requisitos

Navegador Web: Compatible con HTML5 y JavaScript moderno.

No se requieren dependencias externas.

Instalación

Clona el repositorio:

git clone https://github.com/usuario/simulador-planificacion.git


Estructura del Proyecto:

index.html: La página principal con la interfaz de usuario.

style.css: Los estilos visuales de la aplicación.

app.js: La lógica de la simulación y los algoritmos de planificación.

Ejecuta el proyecto:

Abre el archivo index.html en tu navegador web para ver la interfaz de la simulación.

Uso

Crear Procesos:

Ingresa el nombre del proceso, el tiempo de CPU (unidades) y el instante de llegada.

Si seleccionas Round Robin, puedes ingresar un quantum personalizado para cada proceso.

Haz clic en "Agregar proceso" para añadir el proceso a la lista.

Seleccionar Algoritmo:

Elige uno de los tres algoritmos de planificación:

FCFS: Primero llega, primero se sirve.

SJF: El proceso con el menor tiempo de CPU se ejecuta primero.

Round Robin: Los procesos se ejecutan en turnos con un tiempo de quantum.

Configura el quantum global (solo para Round Robin) y la duración de cada unidad de tiempo.

Iniciar Simulación:

Haz clic en "Iniciar simulación" para ver cómo se ejecutan los procesos según el algoritmo seleccionado.

El gráfico de Gantt y el historial de ejecución se actualizarán en tiempo real.

Ver Resultados:

Al finalizar la simulación, se muestran las métricas de rendimiento (tiempo de espera, tiempo de vuelta y tiempo de respuesta).

También se muestra la tabla de eficiencia, destacando el proceso más eficiente.

Botones de Control:

Limpiar lista: Borra todos los procesos creados.

Cargar ejemplo: Rellena automáticamente la lista con algunos procesos de ejemplo.

Ejemplo de Datos de Entrada

Agregar un proceso:

Nombre: "P1"

Tiempo en CPU: 6 unidades

Instante de llegada: 0 unidades

Quantum: (deja vacío para FCFS/SJF, o ingresa un valor para Round Robin)

Seleccionar Algoritmo:

Elige FCFS o SJF o Round Robin.

Iniciar la simulación:

Los procesos se ejecutarán en el orden definido por el algoritmo seleccionado.

Algoritmos de Planificación
1. FCFS (First-Come, First-Served)

En este algoritmo, los procesos se ejecutan en el orden en que llegan al sistema. No hay interrupciones ni reordenamiento. Si un proceso llega mientras otro está ejecutándose, tendrá que esperar hasta que el proceso anterior termine.

2. SJF (Shortest Job First)

Este algoritmo selecciona el proceso que tiene el menor tiempo de CPU necesario para ejecutar (su "burst time"). Si varios procesos llegan en el mismo tiempo, se selecciona el que tiene el menor tiempo de CPU. Es un algoritmo no expropiativo, por lo que el proceso seleccionado se ejecuta hasta finalizar.

3. Round Robin (RR)

Round Robin es un algoritmo expropiativo donde los procesos se ejecutan en turnos, y cada uno tiene un tiempo máximo (quantum) para ejecutarse. Si un proceso no termina en su turno, se coloca al final de la cola y se le asigna otro turno.

Métricas

Tiempo de espera (WT): El tiempo que un proceso pasa en la cola de espera antes de comenzar a ejecutarse.

Tiempo de vuelta (TAT): El tiempo total que un proceso pasa en el sistema, desde su llegada hasta que termina.

Tiempo de respuesta (RT): El tiempo que transcurre desde que un proceso llega al sistema hasta que comienza a ejecutarse.

Eficiencia: Relación entre el tiempo de CPU utilizado por un proceso y su tiempo de vuelta.

