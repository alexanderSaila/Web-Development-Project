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

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "X";
    deleteButton.classList.add("delete-button");
    deleteButton.addEventListener("click", async () => {
        const confirmed = confirm(`Are you sure you want to delete the list "${list.title}"?`);
        if (confirmed) {
            const success = await deleteListFromBackend(list.id);
            if (success) {
                listBox.remove();
            } else {
                alert("Failed to delete the list. Please try again.");
            }
        }
    });
    const titleDiv = document.createElement("div");
    titleDiv.classList.add("list-title-container");
    titleDiv.appendChild(titleElement);
    titleDiv.appendChild(deleteButton);

    listBox.appendChild(titleDiv);
    return listBox;
}

async function loadLists() {
    const lists = await getListsFromBackend();
    const container = emptyList.parentElement;

    console.log(lists);

    for(list of lists){
        const listBox = createListBox(list);
        container.insertBefore(listBox, emptyList);

        const elementContainer = await loadListElements(list.id);
        listBox.append(elementContainer);
    };
}

loadLists();

async function loadListElements(listId) {
    const container = document.createElement("div");
    container.classList.add("list-element-container");

    const listElements = await getListElementsFromBackend(listId);

    console.log(listElements);

    for(listElement of listElements){
        const tempElement = document.createElement("li");
        tempElement.classList.add("list-element");
        tempElement.textContent = listElement.title;

        container.append(tempElement);
    }
    return container;
}

function createNewList(callerElement) {
    const parent = callerElement.parentElement;
    const existing = parent.querySelector(".new-list");

    if (existing) {
        console.error("New list already exists. Not creating another one.");
        existing.querySelector("input").focus();
        return;
    }

    const newList = document.createElement("div");
    newList.classList.add("list-box");
    newList.classList.add("new-list");

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
                    newList.replaceWith(createListBox(savedList));
                } else {
                    console.error("Failed to save the new list. Please try again.");
                }
            }
        } else if (e.key === "Escape") {
            newList.remove();
        }
    });


    newList.append(titleInput);
    console.log("newList efter append:", newList);
    parent.insertBefore(newList, callerElement);
    titleInput.focus();

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

async function getListElementsFromBackend(listId) {
    try {
        const response = await fetch(`/api/lists/${listId}/elements`, {
            method: "GET",
            header: {
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            data = await response.json();
            return data.elements;
        }
    } catch (e) {
        console.error("Failed to get ListElements from backend", e);
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