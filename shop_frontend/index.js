// =================================================================
// 1. KONFIGURATION
// =================================================================

// Verfügbare Farben pro Teil (Hex-Codes). Sie können hier weitere Farben hinzufügen.
const partColors = {
    head: ['#FF0000', '#808080', '#000000'], 
    torso: ['#FF0000', '#808080', '#000000'], 
    arms: ['#FF0000', '#808080', '#000000'], 
    legs: ['#FF0000', '#808080', '#000000']
};

// Lesbare Namen für die Alert-Box (muss alle verwendeten Hex-Codes abdecken)
const colorNames = {
    '#FF0000': 'Rot', '#808080': 'Grau', '#000000': 'Schwarz'};

// Speichert den aktuellen Index der Farbe für jedes Teil (Startwert)
const currentColorsIndex = {
    head: 0,
    torso: 0,
    arms: 0,
    legs: 0
};


// =================================================================
// 2. HAUPTFUNKTIONEN (Farbwechsel)
// =================================================================

/**
 * Aktualisiert das SVG-Bild, indem es die 'fill'-Attribute der Teile 
 * entsprechend der aktuellen Farbauswahl setzt.
 */
function updateLegoFigure() {
    const partsToUpdate = ['head', 'torso', 'arms', 'legs'];

    partsToUpdate.forEach(part => {
        // Die aktuelle Hex-Farbe abrufen
        const hexColor = partColors[part][currentColorsIndex[part]];
        
        // Das primäre SVG-Element einfärben
        const svgElement = document.getElementById(part);
        if (svgElement) {
            svgElement.setAttribute('fill', hexColor);
        }
        
        // Sonderfall: Das zweite Bein (falls vorhanden) muss auch eingefärbt werden
        if (part === 'legs') {
             const svgElement2 = document.getElementById('legs-2');
             if (svgElement2) {
                 svgElement2.setAttribute('fill', hexColor);
             }
        }
        if (part === 'arms') {
            const svgElement2 = document.getElementById('arms-2');
            if (svgElement2) {
                 svgElement2.setAttribute('fill', hexColor);
            }
        }
    });
}

/**
 * Ändert den Farbindex für ein spezifisches Teil (wird von den Pfeilen aufgerufen).
 * @param {string} part - Der Name des Teils ('head', 'torso', etc.).
 * @param {string} direction - Die Richtung ('next' oder 'prev').
 */
function changePartColor(part, direction) {
    console.log("changePartColor");
    let currentIndex = currentColorsIndex[part];
    const colors = partColors[part];

    if (direction === 'next') {
        // Gehe zum nächsten Index (Modulofunktion für kreisförmiges Wechseln)
        currentIndex = (currentIndex + 1) % colors.length;
    } else { // 'prev'
        // Gehe zum vorherigen Index (Behandelt den Überlauf in den letzten Index)
        currentIndex = (currentIndex - 1 + colors.length) % colors.length;
    }
    
    currentColorsIndex[part] = currentIndex;
    updateLegoFigure(); // Aktualisiert die Ansicht sofort
}


// =================================================================
// 3. EVENTS (Laden und Bestellen)
// =================================================================

// Stellt sicher, dass das Bild beim Laden der Seite initialisiert wird
document.addEventListener('DOMContentLoaded', updateLegoFigure);

// Event Listener für den "BESTELLEN"-Button
const addToCartBtn = document.querySelector('.add-to-cart');
if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
        // Sammelt die aktuelle Konfiguration
        const selectedConfig = {};
        for (const part in currentColorsIndex) {
            const index = currentColorsIndex[part];
            const hexColor = partColors[part][index];
            selectedConfig[part] = colorNames[hexColor];
        }

        // Ausgabe der Konfiguration (Simulation des Bestellvorgangs)
        //alert('Ihre Bestellung wird vorbereitet. Gewählte Konfiguration:\n\n' + JSON.stringify(selectedConfig, null, 2));

        // Optional: Logik zum Senden an den Server
        // fetch('/api/order', { method: 'POST', body: JSON.stringify(selectedConfig) });

        // Öffnet build.html zusätzlich in einem neuen Tab/Fenster
        const newWin = window.open('build.html', '_blank');
        if (newWin) newWin.focus();
    });
}