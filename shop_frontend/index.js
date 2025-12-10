// =================================================================
// 1. KONFIGURATION
// =================================================================

// Lesbare Namen für die Alert-Box (muss alle verwendeten Hex-Codes abdecken)
const colorNames = {
    '#FF0000': 'rot',
    '#000000': 'schwarz',
    '#808080': 'grau'
};

let colorsFromJson = {}

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
        // Die aktuelle Hex-Farbe abrufen (aus colorsFromJson)
        const hexColor = colorsFromJson[part][currentColorsIndex[part]];
        
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
    const colors = colorsFromJson[part];

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
// FARBEN AUS JSON LADEN
// =================================================================

async function loadColorsFromJson() {
    try {
        console.log('Starte Laden von colors.json...');
        const response = await fetch('../data/colors.json');
        const response2 = await fetch('../data/parts.json');
        
        if (!response.ok) throw new Error('JSON nicht gefunden');
        
        const colors = await response.json();
        console.log('Daten geladen:', colors);

        
        // Mapping von Namen zu Hex-Codes
        const nameToHex = {
            'rot': '#FF0000',
            'schwarz': '#000000',
            'grau': '#808080'
        };
        
        // Extrahiere die Hex-Codes aus den Farbnamen
        const hexCodes = colors.colors.map(c => nameToHex[c.name.toLowerCase()]);
        
        // Baue colorsFromJson: jedes Teil hat die gleichen Farben
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

// Farben beim Laden der Seite initialisieren und Button-Listener danach registrieren
document.addEventListener('DOMContentLoaded', async () => {
    await loadColorsFromJson();
    updateLegoFigure();

    // Event Listener für den "BESTELLEN"-Button — jetzt erst nach DOM-Ready
    const addToCartBtn = document.querySelector('.add-to-cart');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            // Sammelt die aktuelle Konfiguration
            const selectedConfig = {};
            for (const part in currentColorsIndex) {
                const index = currentColorsIndex[part];
                const hexColor = colorsFromJson[part][index];
                // fallback: zeige hex, falls kein Name vorhanden
                selectedConfig[part] = colorNames[hexColor] || hexColor;
            }

            // Öffnet build.html zusätzlich in einem neuen Tab/Fenster
            const newWin = window.open('build.html', '_blank');
            if (newWin) newWin.focus();
        });
    }
});