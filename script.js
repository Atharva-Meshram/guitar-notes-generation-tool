const notes = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

const stringStart = {
  "E": 4, "B": 11, "G": 7, "D": 2, "A": 9, "E6": 4
};

function getNote(string, fret) {
  return notes[(stringStart[string] + fret) % 12];
}

// 🔥 MAIN GENERATE FUNCTION
function generate() {

  const title = document.getElementById("song-title").value;
  const scaleNote = document.getElementById("scale-note").value;
  const scaleType = document.getElementById("scale-type").value;
  const blocks = document.querySelectorAll(".line-block");

  let linesHTML = "";
  let visibleIndex = 0;
  let hasAnyContent = false;

  blocks.forEach((block) => {

    // 🔁 HANDLE REPEAT BLOCK
    if (block.classList.contains("repeat-block")) {

      const inputEl = block.querySelector(".repeat-input");
      const value = inputEl.value;

      if (!value.trim()) return;

      // 🚫 STOP if error exists
      const errorEl = inputEl.nextElementSibling;
      if (errorEl && errorEl.textContent.trim() !== "") {
        return; // ❌ don't render invalid repeat
      }

      const numbers = value
      .split(",")
      .map(n => parseInt(n.trim()))
      .filter(n => !isNaN(n));

      let repeatHTML = numbers.map(num => `
        <div class="circle repeat">${num}</div>
      `).join("");

      linesHTML += `
        <div class="output-line repeat-line">
          <div class="repeat-container">
            ${repeatHTML}
          </div>
        </div>
      `;

      return;
    }

    const rawLyrics = block.querySelector(".lyrics").value;
    const input = block.querySelector(".tabs").value;

    // Skip completely empty blocks
    if (!rawLyrics.trim() && !input.trim()) return;

    hasAnyContent = true;
    visibleIndex++;

    const lyrics = rawLyrics.replace(/\n/g, "<br>");

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
          <div class="circle">${visibleIndex}</div>
          <div class="lyrics-text">${lyrics}</div>
        </div>
        <div class="full-line">
          ${tabHTML}
        </div>
      </div>
    `;
  });

  // ✅ If nothing entered → show placeholder
  if (!hasAnyContent) {
    linesHTML = `
      <div class="output-line">
        <div class="header">
          <div class="circle">1</div>
          <div class="lyrics-text" style="opacity:0.5;">
            (Your preview will appear here)
          </div>
        </div>
      </div>
    `;
  }

  const bpm = document.getElementById("bpm").value;
  const beat = document.getElementById("beat-type").value;

  const headerHTML = `
  <div class="page-header">

    <div class="badge-container">

      <div class="tempo-info">
        ${bpm ? `<div><strong>BPM:</strong> ${bpm}</div>` : ""}
        ${beat ? `<div><strong>Beat:</strong> ${beat}</div>` : ""}
      </div>

      <div class="scale-badge">
        <div class="badge-note">${scaleNote || ""}</div>
        <div class="badge-type">${(scaleType || "").toUpperCase()}</div>
        <div class="badge-text">Scale</div>
      </div>

    </div>

    <div class="song-title">${title || ""}</div>

  </div>
`;

  paginate(headerHTML, linesHTML);
}

// 🔥 PAGINATION SYSTEM
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

      current = createPage(""); // next pages no header
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
}

// 🔧 Create page
function createPage(headerHTML) {
  const page = document.createElement("div");
  page.className = "page";
  page.innerHTML = headerHTML + `<div class="page-content"></div>`;
  return page;
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
      <button onclick="addRepeatBlock(this)">🔁 Add Repeat</button>
      <button onclick="deleteLine(this)">🗑 Delete</button>
    </div>
  `;

  return div;
}

function addLineBelow(btn) {
  btn.closest(".line-block").after(createLineBlock());
  generate();
}

function deleteLine(btn) {
  const container = document.getElementById("lines-container");

  if (container.children.length === 1) {
    alert("At least one line required");
    return;
  }

  btn.closest(".line-block").remove();
  generate();
}

// 🔄 AUTO UPDATE
document.addEventListener("input", generate);

// 📥 DOWNLOAD MODAL
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

// 📸 IMAGE DOWNLOAD
function downloadPages(title) {

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

// 📄 PDF DOWNLOAD
function downloadPDF(title) {

  const pages = document.querySelectorAll(".page");
  const pdf = new jspdf.jsPDF("p", "pt", "a4");

  let count = 0;

  pages.forEach((page, index) => {

    html2canvas(page).then(canvas => {

      if (index > 0) pdf.addPage();

      pdf.addImage(canvas.toDataURL(), "PNG", 0, 0, 595, 842);

      count++;

      if (count === pages.length) {
        pdf.save(`${title}-notes.pdf`);
      }
    });
  });
}

function createRepeatBlock() {
  const div = document.createElement("div");
  div.className = "line-block repeat-block";

  div.innerHTML = `
    <input class="repeat-input" placeholder="Enter line numbers (e.g. 1,2)">
    
    <div class="line-controls">
      <button onclick="addLineBelow(this)">➕ Add Below</button>
      <button onclick="deleteLine(this)">🗑 Delete</button>
    </div>
  `;

  // ✅ ADD THIS PART HERE
  const input = div.querySelector(".repeat-input");

  input.addEventListener("input", () => {

    const allBlocks = [...document.querySelectorAll(".line-block")];

    const currentIndex = allBlocks.indexOf(div) + 1;

    const totalLines = allBlocks.filter(b => !b.classList.contains("repeat-block")).length;

    validateRepeatInput(input, currentIndex, totalLines);
  });

  return div;
}

function addRepeatBlock(btn) {
  btn.closest(".line-block").after(createRepeatBlock());
}

// 📱 MOBILE TOGGLE
function showPreview() {
  document.querySelector(".app").classList.add("preview-mode");
}

function showEditor() {
  document.querySelector(".app").classList.remove("preview-mode");
}

function validateRepeatInput(inputEl, currentIndex, maxIndex) {

  const values = inputEl.value.split(",").map(v => parseInt(v.trim()));

  let error = "";

  for (let val of values) {

    if (!val) continue;

    if (val > maxIndex) {
      error = "Line doesn't exist";
      break;
    }

    if (val >= currentIndex) {
      error = "Use of future line";
      break;
    }
  }

  if (!error) {
    showError(inputEl, "");
  } else {
    showError(inputEl, error);
  }
}

function showError(inputEl, message) {

  let errorEl = inputEl.nextElementSibling;

  if (!errorEl || !errorEl.classList.contains("error-text")) {
    errorEl = document.createElement("div");
    errorEl.className = "error-text";
    inputEl.after(errorEl);
  }

  errorEl.textContent = message;
}

// 🚀 INITIAL LOAD
window.addEventListener("DOMContentLoaded", generate);