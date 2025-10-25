// --- Estado ---
let processes = [];
let nextPid = 1;

// Utilidad: clonar profundo
const deep = obj => JSON.parse(JSON.stringify(obj));

// Render tabla de procesos
function renderProcessTable() {
  const div = document.getElementById("process-table");
  if (processes.length === 0) {
    div.innerHTML = "<p>No hay procesos. Agrega algunos arriba.</p>";
    return;
  }
  const rows = processes.map(p => `
    <tr>
      <td>${p.pid}</td>
      <td>${p.name}</td>
      <td>${p.burst}</td>
      <td>${p.arrival}</td>
      <td>${p.quantum ?? "-"}</td>
      <td><a class="del" data-pid="${p.pid}">Eliminar</a></td>
    </tr>
  `).join("");
  div.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>PID</th><th>Nombre</th><th>CPU (u)</th><th>Llegada</th><th>Quantum (u)</th><th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
  div.querySelectorAll("a.del").forEach(a => {
    a.addEventListener("click", (e) => {
      const pid = parseInt(e.target.getAttribute("data-pid"));
      processes = processes.filter(x => x.pid !== pid);
      renderProcessTable();
    });
  });
}

// Agregar proceso
document.getElementById("process-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const burst = parseInt(document.getElementById("burst").value);
  const arrival = parseInt(document.getElementById("arrival").value);
  const pq = document.getElementById("pquantum").value;
  const pquantum = pq ? parseInt(pq) : null;

  processes.push({ pid: nextPid++, name, burst, arrival, quantum: pquantum });
  e.target.reset();
  document.getElementById("burst").value = 5;
  document.getElementById("arrival").value = 0;
  renderProcessTable();
});

document.getElementById("clear-processes").addEventListener("click", () => {
  processes = []; nextPid = 1; renderProcessTable();
});

// Cargar demo
document.getElementById("demo-data").addEventListener("click", () => {
  processes = [
    {pid:1,name:"P1",burst:6,arrival:0,quantum:null},
    {pid:2,name:"P2",burst:4,arrival:1,quantum:null},
    {pid:3,name:"P3",burst:2,arrival:3,quantum:1},
    {pid:4,name:"P4",burst:5,arrival:5,quantum:null},
  ];
  nextPid = 5;
  renderProcessTable();
});

// --- Algoritmos ---

// FCFS: ordenar por llegada; no expropiativo
function scheduleFCFS(procs) {
  procs.sort((a,b) => a.arrival - b.arrival || a.pid - b.pid);
  let t = 0, timeline = [], readyQueues = {}, history = [];
  procs.forEach(p => {
    if (t < p.arrival) {
      // CPU ociosa
      for (let idle=t; idle<p.arrival; idle++) {
        readyQueues[idle] = readyQueues[idle] || [];
        history.push({time: idle, action: "CPU idle"});
      }
      t = p.arrival;
    }
    for (let i=0;i<p.burst;i++) {
      timeline.push({time: t, pid: p.pid});
      readyQueues[t] = readyQueues[t] || [];
      history.push({time: t, action: `Ejecuta ${p.name} (PID ${p.pid})`});
      t++;
    }
  });
  return { timeline, readyQueues, history };
}

// SJF no expropiativo: elegir el de menor ráfaga disponible
// SJF (Shortest Job First) no expropiativo robusto
// - Siempre elige el proceso disponible con MENOR ráfaga (burst)
// - Si no hay disponibles en t, la CPU queda "idle" y t avanza
// - Empata por llegada y luego por PID para un orden estable
function scheduleSJF(procs) {
  let t = 0;
  const n = procs.length;
  const done = new Set();                 // PIDs ya terminados
  const timeline = [];
  const readyQueues = {};
  const history = [];

  while (done.size < n) {
    // 1) Procesos disponibles a tiempo t y no terminados
    const available = procs.filter(p => p.arrival <= t && !done.has(p.pid));

    // 2) Si no hay, CPU idle y avanzamos el tiempo
    if (available.length === 0) {
      readyQueues[t] = [];
      history.push({ time: t, action: "CPU idle" });
      t++;
      continue;
    }

    // 3) Elegimos el de MENOR BURST (empate: llegada, luego PID)
    available.sort((a, b) =>
      a.burst - b.burst ||
      a.arrival - b.arrival ||
      a.pid - b.pid
    );
    const p = available[0];

    // 4) Ejecutamos p de forma CONTIGUA por 'burst' unidades (no expropiativo)
    for (let i = 0; i < p.burst; i++) {
      timeline.push({ time: t, pid: p.pid });

      // Cola "ready" en este instante (todos los que han llegado y no han terminado, EXCEPTO el que ejecuta)
      const rq = procs
        .filter(q => q.arrival <= t && !done.has(q.pid) && q.pid !== p.pid)
        .sort((a, b) => a.pid - b.pid) // solo para que la cola sea legible y estable
        .map(x => x.pid);

      readyQueues[t] = rq;
      history.push({ time: t, action: `Ejecuta ${p.name} (PID ${p.pid})` });
      t++;
    }

    // 5) Marcamos p como terminado
    done.add(p.pid);
  }

  return { timeline, readyQueues, history };
}


