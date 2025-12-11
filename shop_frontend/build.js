
let colorsFromJson = {};

const colorNames = {
    '#FF0000': 'rot',
    '#000000': 'schwarz',
    '#808080': 'grau'
};

// Variable zur Steuerung des Bestellstatus (für den Stepper)
// 1 = Bestellt, 2 = Bearbeitung, 3 = Versand, 4 = Zugestellt (je nach HTML)
let currentOrderStatus = 4; 


/**
 * Aktualisiert den visuellen Status-Stepper basierend auf dem aktuellen Schritt.
 * @param {number} currentStepNumber - Die Nummer des aktuell aktiven Schritts (z.B. 2).
 */
function updateStepperStatus(currentStepNumber) {
    console.log("Aktualisiere Stepper auf Schritt:", currentStepNumber);
    const stepper = document.getElementById('status_stepper');
    if (!stepper) return;

    const steps = stepper.querySelectorAll('.step');
    const lines = stepper.querySelectorAll('.step_line');

    // Schritte zurücksetzen
    steps.forEach((step, index) => {
        step.classList.remove('finished', 'current');
        const stepNum = index + 1;
        if (stepNum < currentStepNumber) step.classList.add('finished');
        else if (stepNum === currentStepNumber) step.classList.add('current');
    });

    // Linien zurücksetzen
    lines.forEach(line => line.classList.remove('active', 'finished'));

    // Hardcodierte Linien
    if (currentStepNumber > 2) {
        lines[0].classList.add('finished'); // Linie 1 grün, wenn Step 2 fertig
    }
    if (currentStepNumber > 3) {
        lines[1].classList.add('finished'); // Linie 2 grün, wenn Step 3 fertig
    }

    // Linie zum aktuellen Step rot
    if (currentStepNumber === 2) {
        lines[0].classList.add('active');
    } else if (currentStepNumber === 3) {
        lines[1].classList.add('active');
    }
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
    updateStepperStatus(currentOrderStatus);
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
