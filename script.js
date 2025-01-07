// === Initialization ===
const stage = new Konva.Stage({
    container: "court-container",
    width: 800,
    height: 400,
});

const layer = new Konva.Layer();
stage.add(layer);

// Steps and State Management
let steps = [];
let currentStepIndex = 0;
let selectedIcon = null;

// === Helper Functions ===

// Create Icon Dynamically
function createIcon(id, x, y, imageSrc) {
    const icon = new Konva.Image({
        id,
        x,
        y,
        width: 40,
        height: 40,
        draggable: true,
    });

    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
        icon.image(image);
        layer.batchDraw();
    };

    layer.add(icon);
    icon.on("click", () => selectIcon(icon));
    return icon;
}

function addIconToCourt(iconId, src) {
    const icon = new Konva.Image({
        x: 50,
        y: 50,
        width: 50,
        height: 50,
        image: null,
        draggable: true,
        id: iconId,
        stroke: null, // Outline for selection
        strokeWidth: 2,
    });

    const img = new Image();
    img.onload = () => {
        icon.image(img);
        layer.draw(); // Redraw layer after the image is loaded
    };
    img.src = src;

    // Add interactivity: Select and Deselect
    icon.on('click', () => {
        const isSelected = icon.stroke() === 'red'; // Check if already selected
        deselectAllIcons(); // Deselect all icons
        if (!isSelected) {
            icon.stroke('red'); // Highlight selected icon
            layer.draw();
        }
    });

    // Add icon to the layer
    layer.add(icon);
    layer.draw(); // Ensure the icon appears after being added
}

// Deselect all icons
function deselectAllIcons() {
    layer.children.each((child) => {
        if (child instanceof Konva.Image) {
            child.stroke(null); // Remove selection outline
        }
    });
    layer.draw();
}

function enableDragging(icon) {
    icon.on('dragstart', () => {
        deselectAllIcons();
        icon.stroke('red'); // Keep the selected outline during drag
        layer.draw();
    });

    icon.on('dragend', () => {
        // Update position if needed for steps or other features
        icon.stroke('red');
        layer.draw();
    });
}

// Attach event listeners to icons in the menu
document.querySelectorAll('.icon').forEach((iconElement) => {
    iconElement.addEventListener('click', () => {
        const iconId = iconElement.id;
        const src = iconElement.querySelector('img').src;
        addIconToCourt(iconId, src);
    });
});

// Select Icon
function selectIcon(icon) {
    if (selectedIcon) {
        selectedIcon.className = "";  // Remove the selection class
    }
    selectedIcon = icon;
    selectedIcon.className = "konva-selected";  // Apply red border
    layer.batchDraw();  // Ensure the changes appear on the canvas
}

// Deselect Icon
function deselectIcon() {
    if (selectedIcon) {
        selectedIcon.stroke(null);
        selectedIcon.strokeWidth(0);
        selectedIcon = null;
        layer.batchDraw();
    }
}

// Add Step
function addStep() {
    if (!selectedIcon) {
        alert("Please select an icon first.");
        return;
    }

    steps.push({
        iconId: selectedIcon.id(),
        x: selectedIcon.x(),
        y: selectedIcon.y(),
        label: `Step ${steps.length + 1}`,
    });

    updateStepsUI();
}

// Update Steps UI
function updateStepsUI() {
    const stepsList = document.getElementById("steps-list");
    stepsList.innerHTML = steps
        .map((step, index) => `<div>${step.label}: (${step.x}, ${step.y})</div>`)
        .join("");
}

// Play Steps
function playSteps() {
    if (!steps.length) {
        alert("No steps recorded yet.");
        return;
    }

    currentStepIndex = 0;
    animateSteps();
}

function animateSteps() {
    if (currentStepIndex >= steps.length) return;

    const step = steps[currentStepIndex];
    const icon = layer.findOne(`#${step.iconId}`);

    if (icon) {
        icon.to({
            x: step.x,
            y: step.y,
            duration: 1,
            onFinish: () => {
                currentStepIndex++;
                animateSteps();
            },
        });
    }
}

function exportVideo() {
    if (steps.length === 0) {
        alert("No steps recorded to export.");
        return;
    }

    const capturer = new CCapture({ format: 'webm', framerate: 30 });
    let stepIndex = 0;

    capturer.start();

    function captureFrame() {
        if (stepIndex >= steps.length) {
            capturer.stop();
            capturer.save();
            alert("Video export complete!");
            return;
        }

        const step = steps[stepIndex];
        const icon = layer.findOne(`#${step.iconId}`);
        if (icon) {
            icon.to({
                x: step.x,
                y: step.y,
                duration: 1,
                onUpdate: () => {
                    capturer.capture(stage.toCanvas());
                },
                onFinish: () => {
                    stepIndex++;
                    setTimeout(captureFrame, 1000 / 30); // 30 FPS
                },
            });
        }
    }

    captureFrame();
}

elements.exportPdfBtn.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    const dataURL = stage.toDataURL({ pixelRatio: 2 });  // Higher resolution for clarity
    pdf.addImage(dataURL, "PNG", 10, 10, 190, 95);  // Position on the PDF
    pdf.save("PE_Planner_Diagram.pdf");
});

// === Event Listeners ===
document.getElementById("add-step-btn").addEventListener("click", addStep);
document.getElementById("play-steps-btn").addEventListener("click", playSteps);
document.getElementById("export-video-btn").addEventListener("click", exportVideo);

// Add icons dynamically when buttons are clicked
document.getElementById("icon-player-btn").addEventListener("click", () => {
    addIconToCanvas("icon-player", "assets/svg/player_icon.svg");
});
document.getElementById("icon-cone-btn").addEventListener("click", () => {
    addIconToCanvas("icon-cone", "assets/svg/low_profile_cone.svg");
});

// Deselect icon when clicking on the stage
stage.on("click", (e) => {
    if (e.target === stage) deselectIcon();
});