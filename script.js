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

    // Game Name
    const gameName = gameNameInput.value.trim() || "PE_Planner_Diagram";
    doc.setFontSize(16);
    doc.text("Game Name:", 10, 10);
    doc.setFontSize(14);
    doc.text(gameName, 10, 20);

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

        // Add Footer: plain text + hyperlink
        const footerText = "created with ";
        const hyperlinkText = "peplanner.com";
        const footerX = 150;
        const footerY = 287;

        // Regular text (black)
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0); // Black color
        doc.text(footerText, footerX, footerY);

        // Hyperlink text (blue)
        const textWidth = doc.getTextWidth(footerText); // Get the width of "created with "
        doc.setTextColor(0, 0, 255); // Blue for hyperlink
        doc.textWithLink(hyperlinkText, footerX + textWidth, footerY, {
        url: "https://peplanner.com",
        });

        // Save the PDF with Game Name as the filename
        const filename = gameName.replace(/\s+/g, "_") + ".pdf"; // Replace spaces with underscores
        doc.save(filename);
    });
});

// Add draggable functionality
function makeDraggable(element) {
    let offsetX, offsetY;

    // Start drag (for both mouse and touch)
    const startDrag = (e) => {
        const event = e.type === "mousedown" ? e : e.touches[0]; // Use touch point if on touch device
        offsetX = event.clientX - element.offsetLeft;
        offsetY = event.clientY - element.offsetTop;
        element.classList.add("dragging");

        // Add event listeners for movement and stop
        document.addEventListener("mousemove", moveElement);
        document.addEventListener("touchmove", moveElement, { passive: false }); // Prevent default scrolling
        document.addEventListener("mouseup", stopDragging);
        document.addEventListener("touchend", stopDragging);
    };

    // Move element (for both mouse and touch)
    const moveElement = (e) => {
        const event = e.type === "mousemove" ? e : e.touches[0];
        const container = document.getElementById("court-container");
        const rect = container.getBoundingClientRect();

        let x = event.clientX - offsetX;
        let y = event.clientY - offsetY;

        // Prevent dragging outside the container
        x = Math.max(0, Math.min(x, rect.width - element.offsetWidth));
        y = Math.max(0, Math.min(y, rect.height - element.offsetHeight));

        element.style.left = x + "px";
        element.style.top = y + "px";
    };

    // Stop dragging (for both mouse and touch)
    const stopDragging = () => {
        document.removeEventListener("mousemove", moveElement);
        document.removeEventListener("touchmove", moveElement);
        document.removeEventListener("mouseup", stopDragging);
        document.removeEventListener("touchend", stopDragging);
        element.classList.remove("dragging");
    };

    // Add event listeners for starting drag
    element.addEventListener("mousedown", startDrag);
    element.addEventListener("touchstart", startDrag, { passive: false }); // Prevent default scrolling
}

// Add Player Icon
document.getElementById("icon-player").addEventListener("click", () => {
    const player = document.createElement("div");
    player.className = "draggable player";
    player.style.left = "100px";
    player.style.top = "100px";

    // Add the Player SVG image
    const img = document.createElement("img");
    img.src = "assets/svg/player_icon.svg"; // Path to your Player SVG
    img.alt = "Player";
    img.style.width = "40px";
    img.style.height = "40px";
    img.style.pointerEvents = "none"; // Ensures the image doesn't interfere with dragging

    player.appendChild(img);
    courtContainer.appendChild(player);
    makeDraggable(player); // Make it draggable
});

// Add Cone Icon
document.getElementById("icon-cone").addEventListener("click", () => {
    const cone = document.createElement("div");
    cone.className = "draggable cone";
    cone.style.left = "100px";
    cone.style.top = "100px";

    // Add the Cone SVG image
    const img = document.createElement("img");
    img.src = "assets/svg/low_profile_cone.svg"; // Path to your Cone SVG
    img.alt = "Cone";
    img.style.width = "40px";
    img.style.height = "40px";
    img.style.pointerEvents = "none";

    cone.appendChild(img);
    courtContainer.appendChild(cone);
    makeDraggable(cone); // Make it draggable
});

// Add Circle Icon
document.getElementById("icon-circle").addEventListener("click", () => {
    const circle = document.createElement("div");
    circle.className = "draggable circle";
    circle.style.left = "100px";
    circle.style.top = "100px";

    const img = document.createElement("img");
    img.src = "assets/svg/circle_icon.svg"; // Path to your Circle SVG
    img.alt = "Circle";
    img.style.width = "40px";
    img.style.height = "40px";
    img.style.pointerEvents = "none"; // Prevent interfering with dragging

    circle.appendChild(img);
    courtContainer.appendChild(circle);
    makeDraggable(circle);
});

// Add Square Icon
document.getElementById("icon-square").addEventListener("click", () => {
    const square = document.createElement("div");
    square.className = "draggable square";
    square.style.left = "100px";
    square.style.top = "100px";

    const img = document.createElement("img");
    img.src = "assets/svg/square_icon.svg"; // Path to your Square SVG
    img.alt = "Square";
    img.style.width = "40px";
    img.style.height = "40px";
    img.style.pointerEvents = "none";

    square.appendChild(img);
    courtContainer.appendChild(square);
    makeDraggable(square);
});

// Add Up Arrow Icon
document.getElementById("icon-arrow-up").addEventListener("click", () => {
    addDraggableIcon("assets/svg/arrow_sm_up_icon.svg", "Up Arrow");
});

// Add Down Arrow Icon
document.getElementById("icon-arrow-down").addEventListener("click", () => {
    addDraggableIcon("assets/svg/arrow_sm_down_icon.svg", "Down Arrow");
});

// Add Left Arrow Icon
document.getElementById("icon-arrow-left").addEventListener("click", () => {
    addDraggableIcon("assets/svg/arrow_sm_left_icon.svg", "Left Arrow");
});

// Add Right Arrow Icon
document.getElementById("icon-arrow-right").addEventListener("click", () => {
    addDraggableIcon("assets/svg/arrow_sm_right_icon.svg", "Right Arrow");
});

// Reusable function to add draggable icons
function addDraggableIcon(imagePath, altText) {
    const icon = document.createElement("div");
    icon.className = "draggable arrow";
    icon.style.left = "100px";
    icon.style.top = "100px";

    // Add the image to the icon
    const img = document.createElement("img");
    img.src = imagePath;
    img.alt = altText;
    img.style.width = "40px";
    img.style.height = "40px";
    img.style.pointerEvents = "none"; // Ensure only the container is draggable

    icon.appendChild(img);
    courtContainer.appendChild(icon);
    makeDraggable(icon);
}


// Clear Court
document.getElementById("clear-court").addEventListener("click", () => {
    // Select all draggable elements inside the court-container
    const draggableItems = document.querySelectorAll("#court-container .draggable");

    // Remove each draggable element
    draggableItems.forEach((item) => item.remove());
});