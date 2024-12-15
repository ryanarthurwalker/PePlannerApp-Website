// DOM Elements
const gameNameInput = document.getElementById("game-name-input");
const notesTextarea = document.getElementById("notes-textarea");
const equipmentTextarea = document.getElementById("equipment-textarea");
const objectiveTextarea = document.getElementById("objective-textarea");
const exportPdfBtn = document.getElementById("export-pdf-btn");
const courtContainer = document.getElementById("court-container");

// State history for Undo/Redo
let history = [];
let redoStack = [];

// Save the current state of the court
function saveState() {
    history.push(courtContainer.innerHTML);
    redoStack = [];
}

// Reinitialize draggable items after undo/redo
function reinitializeDraggable() {
    courtContainer.querySelectorAll(".draggable").forEach((item) => makeDraggable(item));
}

// Undo/Redo Functionality
document.getElementById("undo-btn").addEventListener("click", () => {
    if (history.length > 0) {
        redoStack.push(courtContainer.innerHTML);
        courtContainer.innerHTML = history.pop();
        reinitializeDraggable();
    }
});

document.getElementById("redo-btn").addEventListener("click", () => {
    if (redoStack.length > 0) {
        history.push(courtContainer.innerHTML);
        courtContainer.innerHTML = redoStack.pop();
        reinitializeDraggable();
    }
});

// Export to PDF
exportPdfBtn.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");
    const gameName = gameNameInput.value.trim() || "PE_Planner_Diagram";

    const addSection = (title, content, startY) => {
        doc.setFontSize(16);
        doc.text(title, 10, startY);
        doc.setFontSize(14);
        doc.text(content.trim() || "N/A", 10, startY + 10);
        return startY + 20;
    };

    let startY = addSection("Game Name:", gameName, 10);
    startY = addSection("Quick Notes:", notesTextarea.value, startY);
    startY = addSection("Equipment:", equipmentTextarea.value, startY);
    startY = addSection("Objective:", objectiveTextarea.value, startY);

    html2canvas(courtContainer).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        doc.addImage(imgData, "PNG", 10, startY, 190, (190 * canvas.height) / canvas.width);

        const footerX = 150, footerY = 287;
        doc.setFontSize(10);
        doc.text("created with ", footerX, footerY);
        doc.setTextColor(0, 0, 255);
        doc.textWithLink("peplanner.com", footerX + doc.getTextWidth("created with "), footerY, { url: "https://peplanner.com" });
        doc.save(`${gameName.replace(/\s+/g, "_")}.pdf`);
    });
});

// Make an element draggable
function makeDraggable(element) {
    let offsetX, offsetY;

    element.addEventListener("mousedown", (e) => {
        if (element.closest(".group") && !element.classList.contains("group")) return; // Ignore children in group
        e.preventDefault();

        const startX = e.clientX, startY = e.clientY;
        offsetX = element.offsetLeft;
        offsetY = element.offsetTop;

        const moveElement = (e) => {
            element.style.left = `${offsetX + e.clientX - startX}px`;
            element.style.top = `${offsetY + e.clientY - startY}px`;
        };

        const stopDragging = () => {
            document.removeEventListener("mousemove", moveElement);
            document.removeEventListener("mouseup", stopDragging);
            saveState();
        };

        document.addEventListener("mousemove", moveElement);
        document.addEventListener("mouseup", stopDragging);
    });
}

// Generic function to add draggable icons
function addDraggableIcon(iconId, imagePath) {
    document.getElementById(iconId).addEventListener("click", () => {
        const icon = document.createElement("div");
        icon.className = "draggable";
        icon.style.position = "absolute";
        icon.style.left = "100px";
        icon.style.top = "100px";

        const img = document.createElement("img");
        img.src = imagePath;
        img.style.width = "40px";
        img.style.height = "40px";
        img.style.pointerEvents = "none";

        icon.appendChild(img);
        courtContainer.appendChild(icon);
        makeDraggable(icon);
        saveState();
    });
}

// Add Icons
const icons = [
    { id: "icon-player", path: "assets/svg/player_icon.svg" },
    { id: "icon-cone", path: "assets/svg/low_profile_cone.svg" },
    { id: "icon-circle", path: "assets/svg/circle_icon.svg" },
    { id: "icon-square", path: "assets/svg/square_icon.svg" },
    { id: "icon-arrow-up", path: "assets/svg/arrow_sm_up_icon.svg" },
    { id: "icon-arrow-down", path: "assets/svg/arrow_sm_down_icon.svg" },
    { id: "icon-arrow-left", path: "assets/svg/arrow_sm_left_icon.svg" },
    { id: "icon-arrow-right", path: "assets/svg/arrow_sm_right_icon.svg" }
];

