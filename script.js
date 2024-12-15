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
    redoStack = []; // Clear redo stack
}

// Reinitialize draggable items after undo/redo
function reinitializeDraggable() {
    const draggableItems = courtContainer.querySelectorAll(".draggable");
    draggableItems.forEach((item) => makeDraggable(item));
}

// Add Undo Functionality
document.getElementById("undo-btn").addEventListener("click", () => {
    if (history.length > 0) {
        redoStack.push(courtContainer.innerHTML);
        courtContainer.innerHTML = history.pop();
        reinitializeDraggable();
    }
});

// Add Redo Functionality
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

    // Game Name
    doc.setFontSize(16);
    doc.text("Game Name:", 10, 10);
    doc.setFontSize(14);
    doc.text(gameName, 10, 20);

    // Add Notes, Equipment, and Objective
    const addSection = (title, content, startY) => {
        doc.setFontSize(16);
        doc.text(title, 10, startY);
        doc.setFontSize(14);
        doc.text(content.trim() || "N/A", 10, startY + 10);
        return startY + (content.split("\n").length * 10) + 10;
    };

    let startY = 40;
    startY = addSection("Quick Notes:", notesTextarea.value, startY);
    startY = addSection("Equipment:", equipmentTextarea.value, startY);
    startY = addSection("Objective:", objectiveTextarea.value, startY);

    // Add Court Diagram
    html2canvas(courtContainer).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const imgHeight = (190 * canvas.height) / canvas.width;
        doc.addImage(imgData, "PNG", 10, startY, 190, imgHeight);

        // Add Footer with Hyperlink
        const footerText = "created with ";
        const hyperlinkText = "peplanner.com";
        const footerY = 287;
        const footerX = 150;

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(footerText, footerX, footerY);

        const textWidth = doc.getTextWidth(footerText);
        doc.setTextColor(0, 0, 255);
        doc.textWithLink(hyperlinkText, footerX + textWidth, footerY, { url: "https://peplanner.com" });

        doc.save(`${gameName.replace(/\s+/g, "_")}.pdf`);
    });
});

// Make an element draggable
function makeDraggable(element) {
    let offsetX, offsetY;

    const startDrag = (e) => {
        e.preventDefault();
        const event = e.type === "mousedown" ? e : e.touches[0];
        offsetX = event.clientX - element.offsetLeft;
        offsetY = event.clientY - element.offsetTop;

        if (e.type === "mousedown") {
            document.addEventListener("mousemove", moveElement);
            document.addEventListener("mouseup", stopDragging);
        } else {
            document.addEventListener("touchmove", moveElement, { passive: false });
            document.addEventListener("touchend", stopDragging);
        }
        element.classList.add("dragging");
    };

    const moveElement = (e) => {
        const event = e.type === "mousemove" ? e : e.touches[0];
        const rect = courtContainer.getBoundingClientRect();
        let x = event.clientX - offsetX;
        let y = event.clientY - offsetY;

        x = Math.max(0, Math.min(x, rect.width - element.offsetWidth));
        y = Math.max(0, Math.min(y, rect.height - element.offsetHeight));

        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
    };

    const stopDragging = () => {
        document.removeEventListener("mousemove", moveElement);
        document.removeEventListener("mouseup", stopDragging);
        document.removeEventListener("touchmove", moveElement);
        document.removeEventListener("touchend", stopDragging);
        element.classList.remove("dragging");
        saveState();
    };

    element.addEventListener("mousedown", startDrag);
    element.addEventListener("touchstart", startDrag, { passive: false });
}

// Generic function to add draggable icons
function addDraggableIcon(iconId, imagePath) {
    document.getElementById(iconId).addEventListener("click", () => {
        const icon = document.createElement("div");
        icon.className = "draggable";
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
addDraggableIcon("icon-player", "assets/svg/player_icon.svg");
addDraggableIcon("icon-cone", "assets/svg/low_profile_cone.svg");
addDraggableIcon("icon-circle", "assets/svg/circle_icon.svg");
addDraggableIcon("icon-square", "assets/svg/square_icon.svg");
addDraggableIcon("icon-arrow-up", "assets/svg/arrow_sm_up_icon.svg");
addDraggableIcon("icon-arrow-down", "assets/svg/arrow_sm_down_icon.svg");
addDraggableIcon("icon-arrow-left", "assets/svg/arrow_sm_left_icon.svg");
addDraggableIcon("icon-arrow-right", "assets/svg/arrow_sm_right_icon.svg");

// Clear Court Button
document.getElementById("clear-court").addEventListener("click", () => {
    saveState(); // Save the current state for Undo
    
    // Select and remove only elements with the "draggable" class
    const draggableItems = document.querySelectorAll("#court-container .draggable");
    draggableItems.forEach(item => item.remove());
});

document.getElementById("save-json-btn").addEventListener("click", () => {
    // Collect the data to save
    const gameData = {
        gameName: gameNameInput.value.trim(),
        notes: notesTextarea.value.trim(),
        equipment: equipmentTextarea.value.trim(),
        objective: objectiveTextarea.value.trim(),
        courtDiagram: courtContainer.innerHTML, // Save court diagram as HTML string
    };

    // Convert the data to JSON
    const jsonData = JSON.stringify(gameData, null, 2); // Indent for readability

    // Create a blob object for the JSON data
    const blob = new Blob([jsonData], { type: "application/json" });

    // Create a download link
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${gameData.gameName || "PE_Planner_Data"}.json`; // Dynamic filename
    link.click(); // Trigger the download

    // Cleanup the URL object
    URL.revokeObjectURL(link.href);
});

document.getElementById("load-json-btn").addEventListener("change", (event) => {
    const file = event.target.files[0]; // Get the selected file

    if (file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            const data = JSON.parse(e.target.result); // Parse the JSON file content

            // Restore inputs
            gameNameInput.value = data.gameName || "";
            notesTextarea.value = data.notes || "";
            equipmentTextarea.value = data.equipment || "";
            objectiveTextarea.value = data.objective || "";

            // Restore court diagram
            courtContainer.innerHTML = data.courtDiagram || "";
            reinitializeDraggable(); // Reinitialize draggable functionality
        };

        reader.readAsText(file); // Read the file as text
    }
});