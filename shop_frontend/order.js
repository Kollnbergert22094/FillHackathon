// =================================================================
// 1. KONFIGURATION
// =================================================================

const colorNames = {
    '#FF0000': 'rot',
    '#000000': 'schwarz',
    '#808080': 'grau'
};
//const BACKEND = "http://192.168.4.5:3000";
const BACKEND = "http://10.230.18.52:3000";

// Variable zur Steuerung des Bestellstatus (für den Stepper)
// 1 = Bestellt, 2 = Bearbeitung, 3 = Versand, 4 = Zugestellt (je nach HTML)
let currentOrderStatus = 4; 

let colorsFromJson = {};
let colorId = [];
let colorsID


let currentTaskId = null; 
let pollingInterval = null;

const currentColorsIndex = {
    head: 0,
    torso: 0,
    arms: 0,
    legs: 0
};

const partIdMapping = {
    head: 1,
    torso: 2,
    arms: 3,
    legs: 4
    // ACHTUNG: Basierend auf deiner bisherigen Logik. 
    // Wenn 'legs' im Ziel-JSON '4' sein soll, ändere dies zu 4.
}
const colorMapping = {
    grey: 1,
    black: 2
}

// =================================================================
// 2. HAUPTFUNKTIONEN (Farbwechsel)
// =================================================================

function updateLegoFigure() {
    // Mapping: part -> dateipräfix (teilnummern in deinen Dateinamen)
    const partPrefix = { head: 1, torso: 2, arms: 3, legs: 5 };
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
            if (img2) img2.src = `/data/images/${(partPrefix['arms']) + 1 }_${variantIndex}.png`;
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
        currentIndex = (currentIndex + 1) % colorId.length;
    } else {
        currentIndex = (currentIndex - 1 + colorId.length) % colorId.length;
    }
    console.log(colors)
    currentColorsIndex[part] = currentIndex;
    console.log("Neuer Index für", part, ":", currentIndex, "Farbe:", colors[currentIndex]);
    updateLegoFigure();
}

// =================================================================
// 2. HAUPTFUNKTIONEN (Farbwechsel und Stepper)
// =================================================================

// ... (updateLegoFigure und changePartColor bleiben unverändert)

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
            // Schritte, die VOR dem aktuellen Schritt liegen, sind 'finished' (Grünes Icon)
            step.classList.add('finished');
        } else if (stepNum === currentStepNumber) {
            // Der aktuelle Schritt ist 'current' (Rotes Icon mit Puls)
            step.classList.add('current');
        }
    });
    
    lines.forEach((line, index) => {
        const lineNum = index + 1;
        // Linien-Klassen immer zurücksetzen
        line.classList.remove('active', 'finished'); 
        
        // Logik für die Linien:
        
        // 1. Grüne Linie ('finished'): Wenn der nächste Schritt (lineNum + 1) ebenfalls abgeschlossen ist.
        if (lineNum + 1 < currentStepNumber) {
             line.classList.add('finished'); // Setzt Klasse für GRÜN
        } 
        // 2. Rote Linie ('active'): Wenn die Linie zum aktuellen Schritt führt.
        else if (lineNum < currentStepNumber) {
            line.classList.add('active'); // Setzt Klasse für ROT
        }
        // Ansonsten bleibt die Linie neutral (Grau)
    });
}

// ... (Rest des JavaScript-Codes bleibt unverändert)

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
            'black': 'black',
            'grey': 'grey'
        };
        

        for (const colorName in colorMapping) {
            colorId.push(colorMapping[colorName]);
            
        }
        console.log('colorID', colorId);
        const hexCodes = colors.colors.map(c => nameToHex[c.name.toLowerCase()]);
        console.log('Hex-Codes:', hexCodes);
        console.log(colorMapping['grey'])
        colorsFromJson = {
            head: hexCodes[2],
            torso: hexCodes[2],
            arms: hexCodes[2],
            legs: hexCodes[2]
        };
        
        colorsID = {
            head: colorMapping[hexCodes[0]],
            torso: colorMapping[hexCodes[0]],
            arms: colorMapping[hexCodes[0]],
            legs: colorMapping[hexCodes[0]]
        }
        
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
        addToCartBtn.addEventListener('click', async () => {
            const selectedConfig = {};
            for (const part in currentColorsIndex) {
                const partColors = colorsFromJson[part];
                selectedConfig[part] = partColors;
            }
            
            console.log('Config:', selectedConfig);
            
            const items = transformConfigToOrderFormat(colorsID);
            
            console.log(colorId)
            console.log(items);
            

            saveItems(items)
            // // In JSON speichern
            // await saveItemToJson(selectedConfig);
            
            const newWin = window.open('build.html', '_blank');
            if (newWin) newWin.focus();
            
            startTaskFrontend();
        });
    }
});

// async function saveTaskIdToJson(taskId) {
//     try {
//         const response = await fetch(BACKEND + '/api/save-task-id', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({ taskId }) // Backend erwartet { taskId }
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP Fehler! Status: ${response.status}`);
//         }

//         const result = await response.json();
//         console.log('Task-ID gespeichert:', result);

//     } catch (err) {
//         console.error('Fehler beim Speichern der Task-ID:', err);
//     }
// }


async function saveItems(items) {
    try {
        const response = await fetch(BACKEND + '/api/save-items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(items)
        });

        if (!response.ok) {
            throw new Error(`HTTP Fehler! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Items gespeichert:', result);

    } catch (err) {
        console.error('Fehler beim Speichern der Items:', err);
    }
}





// =================================================================
// ACTUAL TASK START
// =================================================================
async function startTaskFrontend() {
    try {
        // 1. Items aus JSON laden
        const respItems = await fetch('../data/items.json');
        if (!respItems.ok) throw new Error('items.json konnte nicht geladen werden');
        const itemsData = await respItems.json();
        const items = itemsData.items; // erwartet: { "items": [ {...}, {...} ] }

        if (!items || !items.length) {
            console.error('Keine Items gefunden in items.json');
            return;
        }

        // 2. Task beim Backend starten
        const respTask = await fetch(`${BACKEND}/api/task/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(items)
        });

        // const data = await respTask.json();

        // if (data.taskId) {
        //     console.log('Task gestartet:', data.taskId);
        //     await saveTaskIdToJson({ taskId: data.taskId });
        // } else {
        //     console.error('Fehler beim Starten des Tasks', data);
        // }
    } catch (err) {
        console.error('Fehler beim Laden/Starten des Tasks:', err);
    }
}


function transformConfigToOrderFormat(colorsIndex) {
    const items = [];

    // Iteriere über jedes Teil im partIdMapping, um die Reihenfolge sicherzustellen
    for (const partName in partIdMapping) {
        
        // Hole die Part ID aus dem Mapping
        const partId = partIdMapping[partName];
        
        // Hole den Farb-Index aus dem Eingabeobjekt
        const colorIndex = colorsIndex[partName]; 
        
        // Die Color ID ist der Index + 1 (typisch für 1-basierte IDs im Backend)
        const colorId = colorIndex; 

        // Füge das neue Item zum Array hinzu
        items.push({
            partId: partId,
            colorId: colorId
        });
    }

    return {
        items: items
    };
}