// DOM Elements
const elements = {
    gameNameInput: document.getElementById("game-name-input"),
    notesTextarea: document.getElementById("notes-textarea"),
    equipmentTextarea: document.getElementById("equipment-textarea"),
    objectiveTextarea: document.getElementById("objective-textarea"),
    modificationsTextarea: document.getElementById("modifications-textarea"),
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
// === PDF Export ===
elements.exportPdfBtn.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");

    const addSection = (title, content, y) => {
        if (content.trim()) {
            doc.setFont("helvetica", "bold").setFontSize(16).text(title, 10, y);
            const contentLines = doc.splitTextToSize(content.trim(), 180); // Wrap text to 180mm width
            const lineHeight = 7; // Line height in mm
            let currentY = y + 10;

            contentLines.forEach((line) => {
                if (currentY + lineHeight > 280) {
                    doc.addPage();
                    currentY = 20;
                }
                doc.setFont("helvetica", "normal").setFontSize(14).text(line, 10, currentY);
                currentY += lineHeight;
            });

            return currentY + 10;
        }
        return y;
    };

    let y = 10;

    y = addSection("Game Name:", elements.gameNameInput.value.trim(), y);
    y = addSection("Quick Notes:", elements.notesTextarea.value.trim(), y);
    y = addSection("Equipment:", elements.equipmentTextarea.value.trim(), y);
    y = addSection("Objective:", elements.objectiveTextarea.value.trim(), y);
    y = addSection("Modifications:", elements.modificationsTextarea.value.trim(), y);

    const fileName = elements.gameNameInput.value.trim() || "PE_Planner_Diagram";

    const selectedElements = document.querySelectorAll(".selected");
    selectedElements.forEach((el) => el.classList.remove("selected"));

    if (elements.courtContainer.innerHTML.trim()) {
        html2canvas(elements.courtContainer, { backgroundColor: "#ffffff" }).then((canvas) => {
            selectedElements.forEach((el) => el.classList.add("selected"));

            const imgData = canvas.toDataURL("image/png");
            const imgWidth = 190;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            doc.addImage(imgData, "PNG", 10, y, imgWidth, imgHeight);

            // Static Footer Text
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text("Created with peplanner.com", 10, 287);

            doc.save(`${fileName.replace(/\s+/g, "_")}.pdf`);
        });
    }
});

