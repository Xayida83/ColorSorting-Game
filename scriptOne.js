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

//*________________Drag___________
let draggedItem = null; // Element som dras
let originalParent = null; // Ursprungsstapel

function addDragAndDrop() {
    const items = document.querySelectorAll(".item-piece");
    const slots = document.querySelectorAll("stack, .empty-slot");

    //Starta dragning 
    items.forEach(item => {
        item.addEventListener("mousedown", startDrag);
        item.addEventListener("touchstart", startDrag);
    });

    //Släpp objekt
    slots.forEach(slot => {
        slot.addEventListener("mouseup", dropItem);
        slot.addEventListener("touchend", dropItem);
    });

    //Flytta objekt
    document.addEventListener("mousemove", moveItem);
    document.addEventListener("touchmove", moveItem);

}

//* Starta dragning
function startDrag(event) {
    event.preventDefault();
    draggedItem = event.target;
    originalParent = draggedItem.parentElement;
    draggedItem.style.position = "absolute";
    draggedItem.style.zIndex = 1000;
}

//* Flytta objektet med musen/pekaren
function moveItem(event) {
    if (!draggedItem) return; 

    const x = event.clientX || event.touches[0].clientX;
    const y = event.clientY || event.touches[0].clientY;

    draggedItem.style.left = `${x - draggedItem.offsetWidth / 2}px`;
    draggedItem.style.top = `${y - draggedItem.offsetHeight / 2}px`; 
}

//* Släpp objektet
function dropItem(event) {
    if(!draggedItem) return;

    // Hitta element vid droppositionen
    const dropTarget = document.elementFromPoint(
        event.clientX || event.changedTouches[0].clientX,
        event.clientY || event.changedTouches[0].clientY
    );

     // Kontrollera om det är en giltig plats
     if (dropTarget && (dropTarget.classList.contains("stack") || dropTarget.classList.contains("empty-slot"))) {
        if (isValidMove(dropTarget)) {
            // Lägg till objektet i stapeln korrekt
            addToStack(dropTarget, draggedItem);
        } else {
            console.error("Ogiltigt drag!");
            originalParent.appendChild(draggedItem); // Återställ om ogiltigt drag
        }
    } else {
        // Återställ om det inte är en giltig plats
        originalParent.appendChild(draggedItem);
    }

   // Återställ stilar
   resetDraggedItem();
}

// Lägg till objektet i stapeln korrekt
function addToStack(target, item) {
    // Lägg objektet i stapeln
    target.appendChild(item);

    // Om platsen är en tom slot, byt klass till stack
    if (target.classList.contains("empty-slot")) {
        target.classList.remove("empty-slot");
        target.classList.add("stack");
    }

    // Justera visuellt genom att placera objektet korrekt i layouten
    const itemsInTarget = target.querySelectorAll(".item-piece");
    itemsInTarget.forEach((el, index) => {
        el.className = `item-piece stacked position-${index}`; 
    });
}

// Kontrollera om flytten är giltig
function isValidMove(target) {
    const itemsInTarget = target.querySelectorAll(".item-piece");

     // Max fyra objekt per stapel
     if (itemsInTarget.length >= 4) {
        return false; // Ogiltigt: Stapeln är full
    }

    // Om platsen är tom (empty-slot) eller stapeln är tom
    if (target.classList.contains("empty-slot") && itemsInTarget.length === 0) {
        return true; // Giltigt: Tom plats
    }

     // Om det är en stapel och översta objektet har samma name som det som dras
    if (
        target.classList.contains("stack") &&
        itemsInTarget.length > 0 &&
        itemsInTarget[itemsInTarget.length - 1].alt === draggedItem.alt
    ) {
        return true; // Giltigt: Samma färg
    }
    return false; // Ogiltigt: Annars
}

// Återställ stilar och variabler efter drag
function resetDraggedItem() {
    draggedItem.style.position = "";
    draggedItem.style.zIndex = "";
    draggedItem.style.left = "";
    draggedItem.style.top = "";

    draggedItem = null; // Släpp objektet
    originalParent = null; // Återställ ursprung
}

renderGame().then(addDragAndDrop);