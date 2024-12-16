// DOM Elements
const elements = {
    gameNameInput: document.getElementById("game-name-input"),
    notesTextarea: document.getElementById("notes-textarea"),
    equipmentTextarea: document.getElementById("equipment-textarea"),
    objectiveTextarea: document.getElementById("objective-textarea"),
    exportPdfBtn: document.getElementById("export-pdf-btn"),
    courtContainer: document.getElementById("court-container"),
    undoBtn: document.getElementById("undo-btn"),
    redoBtn: document.getElementById("redo-btn"),
    clearBtn: document.getElementById("clear-court"),
    groupBtn: document.getElementById("group-btn"),
    ungroupBtn: document.getElementById("ungroup-btn"),
    alignHorizontalBtn: document.getElementById("align-horizontal-btn"),
    alignVerticalBtn: document.getElementById("align-vertical-btn"),
    gridToggleBtn: document.getElementById("toggle-grid-btn"),
    gridSizeSelect: document.getElementById("grid-size")
};

// State for Undo/Redo and Grid
let history = [], redoStack = [], selectedIcons = [], gridActive = false, gridSize = 20;

// === State Management ===
function saveState() {
    history.push(elements.courtContainer.innerHTML);
    redoStack = [];
}

function undoAction() {
    if (history.length > 0) {
        redoStack.push(elements.courtContainer.innerHTML);
        elements.courtContainer.innerHTML = history.pop();
        reinitializeDraggable();
    }
}

function redoAction() {
    if (redoStack.length > 0) {
        history.push(elements.courtContainer.innerHTML);
        elements.courtContainer.innerHTML = redoStack.pop();
        reinitializeDraggable();
    }
}

// === PDF Export ===
elements.exportPdfBtn.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");

    const addSection = (title, content, y) => {
        doc.setFont("helvetica", "bold").setFontSize(16).text(title, 10, y);
        doc.setFont("helvetica", "normal").setFontSize(14).text(content.trim() || "N/A", 10, y + 10);
        return y + 20;
    };

    let y = 10;
    y = addSection("Game Name:", elements.gameNameInput.value.trim(), y);
    y = addSection("Quick Notes:", elements.notesTextarea.value, y);
    y = addSection("Equipment:", elements.equipmentTextarea.value, y);
    y = addSection("Objective:", elements.objectiveTextarea.value, y);

    html2canvas(elements.courtContainer).then((canvas) => {
        doc.addImage(canvas.toDataURL("image/png"), "PNG", 10, y, 190, (canvas.height * 190) / canvas.width);
        doc.setFontSize(10).setTextColor(0, 0, 0).text("created with ", 150, 287);
        doc.setTextColor(0, 0, 255).textWithLink("peplanner.com", 165, 287, { url: "https://peplanner.com" });
        doc.save("PE_Planner_Diagram.pdf");
    });
});

// === Dragging and Grid Snap ===
function snapToGrid(element) {
    const left = Math.round(parseInt(element.style.left) / gridSize) * gridSize;
    const top = Math.round(parseInt(element.style.top) / gridSize) * gridSize;
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
}

function makeDraggable(element) {
    let offsetX, offsetY;

    element.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const startX = e.clientX, startY = e.clientY;
        offsetX = element.offsetLeft, offsetY = element.offsetTop;

        const moveElement = (e) => {
            element.style.left = `${offsetX + e.clientX - startX}px`;
            element.style.top = `${offsetY + e.clientY - startY}px`;
        };

        const stopDragging = () => {
            document.removeEventListener("mousemove", moveElement);
            document.removeEventListener("mouseup", stopDragging);
            if (gridActive) snapToGrid(element);
            saveState();
        };

        document.addEventListener("mousemove", moveElement);
        document.addEventListener("mouseup", stopDragging);
    });
}

function reinitializeDraggable() {
    elements.courtContainer.querySelectorAll(".draggable").forEach(makeDraggable);
}

// === Icon Management ===
function addDraggableIcon(iconId, imagePath) {
    document.getElementById(iconId).addEventListener("click", () => {
        const icon = document.createElement("div");
        icon.className = "draggable";
        Object.assign(icon.style, { position: "absolute", left: "100px", top: "100px", width: "30px", height: "30px" });
        icon.innerHTML = `<img src="${imagePath}" style="width: 100%; height: 100%; object-fit: contain; pointer-events: none;">`;

        elements.courtContainer.appendChild(icon);
        makeDraggable(icon);
        saveState();
    });
}

const icons = [
    { id: "icon-player", path: "assets/svg/player_icon.svg" },
    { id: "icon-cone", path: "assets/svg/low_profile_cone.svg" },
    { id: "icon-circle", path: "assets/svg/circle_icon.svg" },
    { id: "icon-square", path: "assets/svg/square_icon.svg" },
    { id: "icon-arrow-up", path: "assets/svg/arrow_sm_up_icon.svg" },
    { id: "icon-arrow-down", path: "assets/svg/arrow_sm_down_icon.svg" },
    { id: "icon-arrow-left", path: "assets/svg/arrow_sm_left_icon.svg" },
    { id: "icon-arrow-right", path: "assets/svg/arrow_sm_right_icon.svg" },
    { id: "icon-frisbee", path: "assets/svg/frisbee_icon.svg" },
    { id: "icon-tennis", path: "assets/svg/tennis_ball_icon.svg" },
    { id: "icon-badminton", path: "assets/svg/badminton_icon.svg" },
    { id: "icon-volleyball", path: "assets/svg/volleyball_icon.svg" },
    { id: "icon-baseball", path: "assets/svg/baseball_icon.svg" },
    { id: "icon-football", path: "assets/svg/american_football_icon.svg" },
    { id: "icon-soccer", path: "assets/svg/football_icon.svg" },
    { id: "icon-basketball", path: "assets/svg/basketball_icon.svg" }
];
icons.forEach((icon) => addDraggableIcon(icon.id, icon.path));

// === Grid Management ===
elements.gridToggleBtn.addEventListener("click", () => {
    gridActive = !gridActive; // Toggle grid state
    elements.courtContainer.classList.toggle("grid-active", gridActive); // Apply grid class
    elements.gridToggleBtn.textContent = gridActive ? "Disable Grid Snap" : "Enable Grid Snap";

    if (gridActive) {
        // Set grid size when enabled
        elements.courtContainer.style.backgroundSize = `${gridSize}px ${gridSize}px`;
    } else {
        // Reset grid styling when disabled
        elements.courtContainer.style.backgroundSize = "";
        elements.courtContainer.style.backgroundImage = "";
    }
});

elements.gridSizeSelect.addEventListener("change", (e) => {
    gridSize = parseInt(e.target.value, 10); // Update grid size
    if (gridActive) {
        // Update grid size dynamically if grid is active
        elements.courtContainer.style.backgroundSize = `${gridSize}px ${gridSize}px`;
    }
});
// === Undo/Redo and Clear Actions ===
elements.undoBtn.addEventListener("click", undoAction);
elements.redoBtn.addEventListener("click", redoAction);
elements.clearBtn.addEventListener("click", () => {
    saveState();
    elements.courtContainer.innerHTML = "";
});