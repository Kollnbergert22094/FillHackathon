// =================================================================
// 1. KONFIGURATION
// =================================================================

const colorNames = {
    '#FF0000': 'rot',
    '#000000': 'schwarz',
    '#808080': 'grau'
};

// Variable zur Steuerung des Bestellstatus (für den Stepper)
// 1 = Bestellt, 2 = Bearbeitung, 3 = Versand, 4 = Zugestellt (je nach HTML)
let currentOrderStatus = 2; 

let colorsFromJson = {};

const currentColorsIndex = {
    head: 0,
    torso: 0,
    arms: 0,
    legs: 0
};

// =================================================================
// 2. HAUPTFUNKTIONEN (Farbwechsel)
// =================================================================

function updateLegoFigure() {
    // Mapping: part -> dateipräfix (teilnummern in deinen Dateinamen)
    const partPrefix = { head: 1, torso: 2, arms: 3, legs: 4 };
    const partsToUpdate = ['head', 'torso', 'arms', 'legs'];

    partsToUpdate.forEach(part => {
        const partColors = colorsFromJson[part] || ['#000000'];
        const index = currentColorsIndex[part] % Math.max(1, partColors.length);
        // variantIndex beginnt bei 1, also +1
        const variantIndex = index + 1;
        const prefix = partPrefix[part] || part;
        const img = document.getElementById(part);
        if (img) {
            // Setze src auf passende Bilddatei. Beispiel: /data/images/1_2.png
            img.src = `/data/images/${prefix}_${variantIndex}.png`;
        }

        // zweite Bild-Elemente (arms-2, legs-2) ebenfalls aktualisieren
        if (part === 'arms') {
            const img2 = document.getElementById('arms-2');
            if (img2) img2.src = `/data/images/${partPrefix['arms']}_${variantIndex}.png`;
        }
        if (part === 'legs') {
            const img2 = document.getElementById('legs-2');
            if (img2) img2.src = `/data/images/${partPrefix['legs']}_${variantIndex}.png`;
        }
    });
}

function changePartColor(part, direction) {
    console.log("changePartColor", part, direction);
    let currentIndex = currentColorsIndex[part];
    const colors = colorsFromJson[part] || ['#000000'];

    if (direction === 'next') {
        currentIndex = (currentIndex + 1) % colors.length;
    } else {
        currentIndex = (currentIndex - 1 + colors.length) % colors.length;
    }
    
    currentColorsIndex[part] = currentIndex;
    console.log("Neuer Index für", part, ":", currentIndex, "Farbe:", colors[currentIndex]);
    updateLegoFigure();
}

/**
 * Aktualisiert den visuellen Status-Stepper basierend auf dem aktuellen Schritt.
 * @param {number} currentStepNumber - Die Nummer des aktuell aktiven Schritts (z.B. 2).
 */
function updateStepperStatus(currentStepNumber) {
    console.log("Aktualisiere Stepper auf Schritt:", currentStepNumber);
    const stepper = document.getElementById('status_stepper');
    if (!stepper) return;

    // 1. Alle Steps und Linien zurücksetzen
    const steps = stepper.querySelectorAll('.step');
    const lines = stepper.querySelectorAll('.step_line');

    steps.forEach((step, index) => {
        const stepNum = index + 1; // Schritte starten bei 1
        step.classList.remove('finished', 'current');
        
        if (stepNum < currentStepNumber) {
            // Schritte, die VOR dem aktuellen Schritt liegen, sind 'finished'
            step.classList.add('finished');
        } else if (stepNum === currentStepNumber) {
            // Der aktuelle Schritt ist 'current'
            step.classList.add('current');
        }
    });
    
    lines.forEach((line, index) => {
        const lineNum = index + 1;
        line.classList.remove('active');
        
        if (lineNum < currentStepNumber) {
            // Linien vor dem aktuellen Schritt sind 'active'
            line.classList.add('active');
        }
    });
}

// =================================================================
// FARBEN AUS JSON LADEN
// =================================================================

async function loadColorsFromJson() {
    try {
        console.log('Starte Laden von colors.json...');
        const response = await fetch('../data/colors.json');
        
        if (!response.ok) throw new Error('JSON nicht gefunden');
        
        const colors = await response.json();
        console.log('Daten geladen:', colors);

        const nameToHex = {
            'red': '#FF0000',
            'black': '#000000',
            'grey': '#808080'
        };
        
        const hexCodes = colors.colors.map(c => nameToHex[c.name.toLowerCase()]);
        console.log('Hex-Codes:', hexCodes);
        
        colorsFromJson = {
            head: hexCodes,
            torso: hexCodes,
            arms: hexCodes,
            legs: hexCodes
        };
        
        console.log('colorsFromJson:', colorsFromJson);
    } catch (err) {
        console.error('Fehler:', err);
    }
}

// =================================================================
// 3. EVENTS (Laden und Bestellen)
// =================================================================

document.addEventListener('DOMContentLoaded', async () => {
    await loadColorsFromJson();
    updateLegoFigure();

    const addToCartBtn = document.querySelector('.add-to-cart');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            const selectedConfig = {};
            for (const part in currentColorsIndex) {
                const partColors = colorsFromJson[part] || ['#000000'];
                selectedConfig[part] = partColors;
            }

            console.log('Config:', selectedConfig);
            const newWin = window.open('build.html', '_blank');
            if (newWin) newWin.focus();
        });
    }
});