// SRTF: expropiativo; siempre corre el de menor restante
function scheduleSRTF(procs) {
  let t = 0, remaining = new Map(), timeline=[], readyQueues={}, history=[];
  procs.forEach(p=>remaining.set(p.pid, p.burst));
  const done = new Set();
  while (done.size < procs.length) {
    const available = procs.filter(p=>p.arrival<=t && !done.has(p.pid));
    if (available.length===0) { readyQueues[t]=[]; history.push({time:t, action:"CPU idle"}); t++; continue; }
    available.sort((a,b)=>remaining.get(a.pid)-remaining.get(b.pid) || a.arrival-b.arrival || a.pid-b.pid);
    const p = available[0];
    timeline.push({time:t, pid:p.pid});
    readyQueues[t]=available.slice(1).map(x=>x.pid);
    history.push({time:t, action:`Ejecuta ${p.name} (PID ${p.pid})`});
    remaining.set(p.pid, remaining.get(p.pid)-1);
    if (remaining.get(p.pid)===0) done.add(p.pid);
    t++;
  }
  return { timeline, readyQueues, history };
}

// Round Robin: expropiativo por quantum
function scheduleRR(procs, globalQ) {
  let t = 0, remaining = new Map(), timeline=[], readyQueues={}, history=[];
  procs.forEach(p=>remaining.set(p.pid, p.burst));
  const queue = [];
  const added = new Set();

  function enqueueArrivals(time) {
    procs.filter(p=>p.arrival<=time && !added.has(p.pid)).sort((a,b)=>a.arrival-b.arrival || a.pid-b.pid).forEach(p=>{
      queue.push(p);
      added.add(p.pid);
    });
  }

  enqueueArrivals(0);
  while (remaining.size > 0) {
    if (queue.length===0) {
      // avanzar hasta próxima llegada
      const nextArrival = Math.min(...procs.filter(p=>remaining.has(p.pid)).map(p=>p.arrival).filter(a=>a>t));
      for (let idle=t; idle<nextArrival; idle++) { readyQueues[idle]=[]; history.push({time:idle, action:"CPU idle"}); }
      t = nextArrival;
      enqueueArrivals(t);
      if (queue.length===0) break;
    }
    const p = queue.shift();
    const q = p.quantum ?? globalQ;
    let slice = Math.min(q, remaining.get(p.pid));

    for (let i=0; i<slice; i++) {
      timeline.push({time:t, pid:p.pid});
      // la cola en este instante (excluye el que ejecuta)
      readyQueues[t] = queue.map(x=>x.pid);
      history.push({time:t, action:`Ejecuta ${p.name} (PID ${p.pid})`});
      t++;
      // llegan nuevos mientras ejecuta
      enqueueArrivals(t);
    }
    const left = remaining.get(p.pid) - slice;
    if (left > 0) {
      remaining.set(p.pid, left);
      queue.push(p); // reencolar
    } else {
      remaining.delete(p.pid);
    }
  }
  return { timeline, readyQueues, history };
}

// --- Simulación ---
function runSimulation() {
  if (processes.length === 0) {
    alert("Agrega procesos primero.");
    return;
  }
  const alg = document.getElementById("algorithm").value;
  const gq = parseInt(document.getElementById("global-quantum").value) || 2;
  const unitSec = parseInt(document.getElementById("unit-seconds").value) || 5;
  document.getElementById("unit-sec-label").textContent = unitSec.toString();

  const procs = deep(processes).sort((a,b)=>a.arrival-b.arrival || a.pid-b.pid);
  let result;
  if (alg==="FCFS") result = scheduleFCFS(procs);
  else if (alg==="SJF") result = scheduleSJF(procs);
  else if (alg==="SRTF") result = scheduleSRTF(procs);
  else result = scheduleRR(procs, gq);

  renderGantt(result.timeline, procs);
  renderHistory(result.history, unitSec);
  renderReadyQueues(result.readyQueues);
  renderMetrics(result.timeline, procs, unitSec);
}

