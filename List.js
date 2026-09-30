const listSection = document.getElementById("list-section");
const createNewListButton = document.getElementById("create-new-list-button");

if (createNewListButton) {
    const parent = createNewListButton.parentElement;

    createNewListButton.addEventListener("mouseenter", () => {
        parent.classList.add("highlight");
    });

    createNewListButton.addEventListener("mouseleave", () => {
        parent.classList.remove("highlight");
    });
}
else {
    console.log("NO BUTTON FOUND");
}

function addListElement() {

}