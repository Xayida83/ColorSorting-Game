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


//*_______________Move on click_______

let selectedItem;

// Lägg till onclick-funktion för att flytta föremål mellan staplar
function enableItemMovement() {
  const stacks = document.querySelectorAll(".stack");

  stacks.forEach(stack => {
    stack.addEventListener("click", function () {
      if (!selectedItem) {
        // Välj det första föremålet i stacken
        selectedItem = stack.querySelector(".item-piece");

        if (selectedItem) {
          selectedItem.classList.add("selected"); // Lägg till visuellt stöd
        } else {
          console.log("Ingen föremål att välja.");
        }
      } else {
         // Förhindra att föremålet flyttas till samma stack det redan är i
         if (stack.contains(selectedItem)) {
          console.log("Föremålet är redan i denna stack.");
          selectedItem.classList.remove("selected");
          selectedItem = null; // Avmarkera föremålet
          return;
        }

        // Kontrollera om föremålet kan flyttas till denna stack
        const stackItems = stack.querySelectorAll(".item-piece");
        const isStackEmpty = stackItems.length === 0;
        const hasMatchingItem = Array.from(stackItems).some(item => 
          item.alt === selectedItem.alt // Jämför 'name' genom 'alt'-attributet
        );

        if ((isStackEmpty || hasMatchingItem) && stackItems.length < 4) {
          if (stack.firstChild) {
            stack.insertBefore(selectedItem, stack.firstChild); // Lägg överst
          } else {
            stack.appendChild(selectedItem); // Om stacken är tom, lägg till normalt
          }
          
          selectedItem.classList.remove("selected");
          selectedItem = null; // Avmarkera föremålet
        } else {
          console.log("Kan inte flytta föremålet till denna stack.");
          // Avmarkera föremålet vid ogiltig handling
          selectedItem.classList.remove("selected");
          selectedItem = null;
        }
      }
    });
  });
}



document.addEventListener("DOMContentLoaded", () => {
  renderGame().then(() => {
    enableItemMovement();
  });
});
// renderGame().then(addClickHandlers);
