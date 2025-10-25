// ========================================================
// Estado y utilidades
// ========================================================
let processes = [];
let nextPid = 1;
const deep = (obj) => JSON.parse(JSON.stringify(obj));

// ========================================================
// UI: tabla de procesos
// ========================================================
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

// alta de procesos
document.getElementById("process-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const burst = parseInt(document.getElementById("burst").value);
  const arrival = parseInt(document.getElementById("arrival").value);
  const pq = document.getElementById("pquantum").value;
  const pquantum = pq ? parseInt(pq) : null;

  if (!name || !Number.isInteger(burst) || !Number.isInteger(arrival)) {
    alert("Revisa los campos: nombre, CPU y llegada.");
    return;
  }

  processes.push({ pid: nextPid++, name, burst, arrival, quantum: pquantum });
  e.target.reset();
  document.getElementById("burst").value = 5;
  document.getElementById("arrival").value = 0;
  renderProcessTable();
});

// limpiar
document.getElementById("clear-processes").addEventListener("click", () => {
  processes = []; nextPid = 1; renderProcessTable();
});

// demo
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

// ========================================================
// Algoritmos
// ========================================================

// FCFS (no expropiativo)
function scheduleFCFS(procs) {
  procs.sort((a,b)=>a.arrival-b.arrival || a.pid-b.pid);
  let t = 0, timeline=[], readyQueues={}, history=[];
  procs.forEach(p=>{
    if (t < p.arrival) {
      for (let idle=t; idle<p.arrival; idle++) { readyQueues[idle]=[]; history.push({time:idle, action:"CPU idle"}); }
      t = p.arrival;
    }
    for (let i=0;i<p.burst;i++){
      timeline.push({time:t, pid:p.pid});
      readyQueues[t]=[];
      history.push({time:t, action:`Ejecuta ${p.name} (PID ${p.pid})`});
      t++;
    }
  });
  return { timeline, readyQueues, history };
}

// SJF (no expropiativo) robusto
function scheduleSJF(procs) {
  let t = 0;
  const n = procs.length;
  const done = new Set();
  const timeline = [];
  const readyQueues = {};
  const history = [];

  while (done.size < n) {
    const available = procs.filter(p => p.arrival <= t && !done.has(p.pid));

    if (available.length === 0) {
      readyQueues[t] = [];
      history.push({ time: t, action: "CPU idle" });
      t++;
      continue;
    }

    available.sort((a, b) =>
      a.burst - b.burst ||
      a.arrival - b.arrival ||
      a.pid - b.pid
    );
    const p = available[0];

    for (let i = 0; i < p.burst; i++) {
      timeline.push({ time: t, pid: p.pid });
      const rq = procs
        .filter(q => q.arrival <= t && !done.has(q.pid) && q.pid !== p.pid)
        .sort((a,b)=>a.pid-b.pid)
        .map(x => x.pid);
      readyQueues[t] = rq;
      history.push({ time: t, action: `Ejecuta ${p.name} (PID ${p.pid})` });
      t++;
    }
    done.add(p.pid);
  }
  return { timeline, readyQueues, history };
}

// Round Robin (expropiativo)
function scheduleRR(procs, globalQ) {
  let t = 0, timeline=[], readyQueues={}, history=[];
  const remaining = new Map();
  procs.forEach(p=>remaining.set(p.pid, p.burst));
  const queue = [];
  const added = new Set();

  function enqueueArrivals(time) {
    procs.filter(p=>p.arrival<=time && !added.has(p.pid))
         .sort((a,b)=>a.arrival-b.arrival || a.pid-b.pid)
         .forEach(p=>{ queue.push(p); added.add(p.pid); });
  }

  enqueueArrivals(0);
  while (remaining.size > 0) {
    if (queue.length===0) {
      const future = procs.filter(p=>remaining.has(p.pid)).map(p=>p.arrival).filter(a=>a>t);
      if (future.length===0) break;
      const nextArrival = Math.min(...future);
      for (let idle=t; idle<nextArrival; idle++) { readyQueues[idle]=[]; history.push({time:idle, action:"CPU idle"}); }
      t = nextArrival;
      enqueueArrivals(t);
      if (queue.length===0) continue;
    }

    const p = queue.shift();
    const q = Number.isInteger(p.quantum) ? p.quantum : globalQ;
    let slice = Math.min(q, remaining.get(p.pid));

    for (let i=0; i<slice; i++) {
      timeline.push({time:t, pid:p.pid});
      readyQueues[t] = queue.map(x=>x.pid);
      history.push({time:t, action:`Ejecuta ${p.name} (PID ${p.pid})`});
      t++;
      enqueueArrivals(t);
    }

    const left = remaining.get(p.pid) - slice;
    if (left > 0) { remaining.set(p.pid, left); queue.push(p); }
    else { remaining.delete(p.pid); }
  }
  return { timeline, readyQueues, history };
}