icons.forEach((icon) => addDraggableIcon(icon.id, icon.path));

// Grouping and Ungrouping
let selectedIcons = [];

document.addEventListener("click", (e) => {
    const target = e.target.closest(".draggable");
    if (!target) return;
    e.shiftKey || e.ctrlKey || e.metaKey
        ? toggleSelection(target)
        : (clearSelection(), toggleSelection(target));
});

function toggleSelection(icon) {
    icon.classList.toggle("selected");
    selectedIcons.includes(icon)
        ? selectedIcons.splice(selectedIcons.indexOf(icon), 1)
        : selectedIcons.push(icon);
}

function clearSelection() {
    document.querySelectorAll(".selected").forEach((icon) => icon.classList.remove("selected"));
    selectedIcons = [];
}

document.getElementById("group-btn").addEventListener("click", () => {
    if (selectedIcons.length < 2) return alert("Select at least two icons to group!");
    const group = document.createElement("div");
    group.className = "draggable group";
    group.style.position = "absolute";

    const bounds = getGroupBounds(selectedIcons);
    group.style.left = `${bounds.left}px`;
    group.style.top = `${bounds.top}px`;
    group.style.width = `${bounds.width}px`;
    group.style.height = `${bounds.height}px`;

    selectedIcons.forEach((icon) => {
        const xOffset = icon.offsetLeft - bounds.left;
        const yOffset = icon.offsetTop - bounds.top;
        icon.style.left = `${xOffset}px`;
        icon.style.top = `${yOffset}px`;
        icon.style.pointerEvents = "none";
        group.appendChild(icon);
    });

    courtContainer.appendChild(group);
    makeDraggable(group);
    clearSelection();
    saveState();
});

function getGroupBounds(icons) {
    const left = Math.min(...icons.map((icon) => icon.offsetLeft));
    const top = Math.min(...icons.map((icon) => icon.offsetTop));
    const right = Math.max(...icons.map((icon) => icon.offsetLeft + icon.offsetWidth));
    const bottom = Math.max(...icons.map((icon) => icon.offsetTop + icon.offsetHeight));
    return { left, top, width: right - left, height: bottom - top };
}

document.getElementById("ungroup-btn").addEventListener("click", () => {
    document.querySelectorAll(".group").forEach((group) => {
        [...group.children].forEach((child) => {
            child.style.left = `${group.offsetLeft + parseInt(child.style.left)}px`;
            child.style.top = `${group.offsetTop + parseInt(child.style.top)}px`;
            child.style.pointerEvents = "auto";
            courtContainer.appendChild(child);
            makeDraggable(child);
        });
        group.remove();
    });
    saveState();
});

// Align selected icons horizontally with even spacing
document.getElementById("align-horizontal-btn").addEventListener("click", () => {
    if (selectedIcons.length < 2) return alert("Select at least two icons to align!");

    // Sort icons by their current left position
    selectedIcons.sort((a, b) => a.offsetLeft - b.offsetLeft);

    const top = Math.min(...selectedIcons.map((icon) => icon.offsetTop)); // Align to top-most
    const spacing = 50; // Set horizontal spacing (adjust as needed)

    // Align each icon in a line horizontally
    selectedIcons.forEach((icon, index) => {
        icon.style.top = `${top}px`;
        icon.style.left = `${100 + index * spacing}px`; // Increment left position by spacing
    });

    saveState();
});

// Align selected icons vertically with even spacing
document.getElementById("align-vertical-btn").addEventListener("click", () => {
    if (selectedIcons.length < 2) return alert("Select at least two icons to align!");

    // Sort icons by their current top position
    selectedIcons.sort((a, b) => a.offsetTop - b.offsetTop);

    const left = Math.min(...selectedIcons.map((icon) => icon.offsetLeft)); // Align to left-most
    const spacing = 50; // Set vertical spacing (adjust as needed)

    // Align each icon in a line vertically
    selectedIcons.forEach((icon, index) => {
        icon.style.left = `${left}px`;
        icon.style.top = `${100 + index * spacing}px`; // Increment top position by spacing
    });

    saveState();
});