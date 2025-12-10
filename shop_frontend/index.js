// =================================================================
// 1. KONFIGURATION
// =================================================================

// Lesbare Namen für die Alert-Box (muss alle verwendeten Hex-Codes abdecken)
const colorNames = {
    '#FF0000': 'Rot', '#808080': 'Grau', '#000000': 'Schwarz'
};

let colorsFromJson = {};

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
        console.log('Response Status:', response.status);
        
        if (!response.ok) throw new Error('JSON nicht gefunden (Status: ' + response.status + ')');
        
        colorsFromJson = await response.json();
        console.log('Farben erfolgreich geladen:', colorsFromJson);
        
        // Prüfe ob die Daten korrekt sind
        if (!colorsFromJson.head || colorsFromJson.head.length === 0) {
            throw new Error('colors.json hat ungültige Struktur');
        }
    } catch (err) {
        console.error('Fehler beim Laden der colors.json:', err);
        alert('FEHLER: colors.json konnte nicht geladen werden!\n\n' + err.message);
    }
}

// =================================================================
// 3. EVENTS (Laden und Bestellen)
// =================================================================

// Farben beim Laden der Seite initialisieren
document.addEventListener('DOMContentLoaded', () => {
    loadColorsFromJson();
    updateLegoFigure();
});

// Event Listener für den "BESTELLEN"-Button
const addToCartBtn = document.querySelector('.add-to-cart');
if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
        // Sammelt die aktuelle Konfiguration
        const selectedConfig = {};
        for (const part in currentColorsIndex) {
            const index = currentColorsIndex[part];
            const hexColor = colorsFromJson[part][index];
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