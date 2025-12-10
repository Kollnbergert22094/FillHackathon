// =================================================================
// 1. KONFIGURATION
// =================================================================

const colorNames = {
    '#FF0000': 'rot',
    '#000000': 'schwarz',
    '#808080': 'grau'
};

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
    const partsToUpdate = ['head', 'torso', 'arms', 'legs'];

    partsToUpdate.forEach(part => {
        // Sichere Abfrage: falls colorsFromJson noch leer -> Fallback
        const partColors = colorsFromJson[part] || ['#000000'];
        const hexColor = partColors[currentColorsIndex[part]] || '#000000';
        
        const svgElement = document.getElementById(part);
        if (svgElement) {
            svgElement.setAttribute('fill', hexColor);
        }
        
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
                const index = currentColorsIndex[part];
                const partColors = colorsFromJson[part] || ['#000000'];
                const hexColor = partColors[index] || '#000000';
                selectedConfig[part] = colorNames[hexColor] || hexColor;
            }

            console.log('Config:', selectedConfig);
            const newWin = window.open('build.html', '_blank');
            if (newWin) newWin.focus();
        });
    }
});