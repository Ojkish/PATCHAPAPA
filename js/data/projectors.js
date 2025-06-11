// js/data/projectors.js

/**
 * Bibliothèque des projecteurs et de leurs modes DMX.
 * Chaque projecteur possède un modèle, une marque et
 * un tableau de modes (nom et nombre de canaux).
 */
export  const projectorLibrary = [

  // —————————————————————————————————————————————————————
  // Martin
  // —————————————————————————————————————————————————————
  {
    model: "MAC Aura",
    brand: "Martin",
    modes: [
      { name: "Std", channels: 14 },
      { name: "Ext", channels: 25 }
    ]
  },
  {
    model: "MAC Aura XB",
    brand: "Martin",
    modes: [
      { name: "Std", channels: 14 },
      { name: "Ext", channels: 25 }
    ]
  },
  {
    model: "MAC PXL",
    brand: "Martin",
    modes: [
      { name: "Compact", channels: 17 },
      { name: "Basic", channels: 32 },
      { name: "Extended", channels: 89 },
      { name: "Ludicrous", channels: 512 }
    ]
  },
  {
    model: "MAC Quantum Profile",
    brand: "Martin",
    modes: [
      { name: "Basic", channels: 19 },
      { name: "Extended", channels: 24 },
      { name: "Pixel", channels: 65 }
    ]
  },
  {
    model: "MAC Quantum Wash",
    brand: "Martin",
    modes: [
      { name: "Basic", channels: 14 },
      { name: "Extended", channels: 33 }
    ]
  },
  {
    model: "MAC Quantum Dot",
    brand: "Martin",
    modes: [
      { name: "10-ch", channels: 10 },
      { name: "26-ch", channels: 26 }
    ]
  },
  {
    model: "MAC Viper Profile",
    brand: "Martin",
    modes: [
      { name: "16-bit Basic", channels: 26 },
      { name: "16-bit Extended", channels: 29 }
    ]
  },
  {
    model: "MAC Viper AirFX",
    brand: "Martin",
    modes: [
      { name: "16-bit Basic", channels: 32 },
      { name: "16-bit Extended", channels: 58 }
    ]
  },
  {
    model: "MAC Ultra Performance",
    brand: "Martin",
    modes: [
      { name: "Basic", channels: 22 },
      { name: "Extended", channels: 26 },
      { name: "Pixel", channels: 74 }
    ]
  },
  {
    model: "MAC Ember",
    brand: "Martin",
    modes: [
      { name: "RGBW Basic", channels: 8 },
      { name: "RGBW + FX", channels: 12 }
    ]
  },
  {
    model: "MAC Ultra Performance",
    brand: "Martin",
    modes: [
      { name: "Basic", channels: 22 },
      { name: "Extended", channels: 26 },
      { name: "Pixel", channels: 74 }
    ]
  },
  {
    model: "Atomic 3000 LED",
    brand: "Martin",
    modes: [
      { name: "3ch", channels: 3 },
      { name: "4ch", channels: 4 },
      { name: "Extended", channels: 14 },
      ]
  },
  {
    model: "PAR RUSH 2 RGBW Zoom",
    brand: "Martin",
    modes: [
      { name: "5ch", channels: 5 },
      { name: "9ch", channels: 9 }
    ]
  },

  // —————————————————————————————————————————————————————
  // Robe
  // —————————————————————————————————————————————————————
  {
    model: "Megapointe",
    brand: "Robe",
    modes: [
      { name: "Mode 1", channels: 39 },
      { name: "Mode 2", channels: 34 }
    ]
  },
  {
    model: "Pointe",
    brand: "Robe",
    modes: [
      { name: "Mode 1", channels: 24 },
      { name: "Mode 2", channels: 16 },
      { name: "Mode 3", channels: 30 }
    ]
  },
  {
    model: "BMFL Spot",
    brand: "Robe",
    modes: [
      { name: "Mode 1", channels: 41 },
      { name: "Mode 2", channels: 33 }
    ]
  },
  {
    model: "BMFL Wash",
    brand: "Robe",
    modes: [
      { name: "Mode 1", channels: 25 },
      { name: "Mode 2", channels: 21 }
    ]
  },
  {
    model: "Spiider",
    brand: "Robe",
    modes: [
      { name: "1", channels: 49 },
      { name: "2", channels: 27 },
      { name: "3", channels: 33 },
      { name: "4", channels: 80 },
      { name: "5", channels: 27 },
      { name: "6", channels: 47 },
      { name: "7", channels: 91 },
      { name: "8", channels: 110 },
      { name: "9", channels: 104 },
      { name: "10", channels: 123 }
    ]
  },
  {
    model: "Esprite",
    brand: "Robe",
    modes: [
      { name: "Mode 1", channels: 49 },
      { name: "Mode 2", channels: 42 }
    ]
  },
  {
    model: "Tetra 2",
    brand: "Robe",
    modes: [
      { name: "34-ch", channels: 34 },
      { name: "56-ch", channels: 56 },
      { name: "97-ch", channels: 97 },
      { name: "115-ch", channels: 115 },
      { name: "110-ch", channels: 110 },
      { name: "128-ch", channels: 128 }
    ]
  },
  {
    model: "Viva",
    brand: "Robe",
    modes: [
      { name: "30-ch", channels: 30 },
      { name: "23-ch", channels: 23 }
    ]
  },
  {
    model: "Tarrantula",
    brand: "Robe",
    modes: [
      { name: "18-ch", channels: 18 },
      { name: "26-ch", channels: 26 },
      { name: "55-ch", channels: 55 }
    ]
  },
  {
    model: "Robin Pointe",
    brand: "Robe",
    modes: [
      { name: "Mode 1", channels: 16 },
      { name: "Mode 2", channels: 24 }
    ]
  },
  {
    model: "Robin 300 Spot",
    brand: "Robe",
    modes: [
      { name: "16-ch", channels: 16 },
      { name: "24-ch", channels: 24 }
    ]
  },
  {
    model: "Robin LEDBeam 150",
    brand: "Robe",
    modes: [
      { name: "6-ch", channels: 6 },
      { name: "10-ch", channels: 10 }
    ]
  },
  {
    model: "Robin LEDBeam 350",
    brand: "Robe",
    modes: [
      { name: "6-ch", channels: 6 },
      { name: "14-ch", channels: 14 }
    ]
  },
  

  // —————————————————————————————————————————————————————
  // Chauvet / Rogue / Maverick
  // —————————————————————————————————————————————————————
  
  {
    model: "Rogue Wash R2X",
    brand: "Chauvet",
    modes: [
      { name: "56-ch", channels: 56 },
      { name: "54-ch", channels: 54 },
      { name: "54-ch MS", channels: 54 },
      { name: "33-ch", channels: 33 },
      { name: "33-ch MS", channels: 33 },
      { name: "22-ch", channels: 22 },
      { name: "17-ch", channels: 17 },
      { name: "15-ch", channels: 15 }
    ]
  },
  {
    model: "Rogue R1 Spotlight",
    brand: "Chauvet",
    modes: [
      { name: "10-ch", channels: 10 },
      { name: "20-ch", channels: 20 }
    ]
  },
  {
    model: "Rogue R1 Beam",
    brand: "Chauvet",
    modes: [
      { name: "6-ch", channels: 6 },
      { name: "16-ch", channels: 16 }
    ]
  },
  {
    model: "Rogue RH1 Hybrid",
    brand: "Chauvet",
    modes: [
      { name: "22-ch", channels: 22 },
      { name: "44-ch", channels: 44 }
    ]
  },
  {
    model: "Maverick MK3 Profile",
    brand: "Chauvet",
    modes: [
      { name: "17-ch", channels: 17 },
      { name: "31-ch", channels: 31 }
    ]
  },
  {
    model: "Maverick MK3 Wash",
    brand: "Chauvet",
    modes: [
      { name: "18-ch", channels: 18 },
      { name: "32-ch", channels: 32 }
    ]
  },
  {
    model: "Maverick MK1 Hybrid",
    brand: "Chauvet",
    modes: [
      { name: "ARC1", channels: 11 },
      { name: "ARC1 + D", channels: 4 },
      { name: "ARC2", channels: 4 },
      { name: "ARC2 + D", channels: 5 },
     ]
  },
  {
    model: "COLORado",
    brand: "Chauvet",
    modes: [
      { name: "TOUR", channels: 11 },
      { name: "ARC1", channels: 3 },
      { name: "ARC1 + D", channels: 4 },
      { name: "ARC2", channels: 4 },
      { name: "ARC2 + D", channels: 5 },
     ]
  },
  {
    model: "Ovation-Reve E3-IP",
    brand: "Chauvet",
    modes: [
      { name: "12Ch", channels: 12 },
      { name: "14Ch1", channels: 14 },
      { name: "14Ch2", channels: 14 },
      { name: "18Ch", channels: 18 },
     ]
  },
  {
    model: "Strike4 Array",
    brand: "Chauvet",
    modes: [
      { name: "10Ch", channels: 10 },
      { name: "6Ch", channels: 6 },
      { name: "5Ch", channels: 5 },
      { name: "4Ch", channels: 4 },
      { name: "3Ch", channels: 3 },
      { name: "1Ch", channels: 1 },
     ]
  },
  
  // —————————————————————————————————————————————————————
  // Elation
  // —————————————————————————————————————————————————————
  {
    model: "KL Profile FC",
    brand: "Elation",
    modes: [
      { name: "Inten", channels: 1 },
      { name: "Comp", channels: 7 },
      { name: "Std", channels: 12 },
      { name: "Ext", channels: 19 },
      { name: "CMY", channels: 10 },
      { name: "CMY Extended", channels: 15 },
      { name: "RGB", channels: 10 },
      { name: "RGB Extended", channels: 15 },

    ]
  },
  
  
  
  
  
  {
    model: "Artiste Picasso",
    brand: "Elation",
    modes: [
      { name: "Std", channels: 36 },
      { name: "Ext", channels: 62 }
    ]
  },
  {
    model: "Artiste Picasso II",
    brand: "Elation",
    modes: [
      { name: "Std", channels: 39 },
      { name: "Ext", channels: 68 }
    ]
  },
  {
    model: "Proteus Rayzor 760",
    brand: "Elation",
    modes: [
      { name: "Standard", channels: 24 },
      { name: "Pixels", channels: 52 },
      { name: "Extended", channels: 80 },
      { name: "Sparkled", channels: 28 }
    ]
  },
  {
    model: "Proteus Hybrid",
    brand: "Elation",
    modes: [
      { name: "Basic", channels: 24 },
      { name: "Standard", channels: 26 },
      { name: "Extended", channels: 37 }
    ]
  },
  {
    model: "Platinum Beam 5R",
    brand: "Elation",
    modes: [
      { name: "11-ch", channels: 11 },
      { name: "17-ch", channels: 17 }
    ]
  },
  {
    model: "Platinum Spot 5R",
    brand: "Elation",
    modes: [
      { name: "13-ch", channels: 13 },
      { name: "19-ch", channels: 19 }
    ]
  },
  {
    model: "Platinum Wash 5R",
    brand: "Elation",
    modes: [
      { name: "10-ch", channels: 10 },
      { name: "20-ch", channels: 20 }
    ]
  },
  {
    model: "KL Panel Zoom",
    brand: "Elation",
    modes: [
      { name: "8-ch", channels: 8 },
      { name: "12-ch", channels: 12 },
      { name: "20-ch", channels: 20 }
    ]
  },
  {
    model: "Paladin Panel",
    brand: "Elation",
    modes: [
      { name: "RGB", channels: 3 },
      { name: "8bit", channels: 4 },
      { name: "16bit", channels: 8 },
      { name: "16bit Dim", channels: 10 },
      { name: "Extended", channels: 16 },
      { name: "Cells", channels: 80 },
      { name: "Cells Dim", channels: 82 },
      { name: "Ext-Cells", channels: 88 }



    ]
  },
  

  
  {
    model: "Limelight PAR L",
    brand: "Elation",
    modes: [
      { name: "RGB", channels: 4 },
      { name: "CMY", channels: 12 },
      { name: "CMY Ext", channels: 15 },
      { name: "Std", channels: 13 },
      { name: "Ext", channels: 17 },
      { name: "Std Zones", channels: 17 },
      { name: "Ext Zones", channels: 25 }

    ]
  },
  {
    model: "Fresnel 4CW",
    brand: "Elation",
    modes: [
      { name: "Dimmer", channels: 1 },
      { name: "Dimmer16bit", channels: 2 },
      { name: "3CH", channels: 3 },
      { name: "Standard", channels: 4 },
      { name: "Extended", channels: 5 },

    ]
  },
  {
    model: "Fresnel KL4",
    brand: "Elation",
    modes: [
      { name: "1CH", channels: 1 },
      { name: "2CH", channels: 2 },
      { name: "3CH", channels: 3 },
      { name: "4CH", channels: 4 },

    ]
  },
  {
    model: "Fresnel KL8 FC",
    brand: "Elation",
    modes: [
      { name: "Dimmer", channels: 1 },
      { name: "Dimmer Color", channels: 7 },
      { name: "Standard", channels: 12 },
      { name: "Extended", channels: 19 },
      { name: "CMY", channels: 10 },
      { name: "CMY Extended", channels: 15 },

    ]
  },
  {
    model: "ARENA Q7 Zoom",
    brand: "Elation",
    modes: [
      { name: "5ch", channels: 5 },
      { name: "6ch", channels: 6 },
      { name: "7ch", channels: 7 },
      { name: "9ch", channels: 9 },
      { name: "10ch", channels: 10 },
      { name: "15ch", channels: 15 },
      { name: "16ch", channels: 16 },

    ]
  },
  {
    model: "DARTZ 360",
    brand: "Elation",
    modes: [
      { name: "Basic", channels: 19 },
      { name: "Standard", channels: 22 },
      { name: "Extended", channels: 25 },

    ]
  },

  // —————————————————————————————————————————————————————
  // Vari-Lite
  // —————————————————————————————————————————————————————
  {
    model: "VL4000 Spot",
    brand: "Vari-Lite",
    modes: [
      { name: "Basic", channels: 14 },
      { name: "Extended", channels: 28 }
    ]
  },
  {
    model: "VL4000 Beam",
    brand: "Vari-Lite",
    modes: [
      { name: "Basic", channels: 14 },
      { name: "Extended", channels: 30 }
    ]
  },
  {
    model: "VL2600 Spot",
    brand: "Vari-Lite",
    modes: [
      { name: "Basic", channels: 10 },
      { name: "Extended", channels: 12 }
    ]
  },
  {
    model: "VL2600 Wash",
    brand: "Vari-Lite",
    modes: [
      { name: "Basic", channels: 20 },
      { name: "Extended", channels: 22 }
    ]
  },
  {
    model: "VLX Wash",
    brand: "Vari-Lite",
    modes: [
      { name: "Basic", channels: 16 },
      { name: "Extended", channels: 24 }
    ]
  },


  // —————————————————————————————————————————————————————
  // ETC (Electronic Theatre Controls)
  // —————————————————————————————————————————————————————
  {
    model: "Source Four LED Series 2 Lustr+",
    brand: "ETC",
    modes: [
      { name: "6-ch", channels: 6 },
      { name: "16-ch", channels: 16 }
    ]
  },
  {
    model: "Source Four LED Series 2 CYC",
    brand: "ETC",
    modes: [
      { name: "5-ch", channels: 5 },
      { name: "10-ch", channels: 10 }
    ]
  },
  {
    model: "Source Four LED Series 2 Zoom",
    brand: "ETC",
    modes: [
      { name: "7-ch", channels: 7 },
      { name: "13-ch", channels: 13 }
    ]
  },
  {
    model: "Colorsource Spot",
    brand: "ETC",
    modes: [
      { name: "4-ch", channels: 4 },
      { name: "8-ch", channels: 8 }
    ]
  },
  {
    model: "Colorsource Linear",
    brand: "ETC",
    modes: [
      { name: "4-ch", channels: 4 },
      { name: "8-ch", channels: 8 }
    ]
  },


  // —————————————————————————————————————————————————————
  // SGM
  // —————————————————————————————————————————————————————
  {
    model: "Q-7",
    brand: "SGM",
    modes: [
      { name: "Basic", channels: 8 },
      { name: "Extended", channels: 16 }
    ]
  },
  {
    model: "P-5",
    brand: "SGM",
    modes: [
      { name: "Basic", channels: 8 },
      { name: "Extended", channels: 16 }
    ]
  },
  {
    model: "G-4 Wash",
    brand: "SGM",
    modes: [
      { name: "Basic", channels: 12 },
      { name: "Extended", channels: 20 }
    ]
  },


  // —————————————————————————————————————————————————————
  // GLP
  // —————————————————————————————————————————————————————
  {
    model: "impression X4 Bar 20",
    brand: "GLP",
    modes: [
      { name: "3-ch", channels: 3 },
      { name: "6-ch", channels: 6 }
    ]
  },
  {
    model: "impression X4 Bar RGBA",
    brand: "GLP",
    modes: [
      { name: "4-ch", channels: 4 },
      { name: "8-ch", channels: 8 }
    ]
  },
  {
    model: "impression X5 Bar",
    brand: "GLP",
    modes: [
      { name: "6-ch", channels: 6 },
      { name: "12-ch", channels: 12 }
    ]
  },


  // —————————————————————————————————————————————————————
  // Ayrton
  // —————————————————————————————————————————————————————
  {
    model: "Diablo",
    brand: "Ayrton",
    modes: [
      { name: "Basic", channels: 24 },
      { name: "Extended", channels: 74 }
    ]
  },
  {
    model: "MagicPanel-R",
    brand: "Ayrton",
    modes: [
      { name: "Basic", channels: 18 },
      { name: "Extended", channels: 62 }
    ]
  },
  
  {
    model: "Ghibli",
    brand: "Ayrton",
    modes: [
      { name: "Basic", channels: 26 },
      { name: "Extended", channels: 52 }
    ]
  },
  {
    model: "RIVALE Profile",
    brand: "Ayrton",
    modes: [
      { name: "Std", channels: 42 },
      { name: "Ext", channels: 65 }
    ]
  },
 // —————————————————————————————————————————————————————
  // Starway
  // —————————————————————————————————————————————————————
  {
    model: "ToneKolor",
    brand: "Starway",
    modes: [
      { name: "15-ch", channels: 15 },
      { name: "14-ch", channels: 14 },
      { name: "10-ch", channels: 10 },
      { name: "9-ch", channels: 9 },
      { name: "8-ch", channels: 8 },
      { name: "6-ch", channels: 6 },
      { name: "4-ch", channels: 4 },
      { name: "3-ch", channels: 3 },
      { name: "1-ch", channels: 1 }
    ]
  },
  {
    model: "ParKolor",
    brand: "Starway",
    modes: [
      { name: "15ch", channels: 15 },
      { name: "10ch", channels: 10 },
      { name: "7-ch", channels: 7 },
    ]
  },
  {
    model: "Solar 1050",
    brand: "Starway",
    modes: [
      { name: "27-ch", channels: 27 },
      { name: "25-ch", channels: 25 },
      { name: "20-ch", channels: 20 },
      { name: "18-ch", channels: 18 },
      { name: "17-ch", channels: 17 },
      { name: "10-ch", channels: 10 },
      { name: "9-ch", channels: 9 },
      { name: "5-ch", channels: 5 },
      { name: "2-ch", channels: 2 },
      { name: "1-ch", channels: 1 }

    ]
  },




  // —————————————————————————————————————————————————————
  // Clay Paky
  // —————————————————————————————————————————————————————
  {
    model: "Sharpy",
    brand: "CLAY PAKY",
    modes: [
      { name: "10-ch", channels: 10 },
      { name: "11-ch", channels: 11 }
    ]
  },
  {
    model: "Sharpy Plus",
    brand: "CLAY PAKY",
    modes: [
      { name: "Standard", channels: 12 },
      { name: "RGBW", channels: 13 }
    ]
  },
  {
    model: "Sharpy Wash 330",
    brand: "CLAY PAKY",
    modes: [
      { name: "Standard", channels: 19 },
      { name: "Vector", channels: 22 }
    ]
  },
  {
    model: "Mythos",
    brand: "CLAY PAKY",
    modes: [
      { name: "Basic", channels: 24 },
      { name: "Extended", channels: 36 }
    ]
  },
  {
    model: "Scenius Profile",
    brand: "CLAY PAKY",
    modes: [
      { name: "Basic", channels: 28 },
      { name: "Extended", channels: 32 }
    ]
  },
  {
    model: "Scenius Unico",
    brand: "CLAY PAKY",
    modes: [
      { name: "Basic", channels: 17 },
      { name: "Extended", channels: 29 }
    ]
  },
  {
    model: "Xtylos",
    brand: "CLAY PAKY",
    modes: [
      { name: "Basic", channels: 24 },
      { name: "Extended", channels: 30 }
    ]
  },
  {
    model: "Axcor Profile 900",
    brand: "CLAY PAKY",
    modes: [
      { name: "Basic", channels: 16 },
      { name: "Extended", channels: 28 }
    ]
  }

];

/**
 * Initialise le <datalist> pour l'auto-complétion du nom de projecteur.
 * @param {string} datalistId - ID de la balise <datalist> à remplir
 */
export function initProjectorDatalist(datalistId) {
  const datalist = document.getElementById(datalistId);
  if (!datalist) return;
  projectorLibrary.forEach(projo => {
    const option = document.createElement('option');
    option.value = projo.model;
    datalist.appendChild(option);
  });
}