// ========================================================
// Animación por ticks (cada N segundos = 1 unidad)
// ========================================================
let simTimer = null;
let simIndex = 0;
let simTimeline = [];
let simProcs = [];
let simReadyQueues = {};
let simHistory = [];
let simUnitSec = 3;

function buildSchedule(alg, q) {
  const procs = deep(processes).sort((a,b)=>a.arrival-b.arrival || a.pid-b.pid);
  let result;
  if (alg === "FCFS") result = scheduleFCFS(deep(procs));
  else if (alg === "SJF") result = scheduleSJF(deep(procs));
  else result = scheduleRR(deep(procs), q);
  return { procs, ...result };
}

// Render Gantt parcial hasta 'upto'
function renderGanttProgress(timeline, procs, upto) {
  const gantt = document.getElementById("gantt");
  if (timeline.length === 0) { gantt.innerHTML = "<p>Sin ejecución.</p>"; return; }

  const visible = timeline.filter(s => s.time <= upto);
  const byPid = {}; procs.forEach(p => byPid[p.pid] = new Set());
  visible.forEach(s => byPid[s.pid].add(s.time));

  const maxTime = Math.max(...timeline.map(x=>x.time)) + 1;

  gantt.innerHTML = "";
  const header = document.createElement("div");
  header.className = "gantt-row";
  header.innerHTML =
    `<div class="gantt-label">t</div>` +
    Array.from({length:maxTime},(_,i)=>`<div class="gantt-cell">${i}</div>`).join("");
  gantt.appendChild(header);

  for (const p of procs) {
    const row = document.createElement("div");
    row.className = "gantt-row";
    const label = document.createElement("div");
    label.className = "gantt-label";
    label.textContent = `${p.name} (PID ${p.pid})`;
    row.appendChild(label);

    const times = byPid[p.pid];
    for (let t=0; t<maxTime; t++) {
      const cell = document.createElement("div");
      cell.className = "gantt-cell";
      if (times.has(t)) {
        cell.textContent = p.pid; // o p.name
        cell.title = `${p.name} (PID ${p.pid}) @ t=${t}`;
        cell.style.opacity = "1";
        cell.style.fontWeight = "600";
      } else {
        cell.style.opacity = ".25";
        cell.title = `t=${t}`;
      }
      row.appendChild(cell);
    }
    gantt.appendChild(row);
  }
}

