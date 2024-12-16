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

// Save and Reinitialize State Functions
function saveState() {
    history.push(courtContainer.innerHTML);
    redoStack = [];
}

function reinitializeDraggable() {
    courtContainer.querySelectorAll(".draggable").forEach((item) => makeDraggable(item));
}

// Undo/Redo Functions
function undoAction() {
    if (history.length > 0) {
        redoStack.push(courtContainer.innerHTML);
        courtContainer.innerHTML = history.pop();
        reinitializeDraggable();
    }
}

function redoAction() {
    if (redoStack.length > 0) {
        history.push(courtContainer.innerHTML);
        courtContainer.innerHTML = redoStack.pop();
        reinitializeDraggable();
    }
}

document.getElementById("undo-btn").addEventListener("click", undoAction);
document.getElementById("redo-btn").addEventListener("click", redoAction);

exportPdfBtn.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");
    const gameName = gameNameInput.value.trim() || "PE_Planner_Diagram";

    // Function to add a bolded section header and its content
    const addSection = (title, content, startY) => {
        doc.setFont("helvetica", "bold"); // Set font to bold for headers
        doc.setFontSize(16);
        doc.text(title, 10, startY);
        
        doc.setFont("helvetica", "normal"); // Reset font to normal for content
        doc.setFontSize(14);
        doc.text(content.trim() || "N/A", 10, startY + 10);
        
        return startY + 20; // Adjust for spacing
    };

    // Start building the PDF
    let startY = 10;
    startY = addSection("Game Name:", gameName, startY);
    startY = addSection("Quick Notes:", notesTextarea.value, startY);
    startY = addSection("Equipment:", equipmentTextarea.value, startY);
    startY = addSection("Objective:", objectiveTextarea.value, startY);

    // Add Court Diagram
    html2canvas(courtContainer).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const imgHeight = (190 * canvas.height) / canvas.width;

        doc.addImage(imgData, "PNG", 10, startY, 190, imgHeight);

        // Add Footer with Hyperlink
        const footerX = 150, footerY = 287;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text("created with ", footerX, footerY);
        doc.setTextColor(0, 0, 255);
        doc.textWithLink("peplanner.com", footerX + doc.getTextWidth("created with "), footerY, { url: "https://peplanner.com" });

        doc.save(`${gameName.replace(/\s+/g, "_")}.pdf`);
    });
});

// Draggable Functionality
function makeDraggable(element) {
    let offsetX, offsetY;

    element.addEventListener("mousedown", (e) => {
        if (element.closest(".group") && !element.classList.contains("group")) return; // Ignore children in group

        const startX = e.clientX, startY = e.clientY;
        offsetX = element.offsetLeft;
        offsetY = element.offsetTop;

        const moveElement = (e) => {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            element.style.left = `${offsetX + deltaX}px`;
            element.style.top = `${offsetY + deltaY}px`;
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

// Generic Icon Addition
function addDraggableIcon(iconId, imagePath) {
    document.getElementById(iconId).addEventListener("click", () => {
        const icon = document.createElement("div");
        icon.className = "draggable";
        icon.style.position = "absolute";
        icon.style.left = "100px";
        icon.style.top = "100px";
        icon.style.width = "30px"; // Standardize width
        icon.style.height = "30px"; // Standardize height

        const img = document.createElement("img");
        img.src = imagePath;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain"; // Prevent distortion
        img.style.pointerEvents = "none";

        icon.appendChild(img);
        courtContainer.appendChild(icon);
        makeDraggable(icon);
        saveState();
    });
}

// Add Icons (First and Second Row)
[
    // First Row Icons
    { id: "icon-player", path: "assets/svg/player_icon.svg" },
    { id: "icon-cone", path: "assets/svg/low_profile_cone.svg" },
    { id: "icon-circle", path: "assets/svg/circle_icon.svg" },
    { id: "icon-square", path: "assets/svg/square_icon.svg" },
    { id: "icon-arrow-up", path: "assets/svg/arrow_sm_up_icon.svg" },
    { id: "icon-arrow-down", path: "assets/svg/arrow_sm_down_icon.svg" },
    { id: "icon-arrow-left", path: "assets/svg/arrow_sm_left_icon.svg" },
    { id: "icon-arrow-right", path: "assets/svg/arrow_sm_right_icon.svg" },
    
    // Second Row Icons
    { id: "icon-frisbee", path: "assets/svg/frisbee_icon.svg" },
    { id: "icon-tennis", path: "assets/svg/tennis_ball_icon.svg" },
    { id: "icon-badminton", path: "assets/svg/badminton_icon.svg" },
    { id: "icon-volleyball", path: "assets/svg/volleyball_icon.svg" },
    { id: "icon-baseball", path: "assets/svg/baseball_icon.svg" },
    { id: "icon-football", path: "assets/svg/american_football_icon.svg" },
    { id: "icon-soccer", path: "assets/svg/football_icon.svg" },
    { id: "icon-basketball", path: "assets/svg/basketball_icon.svg" }
].forEach((icon) => addDraggableIcon(icon.id, icon.path));

// Selection and Grouping
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

// Clear Court
document.getElementById("clear-court").addEventListener("click", () => {
    saveState();
    courtContainer.querySelectorAll(".draggable").forEach((item) => item.remove());
});

// Align Horizontally
document.getElementById("align-horizontal-btn").addEventListener("click", () => {
    if (selectedIcons.length < 2) {
        alert("Select at least two icons to align!");
        return;
    }

    // Get the top-most position
    const top = Math.min(...selectedIcons.map((icon) => {
        const parent = icon.closest(".group") || icon;
        return parent.offsetTop;
    }));

    // Set a fixed spacing value between icons
    const spacing = 40; // Adjust for desired spacing between items

    // Sort icons by left position and align
    selectedIcons.sort((a, b) => (a.closest(".group") || a).offsetLeft - (b.closest(".group") || b).offsetLeft);

    selectedIcons.forEach((icon, index) => {
        const parent = icon.closest(".group") || icon;
        parent.style.top = `${top}px`;
        parent.style.left = `${index * spacing}px`; // Set horizontal spacing
    });

    saveState();
});

// Align Vertically
document.getElementById("align-vertical-btn").addEventListener("click", () => {
    if (selectedIcons.length < 2) {
        alert("Select at least two icons to align!");
        return;
    }

    // Get the left-most position
    const left = Math.min(...selectedIcons.map((icon) => {
        const parent = icon.closest(".group") || icon;
        return parent.offsetLeft;
    }));

    // Set a fixed spacing value between icons
    const spacing = 40; // Adjust for desired spacing between items

    // Sort icons by top position and align
    selectedIcons.sort((a, b) => (a.closest(".group") || a).offsetTop - (b.closest(".group") || b).offsetTop);

    selectedIcons.forEach((icon, index) => {
        const parent = icon.closest(".group") || icon;
        parent.style.left = `${left}px`;
        parent.style.top = `${index * spacing}px`; // Set vertical spacing
    });

    saveState();
});

