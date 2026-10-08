const listSection = document.getElementById("list-section");
const emptyList = document.getElementById("empty-list");
emptyList.classList.add("empty");
const createNewListButton = document.getElementById("create-new-list-button");

if (createNewListButton) {
    const parent = createNewListButton.parentElement;

    createNewListButton.addEventListener("mouseenter", () => {
        parent.classList.add("highlight");
    });

    createNewListButton.addEventListener("mouseleave", () => {
        parent.classList.remove("highlight");
    });

    createNewListButton.addEventListener("click", () => {
        createNewList(emptyList);
    })
}
else {
    console.log("NO BUTTON FOUND");
}

function createListBox(list) {
    const listBox = document.createElement("div");
    listBox.classList.add("list-box");
    listBox.id = `list-${list.id}`;

    const titleElement = document.createElement("h4");
    titleElement.classList.add("list-title");
    titleElement.textContent = list.title;

    listBox.appendChild(titleElement);
    return listBox;
}

async function loadLists() {
    const lists = await getListsFromBackend();
    const container = emptyList.parentElement;

    lists.forEach(list => {
        const listBox = createListBox(list);
        container.insertBefore(listBox, emptyList);
    });
}

loadLists();

function createNewList(callerElement) {
    const parent = callerElement.parentElement;
    const newList = document.createElement("div");
    newList.classList.add("list-box");

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.placeholder = "Enter list title";

    console.log("Created new list input field", titleInput);

    titleInput.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
            const title = titleInput.value.trim();
            if (title) {
                // Spara till backend här
                const savedList = await saveListToBackend(title);
                if (savedList) {
                    console.log("List saved to backend:", savedList);
                    // Uppdatera listan i UI med den nya listan
                    const titleElement = document.createElement("h4");
                    titleElement.textContent = savedList.title; // Använd titeln från backend-svaret
                    titleInput.replaceWith(titleElement);
                    newList.id = `list-${savedList.id}`; // Sätt ID för den nya listan baserat på backend-svaret
                } else {
                    console.error("Failed to save list to backend.");
                }
            }
        }
    });
    newList.append(titleInput);
    console.log("newList efter append:", newList);
    parent.insertBefore(newList, callerElement);

}

async function getListsFromBackend() {
    try {
        const response = await fetch('/api/lists', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();

        if (response.ok) {
            console.log("Fetched lists from backend:", data);
            return data; // Return the fetched lists
        } else {
            console.error("Failed to fetch lists from backend:", data);
            return []; // Return an empty array on failure
        }
    } catch (error) {
        console.error("Error fetching lists from backend:", error);
        return []; // Return an empty array on error
    }
}



async function saveListToBackend(title) {
    try {
        const response = await fetch('/api/lists', {
            method: 'POST',
            body: JSON.stringify({ title }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();

        if (response.ok) {
            console.log("Saved new list to backend:", data);
            return data; // Return the saved list
        } else {
            console.error("Error saving new list to backend:", data);
            return null; // Return null on failure
        }
    } catch (error) {
        console.error("Error saving new list to backend:", error);
        return null; // Return null on error
    }
}

async function deleteListFromBackend(listId) {
    try {
        const response = await fetch(`/api/lists/${listId}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            console.log(`List with ID ${listId} deleted successfully.`);
            document.getElementById(`list-${listId}`)?.remove();
            return true;
        } else {
            console.error(`Failed to delete list with ID ${listId}.`);
            return false;
        }
    } catch (error) {
        console.error(`Error deleting list with ID ${listId}:`, error);
        return false;
    }
}

function updateListInBackend(listId, newTitle) {
    // Här kan du implementera logik för att uppdatera listan i backend
}