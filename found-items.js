const API_URL = "http://localhost:5000/api/found-items";

const foundItemForm = document.getElementById("foundItemForm");

foundItemForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const itemName =
        document.getElementById("itemName").value.trim();

    const description =
        document.getElementById("description").value.trim();

    const category =
        document.getElementById("category").value;

    const location =
        document.getElementById("location").value.trim();

    const dateFound =
        document.getElementById("dateFound").value;


    const foundItem = {
        itemName: itemName,
        description: description,
        category: category,
        location: location,
        dateFound: dateFound
    };


    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(foundItem)

        });


        if (!response.ok) {
            throw new Error("Failed to create found item.");
        }


        showSuccess(
            "Found item reported successfully."
        );


        foundItemForm.reset();


        loadFoundItems();

    } catch (error) {

        showError(
            "Unable to report found item."
        );

        console.error(error);
    }

});