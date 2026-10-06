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
                await saveListToBackend(title);
                const titleElement = document.createElement("h4");
                titleElement.textContent = title;
                titleInput.replaceWith(titleElement);
            }
        }
    });
    newList.append(titleInput);
    console.log("newList efter append:", newList);
    parent.insertBefore(newList, callerElement);
}

function getListsFromBackend() {
    // Här kan du implementera logik för att hämta listor från backend
}

function saveListToBackend(title) {
}

function deleteListFromBackend(listId) {
    fetch(`/api/lists/${listId}`, {
        method: 'DELETE',
    }).then(response => {
        if (response.ok) {
            console.log(`List with ID ${listId} deleted successfully.`);
            document.getElementById(`list-${listId}`).remove();
        } else {
            console.error(`Failed to delete list with ID ${listId}.`);
        }
    }).catch(error => {
        console.error(`Error deleting list with ID ${listId}:`, error);
    });
}

function updateListInBackend(listId, newTitle, isCompleted) {
    // Här kan du implementera logik för att uppdatera listan i backend
}