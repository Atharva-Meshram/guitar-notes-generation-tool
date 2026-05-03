const notes = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

const stringStart = {
  "E": 4, "B": 11, "G": 7, "D": 2, "A": 9, "E6": 4
};

function getNote(string, fret) {
  return notes[(stringStart[string] + fret) % 12];
}

// 🔥 MAIN GENERATE
function generate() {

  const title = document.getElementById("song-title").value;
  const scaleNote = document.getElementById("scale-note").value;
  const scaleType = document.getElementById("scale-type").value;
  const blocks = document.querySelectorAll(".line-block");

  let linesHTML = "";

  blocks.forEach((block, index) => {

    const lyrics = block.querySelector(".lyrics").value.replace(/\n/g, "<br>");
    const input = block.querySelector(".tabs").value;

    const matches = [...input.matchAll(/([A-Z])\((.*?)\)/g)];

    let tabHTML = "";

    matches.forEach(match => {
      const string = match[1];
      const frets = match[2].split("-").map(Number);

      let cols = "";

      frets.forEach(f => {
        cols += `
          <div class="column">
            <div class="fret">${f}</div>
            <div class="arrow">↑</div>
            <div class="note">${getNote(string, f)}</div>
          </div>
        `;
      });

      tabHTML += `
        <div class="group">
          <span class="string">${string}(</span>
          <div class="line">${cols}</div>
          <span class="string">)</span>
        </div>
      `;
    });

    linesHTML += `
      <div class="output-line">
        <div class="header">
          <div class="circle">${index + 1}</div>
          <div class="lyrics-text">${lyrics}</div>
        </div>

        <div class="full-line">
          ${tabHTML}
        </div>
      </div>
    `;
  });

  const headerHTML = `
    <div class="page-header">
      <div class="badge-container">
        <div class="scale-badge">
          <div class="badge-note">${scaleNote}</div>
          <div class="badge-type">${scaleType.toUpperCase()}</div>
          <div class="badge-text">Scale</div>
        </div>
      </div>
      <div class="song-title">${title}</div>
    </div>
  `;

  paginate(headerHTML, linesHTML);
}

// 🔥 PAGINATION (ROBUST)
function paginate(headerHTML, linesHTML) {

  const PAGE_HEIGHT = 1122;

  const measure = document.createElement("div");
  measure.className = "page";
  measure.style.visibility = "hidden";
  measure.style.position = "absolute";
  measure.style.top = "-9999px";

  document.body.appendChild(measure);

  let pages = [];
  let current = createPage(headerHTML);

  measure.innerHTML = current.innerHTML;

  const temp = document.createElement("div");
  temp.innerHTML = linesHTML;

  const lines = [...temp.children];

  lines.forEach(line => {

    const test = line.cloneNode(true);

    measure.querySelector(".page-content").appendChild(test);

    if (measure.scrollHeight > PAGE_HEIGHT) {

      measure.querySelector(".page-content").removeChild(test);
      pages.push(current);

      current = createPage(""); // no header next pages
      measure.innerHTML = current.innerHTML;

      current.querySelector(".page-content").appendChild(line);
      measure.querySelector(".page-content").appendChild(test);

    } else {
      current.querySelector(".page-content").appendChild(line);
    }
  });

  pages.push(current);
  document.body.removeChild(measure);

  const output = document.getElementById("output");
  output.innerHTML = "";
  pages.forEach(p => output.appendChild(p));

  // drawConnectors();
}

// 🔧 Create page
function createPage(headerHTML) {
  const page = document.createElement("div");
  page.className = "page";
  page.innerHTML = headerHTML + `<div class="page-content"></div>`;
  return page;
}

// 🔥 CONNECTOR ENGINE
function drawConnectors() {

  document.querySelectorAll(".page").forEach(page => {

    const svgOld = page.querySelector("svg");
    if (svgOld) svgOld.remove();

    const svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
    svg.style.position = "absolute";
    svg.style.top = 0;
    svg.style.left = 0;
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.pointerEvents = "none";

    page.appendChild(svg);

    const pRect = page.getBoundingClientRect();

    page.querySelectorAll(".output-line").forEach(line => {

      const c = line.querySelector(".circle");
      const t = line.querySelector(".full-line");

      if (!c || !t) return;

      const cr = c.getBoundingClientRect();
      const tr = t.getBoundingClientRect();

      const x1 = cr.left + cr.width/2 - pRect.left;
      const y1 = cr.bottom - pRect.top;

      const x2 = tr.left - pRect.left;
      const y2 = tr.top - pRect.top + tr.height/2;

      const path = document.createElementNS("http://www.w3.org/2000/svg","path");

      path.setAttribute("d", `M ${x1} ${y1} L ${x1} ${y2} L ${x2} ${y2}`);
      path.setAttribute("stroke","black");
      path.setAttribute("fill","none");
      path.setAttribute("stroke-width","2");

      svg.appendChild(path);
    });
  });
}

// ➕ LINE CONTROLS
function createLineBlock() {
  const div = document.createElement("div");
  div.className = "line-block";

  div.innerHTML = `
    <textarea class="lyrics" placeholder="Lyrics"></textarea>
    <textarea class="tabs" placeholder="Tabs e.g. B(1-2-3)"></textarea>

    <div class="line-controls">
      <button onclick="addLineBelow(this)">➕ Add</button>
      <button onclick="deleteLine(this)">🗑 Delete</button>
    </div>
  `;

  return div;
}

function addLineBelow(btn){
  btn.closest(".line-block").after(createLineBlock());
  generate();
}

function deleteLine(btn){
  const container = document.getElementById("lines-container");
  if(container.children.length === 1) return alert("At least one line required");
  btn.closest(".line-block").remove();
  generate();
}

// 🔄 AUTO UPDATE
document.addEventListener("input", generate);

// 📥 DOWNLOAD
function downloadOptions() {
  document.getElementById("download-modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("download-modal").classList.add("hidden");
}

function confirmDownload() {

  const selected = document.querySelector('input[name="download-type"]:checked').value;
  const title = document.getElementById("song-title").value || "guitar";

  if (selected === "img") {
    downloadPages(title);
  } else {
    downloadPDF(title);
  }

  closeModal();
}

function downloadPages(title){

  const pages = document.querySelectorAll(".page");

  pages.forEach((page, index) => {

    html2canvas(page).then(canvas => {

      const link = document.createElement("a");
      link.download = `${title}-notes-page-${index + 1}.png`;
      link.href = canvas.toDataURL();
      link.click();

    });

  });
}

function downloadPDF(title){

  const pages = document.querySelectorAll(".page");
  const pdf = new jspdf.jsPDF("p","pt","a4");

  let count = 0;

  pages.forEach((page, index) => {

    html2canvas(page).then(canvas => {

      if(index > 0) pdf.addPage();

      pdf.addImage(canvas.toDataURL(),"PNG",0,0,595,842);

      count++;

      if(count === pages.length){
        pdf.save(`${title}-notes.pdf`);
      }

    });

  });
}

function showPreview() {
  document.querySelector(".app").classList.add("preview-mode");
}

function showEditor() {
  document.querySelector(".app").classList.remove("preview-mode");
}

// 🚀 INITIAL LOAD
generate();

window.onload = generate;