// Render Gantt
function renderGantt(timeline, procs) {
  const gantt = document.getElementById("gantt");
  if (timeline.length===0) { gantt.innerHTML = "<p>Sin ejecución.</p>"; return; }
  // agrupar por pid
  const byPid = {};
  procs.forEach(p=>byPid[p.pid]=[]);
  timeline.forEach(slot => byPid[slot.pid]?.push(slot.time));

  // construir filas
  const maxTime = Math.max(...timeline.map(x=>x.time)) + 1;
  const headerRow = document.createElement("div");
  headerRow.className = "gantt-row";
  headerRow.innerHTML = `<div class="gantt-label">t</div>` + Array.from({length:maxTime},(_,i)=>`<div class="gantt-cell">${i}</div>`).join("");
  gantt.innerHTML = "";
  gantt.appendChild(headerRow);

  Object.entries(byPid).forEach(([pid, times]) => {
    if (times.length===0) return;
    const p = procs.find(x=>x.pid==pid);
    const row = document.createElement("div");
    row.className = "gantt-row";
    row.innerHTML = `<div class="gantt-label">${p.name} (PID ${pid})</div>` +
      Array.from({length:maxTime},(_,i)=>{
        const runs = times.includes(i);
        return `<div class="gantt-cell" style="${runs?'opacity:1':'opacity:.2'}">${runs?'■':''}</div>`;
      }).join("");
    gantt.appendChild(row);
  });
}

// Historial
function renderHistory(history, unitSec) {
  const div = document.getElementById("history");
  const lines = history.map(h=>`t=${h.time} (≈${h.time*unitSec}s): ${h.action}`);
  div.textContent = lines.join("\n");
}

// Ready queues
function renderReadyQueues(rqs) {
  const div = document.getElementById("ready-queues");
  const keys = Object.keys(rqs).map(x=>parseInt(x)).sort((a,b)=>a-b);
  const lines = keys.map(t=>`t=${t}: [${rqs[t].join(", ")}]`);
  div.textContent = lines.join("\n");
}

// Métricas: waiting time, turnaround, response time (primer arranque)
function renderMetrics(timeline, procs, unitSec) {
  // tiempos de comienzo y fin por proceso
  const firstStart = new Map();
  const lastTime = new Map();
  const executedSlots = new Map();
  timeline.forEach(s=>{
    if (!firstStart.has(s.pid)) firstStart.set(s.pid, s.time);
    lastTime.set(s.pid, s.time);
    executedSlots.set(s.pid, (executedSlots.get(s.pid)||0)+1);
  });
  const rows = procs.map(p=>{
    const start = firstStart.get(p.pid);
    const finish = (lastTime.get(p.pid) ?? -1) + 1;
    const turnaround = finish - p.arrival; // TAT = finish - arrival
    const waiting = turnaround - p.burst;  // WT = TAT - burst
    const response = (start!=null ? start - p.arrival : 0);
    return {pid:p.pid, name:p.name, arrival:p.arrival, burst:p.burst, start, finish, waiting, turnaround, response};
  });

  const avg = (arr)=> arr.reduce((a,b)=>a+b,0)/arr.length;
  const avgWaiting = avg(rows.map(r=>r.waiting));
  const avgTurn = avg(rows.map(r=>r.turnaround));
  const avgResp = avg(rows.map(r=>r.response));

  const html = `
    <div><strong>Métricas</strong></div>
    <div>Promedio Waiting Time: ${avgWaiting.toFixed(2)} u (≈ ${(avgWaiting*unitSec).toFixed(0)} s)</div>
    <div>Promedio Turnaround Time: ${avgTurn.toFixed(2)} u (≈ ${(avgTurn*unitSec).toFixed(0)} s)</div>
    <div>Promedio Response Time: ${avgResp.toFixed(2)} u (≈ ${(avgResp*unitSec).toFixed(0)} s)</div>
    <br/>
    <details>
      <summary>Detalle por proceso</summary>
      <pre>${rows.map(r=>`${r.name} (PID ${r.pid}): start=${r.start}, finish=${r.finish}, WT=${r.waiting}, TAT=${r.turnaround}, RT=${r.response}`).join("\n")}</pre>
    </details>
  `;
  document.getElementById("metrics").innerHTML = html;
}

// Botón iniciar
document.getElementById("start-sim").addEventListener("click", runSimulation);

// Inicial
renderProcessTable();
