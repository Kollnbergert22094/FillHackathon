const BACKEND = "http://10.230.18.52:3000";


let colorsFromJson = {};

const colorNames = {
    '#FF0000': 'rot',
    '#000000': 'schwarz',
    '#808080': 'grau'
};


// Variable zur Steuerung des Bestellstatus (für den Stepper)
// 1 = Bestellt, 2 = Bearbeitung, 3 = Versand, 4 = Zugestellt (je nach HTML)
let currentOrderStatus = 1; 
// let currentTaskId = null; 
// let pollingInterval = null;


/**
 * Aktualisiert den visuellen Status-Stepper basierend auf dem aktuellen Schritt.
 * (Wiederherstellung der robusten Logik)
 * @param {number} currentStepNumber - Die Nummer des aktuell aktiven Schritts (z.B. 3).
 */
function updateStepperStatus(currentStepNumber) {
    console.log("Aktualisiere Stepper auf Schritt:", currentStepNumber);
    const stepper = document.getElementById('status_stepper');
    if (!stepper) return;

    const steps = stepper.querySelectorAll('.step');
    const lines = stepper.querySelectorAll('.step_line');

    steps.forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('finished', 'current');
        if (stepNum < currentStepNumber) {
            step.classList.add('finished');
        } else if (stepNum === currentStepNumber) {
            step.classList.add('current');
        }
    });

    lines.forEach((line, index) => {
        const lineNum = index + 1;
        line.classList.remove('active', 'finished'); 
        
        if (lineNum + 1 < currentStepNumber) {
             line.classList.add('finished');
        } 
        else if (lineNum < currentStepNumber) {
            line.classList.add('active');
        }
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
// TASK POLLING
// =================================================================
async function startPollingTask() {
    try {
        // Task-ID aus JSON laden
        const resp = await fetch('../data/taskId.json');
        const json = await resp.json();
        const taskId = json.taskId;

        if (!taskId) {
            console.error('Keine Task-ID in taskId.json gefunden');
            return;
        }

        currentTaskId = taskId;

        if (pollingInterval) clearInterval(pollingInterval);

        pollingInterval = setInterval(async () => {
            try {
                const resp = await fetch(`${BACKEND}/api/task/${taskId}/status`);
                const data = await resp.json();
                if (!data?.status) return;

                switch (data.status) {
                    case 'pending': currentOrderStatus = 1; break;
                    case 'running': currentOrderStatus = 2; break;
                    case 'done':
                        currentOrderStatus = 4;
                        clearInterval(pollingInterval);
                        pollingInterval = null;
                        break;
                    case 'error':
                        currentOrderStatus = 1;
                        clearInterval(pollingInterval);
                        pollingInterval = null;
                        console.error('Task ist fehlgeschlagen!');
                        break;
                }

                updateStepperStatus(currentOrderStatus);

            } catch (err) {
                console.error('Polling Fehler:', err);
            }
        }, 2000);

    } catch (err) {
        console.error('Fehler beim Laden von taskId.json:', err);
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

// =================================================================
// 3. EVENTS (Laden und Bestellen)
// =================================================================

document.addEventListener('DOMContentLoaded', async () => {
    await loadColorsFromJson();
    updateStepperStatus(currentOrderStatus);    
    await startPollingTask();
    // startTaskFrontend();
});


fetch("../data/assemblyInstructions.json")
  .then(response => response.json())
  .then(data => {
    // Titel setzen
    document.getElementById("assembly_title").textContent = data.title;

    const stepsContainer = document.getElementById("assembly_steps");
    stepsContainer.innerHTML = "";

    // Schritte durchgehen und hinzufügen
    data.steps.forEach(step => {
      const stepElement = document.createElement("div");
      stepElement.classList.add("assembly_step");

      stepElement.innerHTML = `
        <div class="step_top">
          <div class="step_number">${step.step}</div>
          <div class="step_text">${step.text}</div>
        </div>
        <img class="step_image" src="../data/${step.image}" alt="Schritt ${step.step}">
      `;

      stepsContainer.appendChild(stepElement);
    });
  })
  .catch(err => console.error("Fehler beim Laden der JSON:", err));