// Snap Elements to Grid (Center Alignment)
function snapToGrid(element, gridSize) {
    const rect = element.getBoundingClientRect(); // Get the dimensions of the element
    const parentRect = element.parentElement.getBoundingClientRect(); // Get parent container dimensions

    // Calculate the element's center relative to the parent
    const centerX = rect.left - parentRect.left + rect.width / 2;
    const centerY = rect.top - parentRect.top + rect.height / 2;

    // Calculate the new snapped position
    const snappedCenterX = Math.round(centerX / gridSize) * gridSize;
    const snappedCenterY = Math.round(centerY / gridSize) * gridSize;

    // Adjust the top-left position to align the center with the grid
    const newLeft = snappedCenterX - rect.width / 2;
    const newTop = snappedCenterY - rect.height / 2;

    // Apply the new position
    element.style.left = `${newLeft}px`;
    element.style.top = `${newTop}px`;
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
        
            if (gridActive) {
                const gridSize = parseInt(elements.gridSizeSelect.value, 10);
                snapToGrid(element, gridSize); // Snap to grid with center alignment
            }
            saveState(); // Save state for undo/redo
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

// === Grouping and Ungrouping ===
elements.groupBtn.addEventListener("click", () => {
    if (selectedIcons.length < 2) {
        alert("Select at least two icons to group!");
        return;
    }

    const group = document.createElement("div");
    group.className = "draggable group";
    Object.assign(group.style, {
        position: "absolute",
        border: "2px dashed blue" // Visual indicator for grouping
    });

    // Calculate group bounds
    const bounds = getGroupBounds(selectedIcons);
    Object.assign(group.style, {
        left: `${bounds.left}px`,
        top: `${bounds.top}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`
    });

    // Move selected icons into the group
    selectedIcons.forEach((icon) => {
        const xOffset = icon.offsetLeft - bounds.left;
        const yOffset = icon.offsetTop - bounds.top;
        Object.assign(icon.style, {
            left: `${xOffset}px`,
            top: `${yOffset}px`,
            pointerEvents: "none" // Disable interactions with individual items
        });
        group.appendChild(icon);
    });

    elements.courtContainer.appendChild(group);
    makeDraggable(group); // Make the group draggable
    clearSelection(); // Clear the selection state
    saveState(); // Save the state
});

elements.ungroupBtn.addEventListener("click", () => {
    const groups = elements.courtContainer.querySelectorAll(".group");
    groups.forEach((group) => {
        const children = [group.children];
        children.forEach((child) => {
            Object.assign(child.style, {
                left: `${group.offsetLeft + parseInt(child.style.left, 10)}px`,
                top: `${group.offsetTop + parseInt(child.style.top, 10)}px`,
                pointerEvents: "auto" // Re-enable interactions
            });
            elements.courtContainer.appendChild(child);
            makeDraggable(child);
        });
        group.remove();
    });
    saveState();
});

// Utility function to calculate bounds for a group
function getGroupBounds(icons) {
    const left = Math.min(icons.map((icon) => icon.offsetLeft));
    const top = Math.min(icons.map((icon) => icon.offsetTop));
    const right = Math.max(icons.map((icon) => icon.offsetLeft + icon.offsetWidth));
    const bottom = Math.max(icons.map((icon) => icon.offsetTop + icon.offsetHeight));
    return { left, top, width: right - left, height: bottom - top };
}

// Selection management
function toggleSelection(icon) {
    icon.classList.toggle("selected");
    if (selectedIcons.includes(icon)) {
        selectedIcons = selectedIcons.filter((item) => item !== icon);
    } else {
        selectedIcons.push(icon);
    }
}

function clearSelection() {
    selectedIcons.forEach((icon) => icon.classList.remove("selected"));
    selectedIcons = [];
}

// Add event listeners for selecting icons
elements.courtContainer.addEventListener("click", (e) => {
    const target = e.target.closest(".draggable");
    if (!target || target.classList.contains("group")) return;

    if (e.shiftKey || e.ctrlKey || e.metaKey) {
        toggleSelection(target);
    } else {
        clearSelection();
        toggleSelection(target);
    }
});

// === Align Horizontally ===
elements.alignHorizontalBtn.addEventListener("click", () => {
    if (selectedIcons.length < 2) {
        alert("Select at least two icons to align!");
        return;
    }

    // Find the top-most position among selected items
    const top = Math.min(selectedIcons.map((icon) => {
        const parent = icon.closest(".group") || icon;
        return parent.offsetTop;
    }));

    // Calculate spacing between icons
    const sortedIcons = selectedIcons.slice().sort((a, b) => {
        const parentA = a.closest(".group") || a;
        const parentB = b.closest(".group") || b;
        return parentA.offsetLeft - parentB.offsetLeft;
    });

    const spacing = 40; // Fixed spacing value (adjustable)

    // Align icons horizontally
    sortedIcons.forEach((icon, index) => {
        const parent = icon.closest(".group") || icon;
        parent.style.top = `${top}px`;
        parent.style.left = `${index * spacing}px`; // Set horizontal spacing
    });

    saveState();
});

// === Align Vertically ===
elements.alignVerticalBtn.addEventListener("click", () => {
    if (selectedIcons.length < 2) {
        alert("Select at least two icons to align!");
        return;
    }

    // Find the left-most position among selected items
    const left = Math.min(selectedIcons.map((icon) => {
        const parent = icon.closest(".group") || icon;
        return parent.offsetLeft;
    }));

    // Calculate spacing between icons
    const sortedIcons = selectedIcons.slice().sort((a, b) => {
        const parentA = a.closest(".group") || a;
        const parentB = b.closest(".group") || b;
        return parentA.offsetTop - parentB.offsetTop;
    });

    const spacing = 40; // Fixed spacing value (adjustable)

    // Align icons vertically
    sortedIcons.forEach((icon, index) => {
        const parent = icon.closest(".group") || icon;
        parent.style.left = `${left}px`;
        parent.style.top = `${index * spacing}px`; // Set vertical spacing
    });

    saveState();
});

function exportAsJSON() {
    const gameName = elements.gameNameInput.value.trim() || "court_diagram";

    // Collect rectangle (court-wrapper) data
    const rectangle = elements.courtContainer.querySelector("#canvas-wrapper");
    const rectangleData = {
        type: "rectangle",
        left: rectangle.offsetLeft,
        top: rectangle.offsetTop,
        width: rectangle.offsetWidth,
        height: rectangle.offsetHeight,
        backgroundColor: rectangle.style.backgroundColor || "transparent",
        borderColor: rectangle.style.borderColor || "black",
        borderWidth: rectangle.style.borderWidth || "2px",
    };

    // Collect draggable icons data
    const iconsData = [elements.courtContainer.querySelectorAll(".draggable")].map((icon) => {
        const rect = icon.getBoundingClientRect();
        const parentRect = elements.courtContainer.getBoundingClientRect();

        return {
            type: "icon",
            id: icon.dataset.id || null,
            left: rect.left - parentRect.left,
            top: rect.top - parentRect.top,
            width: icon.style.width || `${rect.width}px`,
            height: icon.style.height || `${rect.height}px`,
            image: icon.querySelector("img")?.src || null,
        };
    });

    // Combine all data into one JSON object
    const data = {
        gameName,
        quickNotes: elements.notesTextarea.value.trim(),
        equipment: elements.equipmentTextarea.value.trim(),
        objective: elements.objectiveTextarea.value.trim(),
        modifications: elements.modificationsTextarea.value,
        rectangle: rectangleData, // Add the rectangle data
        icons: iconsData,
    };

    // Save as JSON file
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${gameName.replace(/\s+/g, "_")}.json`;
    link.click();
}

document.getElementById("save-json-btn").addEventListener("click", exportAsJSON);


function uploadJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const data = JSON.parse(e.target.result);

        // Restore text fields
        elements.gameNameInput.value = data.gameName || "Unnamed Game";
        elements.notesTextarea.value = data.quickNotes || "";
        elements.equipmentTextarea.value = data.equipment || "";
        elements.objectiveTextarea.value = data.objective || "";
        elements.modificationsTextarea.value = data.modifications || ""; 
        

        // Clear existing court diagram
        elements.courtContainer.innerHTML = "";

        // Reconstruct rectangle (court-wrapper)
        const rectangleData = data.rectangle;
        if (rectangleData) {
            const rectangle = document.createElement("div");
            rectangle.id = "canvas-wrapper";
            Object.assign(rectangle.style, {
                position: "absolute",
                left: `${rectangleData.left}px`,
                top: `${rectangleData.top}px`,
                width: `${rectangleData.width}px`,
                height: `${rectangleData.height}px`,
                backgroundColor: rectangleData.backgroundColor || "transparent",
                borderColor: rectangleData.borderColor || "black",
                borderWidth: rectangleData.borderWidth || "2px",
                borderStyle: "solid",
            });
            elements.courtContainer.appendChild(rectangle);
        }

        // Reconstruct draggable icons
        data.icons.forEach((iconData) => {
            const icon = document.createElement("div");
            icon.className = "draggable";
            Object.assign(icon.style, {
                position: "absolute",
                left: `${iconData.left}px`,
                top: `${iconData.top}px`,
                width: iconData.width,
                height: iconData.height,
            });

            if (iconData.image) {
                const img = document.createElement("img");
                img.src = iconData.image;
                img.style.width = "100%";
                img.style.height = "100%";
                img.style.objectFit = "contain";
                icon.appendChild(img);
            }

            elements.courtContainer.appendChild(icon);
            makeDraggable(icon);
        });

        saveState(); // Save the restored state
    };

    reader.readAsText(file);
}

document.getElementById("load-json-btn").addEventListener("change", uploadJSON);