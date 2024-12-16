// Ladda JSON-data och rendera spelet
async function renderGame() {
  const gameContainer = document.getElementById("game-container");
  const numberOfItems = 3; // Adjust this to select number of colors
  let stackIdCounter = 0; // Räknare för stack-ID
  let itemIdCounter = 0; // Räknare för item-ID

  try {
      // Hämta JSON-data
      const response = await fetch("items.json");
      const items = await response.json();
      

      // Limit to selected number of colors
      const selectedItems = items.slice(0, numberOfItems);

      // Skapa dynamiska staplar
      const stacks = generateShuffledStacks(selectedItems);

      // Rendera staplar
      stacks.forEach(stack => {
          const stackDiv = document.createElement("div");
          stackDiv.className = "stack";
          stackDiv.id = `stack-${stackIdCounter++}`; // Unikt ID för stack

          stack.forEach(item => {
              const itemImg = document.createElement("img");
              itemImg.src = item.image;
              itemImg.alt = item.name;
              itemImg.classList.add("item-piece", `color-${item.name}`);
              itemImg.id = `item-${itemIdCounter++}`; // Unikt ID för item
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
  const stacks = document.querySelectorAll(".stack");

  stacks.forEach(stack => {
    stack.addEventListener("click", () => {
        console.log(`Clicked on stack: ${stack.id}`); // Debug-logg
        placeItem(stack.id);
    });
});
  // Ta bort eventlyssnare innan vi lägger till nya för att undvika duplicering
  stacks.forEach(stack => {
      const firstChild = stack.firstElementChild;

       // Lägg till eventlyssnare på första barnet
       if (firstChild) {
        const itemId = firstChild.id;
        const stackId = stack.id;
        firstChild.addEventListener("click", () => selectItem(itemId, stackId));
      }
      // Lägg till eventlyssnare för stacken själv
      stack.addEventListener("click", () => placeItem(stack.id));
  });

  // // Lägg till eventlyssnare på första barnet i varje stack
  // stacks.forEach(stack => {
  //     const firstChild = stack.firstElementChild;
  //     if (firstChild) {
  //         firstChild.addEventListener("click", () => selectItem(firstChild));
  //     }
  // });

  // // Lägg till eventlyssnare på tomma platser för att kunna placera objekt
  // stacks.forEach(stack => {
  //     stack.addEventListener("click", () => placeItem(stack));
  // });

  // // Klicka utanför stackar för att avmarkera
  // document.addEventListener("click", event => {
  //     if (!event.target.classList.contains("item-piece") && !event.target.classList.contains("stack")) {
  //         deselectItem();
  //     }
  // });
}


function selectItem(itemId, stackId) {
  
    if (selectedItem) {
        deselectItem(); // Avmarkera tidigare objekt om ett redan är valt
    }

     // Hämta objektet och markera det som valt
     const item = document.getElementById(itemId);
     selectedItem = { id: itemId, element: item, stackId };
     item.classList.add("selected");

    // selectedItem = item; // Markera nytt objekt som valt
    // item.classList.add("selected"); // Lägg till visuell indikation
}

function deselectItem() {
    if (selectedItem) {
        selectedItem.classList.remove("selected");
        selectedItem = null;
    }
}

function placeItem(targetStackId) {
    if (!selectedItem) return; // Om inget objekt är valt, gör inget

    const targetStack = document.getElementById(targetStackId);

    if (isValidMove(targetStackId)) {
      const itemElement = document.getElementById(selectedItem.id);
      targetStack.appendChild(itemElement);
      deselectItem();
      addClickHandlers(); // Uppdatera eventlyssnare
  } else {
      console.error("Ogiltigt drag!");
  }
}

function isValidMove(targetStackId) {
  const targetStack = document.getElementById(targetStackId);
  const itemsInTarget = targetStack.querySelectorAll(".item-piece");

  if (itemsInTarget.length >= 4) {
      return false; // Stacken är full
  }

  if (itemsInTarget.length === 0) {
      return true; // Stacken är tom
  }

  const topItem = itemsInTarget[itemsInTarget.length - 1];
  return topItem.alt === selectedItem.element.alt; // Kontrollera om färger matchar
}


function addToStack(target, item) {
    // Lägg objektet i stacken
    target.appendChild(item);

    // Uppdatera positionen för alla objekt i stacken
    const itemsInTarget = target.querySelectorAll(".item-piece");
}


document.addEventListener("DOMContentLoaded", () => {
  renderGame().then(addClickHandlers);
});
// renderGame().then(addClickHandlers);
