// Ladda JSON-data och rendera spelet
async function renderGame() {
  const gameContainer = document.getElementById("game-container");
  const numberOfItems = 3; // Adjust this to select number of colors

  try {
      // Hämta JSON-data
      const response = await fetch("items.json");
      const items = await response.json();
      console.log("all items: ", items);

      // Limit to selected number of colors
      const selectedItems = items.slice(0, numberOfItems);
      console.log("Valda items:", selectedItems);

      // Skapa dynamiska staplar
      const stacks = generateShuffledStacks(selectedItems);

      // Rendera staplar
      stacks.forEach(stack => {
          const stackDiv = document.createElement("div");
          stackDiv.className = "stack";

          stack.forEach(item => {
              const itemImg = document.createElement("img");
              itemImg.src = item.image;
              itemImg.alt = item.name;
              itemImg.classList.add("item-piece", `color-${item.name}`);
              stackDiv.appendChild(itemImg);
          });

          gameContainer.appendChild(stackDiv);
      });

      // Lägg till tomma platser
      for (let i = 0; i < 2; i++) {
          const emptySlot = document.createElement("div");
          emptySlot.className = "stack";
          gameContainer.appendChild(emptySlot);
      }
  } catch (error) {
      console.error("Failed to load JSON data:", error);
  }
}

// Generera blandade staplar från färgerna
function generateShuffledStacks(items) {
  const allItems = [];
  items.forEach(item => {
      for (let i = 0; i < 4; i++) {
          allItems.push(item);
      }
  });

  // Blanda färger
  allItems.sort(() => Math.random() - 0.5);

  // Dela upp i staplar
  const stacks = [];
  for (let i = 0; i < allItems.length; i += 4) {
      stacks.push(allItems.slice(i, i + 4));
  }
  return stacks;
}

//*__________________________Click and place functions ___________________________________________

let selectedItem; // Spårar vilket objekt som är valt


function addClickHandlers() {
    const items = document.querySelectorAll(".item-piece:first-child");
    const slots = document.querySelectorAll(".stack");

    // Klicka på ett objekt för att välja det
    items.forEach(item => {
        item.addEventListener("click", () => selectItem(item));
    });

    // Klicka på en stack eller tom plats för att placera det
    slots.forEach(slot => {
        slot.addEventListener("click", () => placeItem(slot));
    });

    // Klicka utanför stackar för att avmarkera
    document.addEventListener("click", event => {
        if (!event.target.classList.contains("item-piece") && !event.target.classList.contains("stack")) {
            deselectItem();
        }
    });
}

function selectItem(item) {
  
    if (selectedItem) {
        deselectItem(); // Avmarkera tidigare objekt om ett redan är valt
    }

    selectedItem = item; // Markera nytt objekt som valt
    item.classList.add("selected"); // Lägg till visuell indikation
}

function deselectItem() {
    if (selectedItem) {
        selectedItem.classList.remove("selected");
        selectedItem = null;
    }
}

function placeItem(target) {
    if (!selectedItem) return; // Om inget objekt är valt, gör inget

    // Kontrollera om platsen är giltig
    if (isValidMove(target)) {
        addToStack(target, selectedItem); // Placera objektet i stacken
        addClickHandlers();
        deselectItem(); // Avmarkera efter placering
        
    } else {
        console.error("Ogiltigt drag!"); // Logga om draget är ogiltigt
    }
}

function isValidMove(target) {
    const itemsInTarget = target.querySelectorAll(".item-piece");

    // Max fyra objekt per stapel
    if (itemsInTarget.length >= 4) {
        return false; // Ogiltigt: Stapeln är full

    }

    // Om stapeln är tom
    if (itemsInTarget.length === 0) {
        return true; // Giltigt: Tom plats
    }

    // Om översta objektet i stapeln har samma name som det som dras
    if (itemsInTarget[itemsInTarget.length - 1].alt === selectedItem.alt) {
        return true; // Giltigt: Samma färg
    }

    return false; // Ogiltigt annars
}


function addToStack(target, item) {
    // Lägg objektet i stacken
    target.appendChild(item);

    // Uppdatera positionen för alla objekt i stacken
    const itemsInTarget = target.querySelectorAll(".item-piece");
    // itemsInTarget.forEach((el, index) => {
    //     el.style.position = "absolute";
    //     el.style.bottom = `${index * 35}px`; 
    //     el.style.left = "0";
    // });
}

renderGame().then(addClickHandlers);
