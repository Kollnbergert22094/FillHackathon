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
let currentOrderStatus = 4; 

let colorsFromJson = {};


let currentTaskId = null; 
let pollingInterval = null;

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
        currentIndex = (currentIndex + 1) % colors.length;
    } else {
        currentIndex = (currentIndex - 1 + colors.length) % colors.length;
    }
    
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
        addToCartBtn.addEventListener('click', async () => {
            const selectedConfig = {};
            for (const part in currentColorsIndex) {
                const partColors = colorsFromJson[part] || ['#000000'];
                const index = currentColorsIndex[part];
                selectedConfig[part] = partColors[index];
            }
            
            console.log('Config:', selectedConfig);
            
            // In JSON speichern
            await saveItemToJson(selectedConfig);
            
            const newWin = window.open('build.html', '_blank');
            if (newWin) newWin.focus();
            
            startTaskFrontend();    
        });
    }
});

async function saveItemToJson(itemData) {
     try {
         const response = await fetch('/api/save-item', { // Der Server-Endpunkt
             method: 'POST',
             headers: { 'Content-Type': 'application/json' }, // Wichtig: Teilt dem Server das Format mit
             body: JSON.stringify(itemData) // Konvertiert das JS-Objekt in einen JSON-String 
              });

     if (!response.ok) {
         throw new Error(`HTTP Fehler! Status: ${response.status}`);
        }
    const result = await response.json();
    console.log(' Speichern erfolgreich:', result);
    } catch (err) {
        console.error(' Fehler beim Speichern:', err);
    }
}









// =================================================================
// ACTUAL TASK START
// =================================================================
// async function startTaskFrontend() {
//     try {
//         // 1. Items aus JSON laden
//         const respItems = await fetch('../data/items.json');
//         if (!respItems.ok) throw new Error('items.json konnte nicht geladen werden');
//         const itemsData = await respItems.json();
//         const items = itemsData.items; // erwartet: { "items": [ {...}, {...} ] }

//         if (!items || !items.length) {
//             console.error('Keine Items gefunden in items.json');
//             return;
//         }

//         // 2. Task beim Backend starten
//         const respTask = await fetch(`${BACKEND}/api/task/start`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(items)
//         });

//         const data = await respTask.json();

//         if (data.taskId) {
//             console.log('Task gestartet:', data.taskId);
//             startPollingTask(data.taskId);
//         } else {
//             console.error('Fehler beim Starten des Tasks', data);
//         }

//     } catch (err) {
//         console.error('Fehler beim Laden/Starten des Tasks:', err);
//     }
// }

async function startTaskFrontend() {
    try {
        // 1. Items aus JSON laden
        const respItems = await fetch('../data/items.json');
        if (!respItems.ok) throw new Error('items.json konnte nicht geladen werden');
        const itemsData = await respItems.json();
        const items = itemsData.items;

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

        const data = await respTask.json();

        if (data.taskId) {
            console.log('Task gestartet:', data.taskId);

            await fetch(BACKEND + '/api/save-task-id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId: data.taskId })
            });

            console.log('Task-ID in taskId.json gespeichert');
        } else {
            console.error('Fehler beim Starten des Tasks', data);
        }

    } catch (err) {
        console.error('Fehler beim Laden/Starten des Tasks:', err);
    }
}



// =================================================================
// TASK POLLING
// =================================================================
// function startPollingTask(taskId) {
//     currentTaskId = taskId;
//     if (pollingInterval) clearInterval(pollingInterval);

//     pollingInterval = setInterval(async () => {
//         try {
//             const resp = await fetch(`${BACKEND}/api/task/${taskId}/status`);
//             const data = await resp.json();
//             if (!data?.status) return;

//             switch(data.status) {
//                 case 'pending': currentOrderStatus = 1; break;
//                 case 'running': currentOrderStatus = 2; break;
//                 case 'done':
//                     currentOrderStatus = 4;
//                     clearInterval(pollingInterval);
//                     pollingInterval = null;
//                     break;
//                 case 'error':
//                     currentOrderStatus = 1;
//                     clearInterval(pollingInterval);
//                     pollingInterval = null;
//                     alert('Task ist fehlgeschlagen!');
//                     break;
//             }

//             updateStepperStatus(currentOrderStatus);
//         } catch (err) {
//             console.error('Polling Fehler:', err);
//         }
//     }, 2000);
// }


function startPollingTask(taskId) {
    currentTaskId = taskId;
    if (pollingInterval) clearInterval(pollingInterval);

    pollingInterval = setInterval(async () => {
        try {
            const resp = await fetch(`${BACKEND}/api/task/${taskId}/status`);

            // Wenn Status nicht OK -> weiterprobieren
            if (!resp.ok) {
                console.warn("Backend antwortet noch nicht…", resp.status);
                return; // weiter pollen
            }

            let data;

            try {
                // JSON sicher parsen – kann fehlschlagen, wenn leer
                const text = await resp.text();
                if (!text.trim()) {
                    console.log("Status-Antwort ist leer – weiter pollen…");
                    return; // NICHT abbrechen
                }
                data = JSON.parse(text);
            } catch {
                console.log("JSON ist ungültig – Backend noch nicht bereit");
                return; // weiter pollen
            }

            if (!data.status) {
                console.log("Status fehlt – weiter pollen…");
                return;
            }

            switch (data.status) {
                case "pending":
                    currentOrderStatus = 1;
                    break;
                case "running":
                    currentOrderStatus = 2;
                    break;
                case "done":
                    currentOrderStatus = 4;
                    clearInterval(pollingInterval);
                    pollingInterval = null;
                    break;
                case "error":
                    currentOrderStatus = 1;
                    clearInterval(pollingInterval);
                    pollingInterval = null;
                    alert("Task ist fehlgeschlagen!");
                    break;
            }

            updateStepperStatus(currentOrderStatus);

        } catch (err) {
            console.log("Polling Fehler:", err.message);
            // auch hier nicht abbrechen → weiter pollen
        }
    }, 2000);
}