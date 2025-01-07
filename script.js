// === Initialization ===
const stage = new Konva.Stage({
    container: "konva-container",
    width: document.getElementById("court-container").clientWidth,
    height: 400,
});

const layer = new Konva.Layer();
stage.add(layer);

const history = [];
const redoStack = [];

// === Elements Object ===
const elements = {
    gameNameInput: document.getElementById("game-name-input"),
    notesTextarea: document.getElementById("notes-textarea"),
    equipmentTextarea: document.getElementById("equipment-textarea"),
    objectiveTextarea: document.getElementById("objective-textarea"),
    exportPdfBtn: document.getElementById("export-pdf-btn"),
    clearCourtBtn: document.getElementById("clear-court-btn"),
    undoBtn: document.getElementById("undo-btn"),
    redoBtn: document.getElementById("redo-btn"),
};

// === Save State Function ===
function saveState() {
    history.push(layer.toJSON());
    redoStack.length = 0; // Clear redo stack
}

// === Adding Icons to Court ===
document.querySelectorAll(".icon").forEach((iconElement) => {
    iconElement.addEventListener("click", () => {
        const imgSrc = iconElement.querySelector("img").src;
        const imageObj = new Image();
        imageObj.src = imgSrc;

        imageObj.onload = () => {
            const konvaIcon = new Konva.Image({
                x: 100,
                y: 100,
                width: 50,
                height: 50,
                draggable: true,
                image: imageObj,
            });

            konvaIcon.on("dragend", saveState);
            layer.add(konvaIcon);
            layer.draw();
            saveState(); // Save state after adding icon
        };
    });
});

// === PDF Export Function ===
elements.exportPdfBtn.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");

    const addSection = (title, content, y) => {
        if (content.trim()) {
            doc.setFont("helvetica", "bold").setFontSize(16).text(title, 10, y);
            const contentLines = doc.splitTextToSize(content.trim(), 180);
            const lineHeight = 7;
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
    y = addSection("Objective:", elements.objectiveTextarea.value.trim(), y);
    y = addSection("Quick Notes:", elements.notesTextarea.value.trim(), y);
    y = addSection("Equipment:", elements.equipmentTextarea.value.trim(), y);

    const dataURL = stage.toDataURL({ mimeType: "image/png", pixelRatio: 2 });

    const img = new Image();
    img.src = dataURL;

    img.onload = () => {
        const imgWidth = 190;
        const imgHeight = (img.height * imgWidth) / img.width;

        if (y + imgHeight > 280) {
            doc.addPage();
            y = 10;
        }

        // Draw border for court diagram
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(1);
        doc.rect(10, y - 5, imgWidth, imgHeight + 5); // Add border rectangle

        doc.addImage(img, "PNG", 10, y, imgWidth, imgHeight);
        doc.setFontSize(10).text("Created with peplanner.com", 10, 287);

        doc.save("PE_Planner_Diagram.pdf");
    };
});

// === Clear Court ===
elements.clearCourtBtn.addEventListener("click", () => {
    layer.destroyChildren();
    layer.draw();
    saveState();
});

// === Undo/Redo Functionality ===
elements.undoBtn.addEventListener("click", () => {
    if (history.length > 1) {
        redoStack.push(history.pop());
        const previousState = history[history.length - 1];
        layer.destroyChildren();
        Konva.Node.create(previousState, layer);
        layer.draw();
    }
});

elements.redoBtn.addEventListener("click", () => {
    if (redoStack.length) {
        const nextState = redoStack.pop();
        history.push(nextState);
        layer.destroyChildren();
        Konva.Node.create(nextState, layer);
        layer.draw();
    }
});