// Métricas + tabla de eficiencia al finalizar
function renderFinalResults(timeline, procs) {
  const firstStart = new Map();
  const lastTime = new Map();
  timeline.forEach(s=>{
    if (!firstStart.has(s.pid)) firstStart.set(s.pid, s.time);
    lastTime.set(s.pid, s.time);
  });

  const rows = procs.map(p=>{
    const start = firstStart.get(p.pid);
    const finish = (lastTime.get(p.pid) ?? -1) + 1;
    const TAT = finish - p.arrival;
    const WT  = TAT - p.burst;
    const RT  = (start!=null ? start - p.arrival : 0);
    const Eff = p.burst / TAT; // eficiencia (0..1], más alto = mejor
    return { pid:p.pid, name:p.name, arrival:p.arrival, burst:p.burst, start, finish, WT, TAT, RT, Eff };
  });

  const avg = a=>a.reduce((x,y)=>x+y,0)/a.length;
  const avgWT = avg(rows.map(r=>r.WT));
  const avgTAT= avg(rows.map(r=>r.TAT));
  const avgRT = avg(rows.map(r=>r.RT));

  document.getElementById("metrics").innerHTML = `
    <div><strong>Métricas</strong></div>
    <div>Promedio Waiting Time: ${avgWT.toFixed(2)} u (≈ ${(avgWT*simUnitSec).toFixed(0)} s)</div>
    <div>Promedio Turnaround Time: ${avgTAT.toFixed(2)} u (≈ ${(avgTAT*simUnitSec).toFixed(0)} s)</div>
    <div>Promedio Response Time: ${avgRT.toFixed(2)} u (≈ ${(avgRT*simUnitSec).toFixed(0)} s)</div>
  `;

  const bestEff = Math.max(...rows.map(r=>r.Eff));
  const effDiv = document.getElementById("efficiency");
  effDiv.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>PID</th><th>Nombre</th><th>Llegada</th><th>CPU (u)</th>
          <th>Inicio</th><th>Fin</th>
          <th>WT</th><th>TAT</th><th>RT</th><th>Eficiencia (Burst/TAT)</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r=>`
          <tr class="${r.Eff===bestEff ? 'best' : ''}">
            <td>${r.pid}</td><td>${r.name}</td><td>${r.arrival}</td><td>${r.burst}</td>
            <td>${r.start}</td><td>${r.finish}</td>
            <td>${r.WT}</td><td>${r.TAT}</td><td>${r.RT}</td><td>${r.Eff.toFixed(2)}</td>
          </tr>`).join("")}
      </tbody>
    </table>
    <p><em>Se resalta el proceso con mayor eficiencia (más cercano a 1).</em></p>
  `;
}

// Historial + cola (hasta el tick visible)
function renderTickSidecars(history, readyQueues, upto) {
  const hDiv = document.getElementById("history");
  const h = history.filter(x=>x.time<=upto).map(x=>`t=${x.time} (≈${x.time*simUnitSec}s): ${x.action}`);
  hDiv.textContent = h.join("\n");

  const rqDiv = document.getElementById("ready-queues");
  const keys = Object.keys(readyQueues).map(k=>parseInt(k)).sort((a,b)=>a-b).filter(t=>t<=upto);
  const lines = keys.map(t=>`t=${t}: [${readyQueues[t].join(", ")}]`);
  rqDiv.textContent = lines.join("\n");
}

// Arranque/paro de animación
function startAnimatedSimulation() {
  const alg = document.getElementById("algorithm").value;
  const gq  = parseInt(document.getElementById("global-quantum").value) || 2;
  simUnitSec = parseInt(document.getElementById("unit-seconds").value) || 3;
  document.getElementById("unit-sec-label").textContent = String(simUnitSec);

  if (processes.length===0) { alert("Agrega procesos primero."); return; }

  const { procs, timeline, readyQueues, history } = buildSchedule(alg, gq);
  simTimeline = timeline; simProcs = procs; simReadyQueues = readyQueues; simHistory = history;

  simIndex = 0;
  document.getElementById("start-sim").disabled = true;
  document.getElementById("demo-data").disabled = true;

  renderGanttProgress(simTimeline, simProcs, -1);
  renderTickSidecars(simHistory, simReadyQueues, -1);

  const stepMs = simUnitSec * 1000;
  simTimer = setInterval(() => {
    const maxT = Math.max(...simTimeline.map(s=>s.time));
    if (simIndex > maxT) {
      clearInterval(simTimer); simTimer = null;
      renderFinalResults(simTimeline, simProcs);
      document.getElementById("start-sim").disabled = false;
      document.getElementById("demo-data").disabled = false;
      return;
    }
    renderGanttProgress(simTimeline, simProcs, simIndex);
    renderTickSidecars(simHistory, simReadyQueues, simIndex);
    simIndex++;
  }, stepMs);
}

function stopAnimatedSimulation() {
  if (simTimer) {
    clearInterval(simTimer);
    simTimer = null;
    document.getElementById("start-sim").disabled = false;
    document.getElementById("demo-data").disabled = false;
  }
}

// ========================================================
// Listeners principales
// ========================================================
document.getElementById("start-sim").addEventListener("click", startAnimatedSimulation);
document.getElementById("stop-sim").addEventListener("click", stopAnimatedSimulation);

// Inicial
renderProcessTable();
document.getElementById("unit-sec-label").textContent = "3";
