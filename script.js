// DOM Elements
const gameNameInput = document.getElementById("game-name-input");
const notesTextarea = document.getElementById("notes-textarea");
const equipmentTextarea = document.getElementById("equipment-textarea");
const objectiveTextarea = document.getElementById("objective-textarea");
const exportPdfBtn = document.getElementById("export-pdf-btn");
const courtContainer = document.getElementById("court-container");

// Export to PDF
exportPdfBtn.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;

    const doc = new jsPDF("p", "mm", "a4");

    // Add Game Name
    doc.setFontSize(16);
    doc.text("Game Name:", 10, 10);
    doc.setFontSize(14);
    doc.text(gameNameInput.value || "N/A", 10, 20);

    // Add Notes
    doc.setFontSize(16);
    doc.text("Quick Notes:", 10, 40);
    doc.setFontSize(14);
    const notes = notesTextarea.value.trim() || "N/A";
    doc.text(notes, 10, 50);

    // Add Equipment
    const equipmentStartY = 60 + (notes.split("\n").length * 10);
    doc.setFontSize(16);
    doc.text("Equipment:", 10, equipmentStartY);
    doc.setFontSize(14);
    const equipment = equipmentTextarea.value.trim() || "N/A";
    doc.text(equipment, 10, equipmentStartY + 10);

    // Add Objective
    const objectiveStartY = equipmentStartY + (equipment.split("\n").length * 10) + 10;
    doc.setFontSize(16);
    doc.text("Objective:", 10, objectiveStartY);
    doc.setFontSize(14);
    const objective = objectiveTextarea.value.trim() || "N/A";
    doc.text(objective, 10, objectiveStartY + 10);

    // Add Court Diagram
    html2canvas(courtContainer).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");

        // Get canvas dimensions
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // A4 page width and height in mm
        const pageWidth = 190; // Margin-adjusted A4 width
        const aspectRatio = canvasHeight / canvasWidth;
        const imgHeight = pageWidth * aspectRatio;

        // Add the image to the PDF (preserving aspect ratio)
        doc.addImage(imgData, "PNG", 10, objectiveStartY + 30, pageWidth, imgHeight);

        doc.save("PE_Planner.pdf");
    });
});

// Add draggable functionality
function makeDraggable(element) {
    let offsetX, offsetY;

    element.addEventListener("mousedown", (e) => {
        offsetX = e.clientX - element.offsetLeft;
        offsetY = e.clientY - element.offsetTop;
        element.classList.add("dragging");

        document.addEventListener("mousemove", moveElement);
        document.addEventListener("mouseup", stopDragging);
    });

    function moveElement(e) {
        const rect = courtContainer.getBoundingClientRect();

        let x = e.clientX - offsetX;
        let y = e.clientY - offsetY;

        // Prevent dragging outside the court
        x = Math.max(0, Math.min(x, rect.width - element.offsetWidth));
        y = Math.max(0, Math.min(y, rect.height - element.offsetHeight));

        element.style.left = x + "px";
        element.style.top = y + "px";
    }

    function stopDragging() {
        document.removeEventListener("mousemove", moveElement);
        document.removeEventListener("mouseup", stopDragging);
        element.classList.remove("dragging");
    }
}

// Add Players
document.getElementById("add-player").addEventListener("click", () => {
    const player = document.createElement("div");
    player.className = "draggable player";
    player.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4caf50">
            <circle cx="12" cy="7" r="4" />
            <path d="M12 11c-3.33 0-6 2.69-6 6v3h12v-3c0-3.31-2.67-6-6-6z" />
        </svg>
    `;
    player.style.left = "50px";
    player.style.top = "50px";
    courtContainer.appendChild(player);
    makeDraggable(player);
});

// Add Cones
document.getElementById("add-cone").addEventListener("click", () => {
    const cone = document.createElement("div");
    cone.className = "draggable cone";
    cone.textContent = "C"; // Cone label
    cone.style.left = "100px";
    cone.style.top = "100px";
    courtContainer.appendChild(cone);
    makeDraggable(cone);
});

// Clear Court
document.getElementById("clear-court").addEventListener("click", () => {
    // Select all draggable elements inside the court-container
    const draggableItems = document.querySelectorAll("#court-container .draggable");

    // Remove each draggable element
    draggableItems.forEach((item) => item.remove());
});

// Call drawCourt on page load
window.addEventListener("DOMContentLoaded", drawCourt);