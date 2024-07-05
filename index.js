document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const pokemonContainer = document.getElementById("pokecontainer");
  const pagination = document.getElementById("pagination");
  let currentPage = 1;
  const limit = 12;
  let totalPages = 1;
  let allPokemons = [];
  let paginatedPokemons = [];

  async function fetchAllPokemons() {
    const limit = 200; // Fetch in chunks of 200
    let offset = 0;
    let allData = [];
    try {
      while (true) {
        const response = await fetch(
          `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        allData = allData.concat(data.results);
        if (data.next === null) break;
        offset += limit;
      }
    } catch (error) {
      console.error("Error fetching Pokedex data:", error);
    }
    return allData;
  }

  async function fetchSpecificApi(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching Pokémon data:", error);
      return null;
    }
  }

  async function renderPoke(page = 1) {
    try {
      const offset = (page - 1) * limit;
      paginatedPokemons = allPokemons.slice(offset, offset + limit);
      pokemonContainer.innerHTML = ""; // Clear existing cards
      for (const pokemon of paginatedPokemons) {
        const specificPoke = await fetchSpecificApi(pokemon.url);
        renderPokemonCard(specificPoke);
      }
      totalPages = Math.ceil(allPokemons.length / limit);
      renderPagination();
    } catch (error) {
      console.error("Error rendering Pokémon cards:", error);
    }
  }

  function renderPokemonCard(pokemon) {
    const card = document.createElement("div");

    // Get all type names
    const typeNames = pokemon.types
      .map((typeInfo) => typeInfo.type.name)
      .join(", ");

    const cardContent = `
        <div class="bg-white shadow-lg rounded-lg overflow-hidden" id="card">
          <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
          <div class="p-3">
            <h5 class="text-2xl font-bold capitalize text-white">${pokemon.name}</h5> <!-- Increase text size -->
            <p class="text-white-700">Type: ${typeNames}</p>
          </div>
        </div>
      `;

    card.innerHTML = cardContent;
    pokemonContainer.append(card);
  }

  async function searchPoke(event) {
    event.preventDefault();
    try {
      const searchinput = searchInput.value.toLowerCase();
      const matchingPokemon = allPokemons.find(
        (pokemon) => pokemon.name.toLowerCase() === searchinput
      );

      pokemonContainer.innerHTML = ""; // Clear existing cards
      if (matchingPokemon) {
        const specificPoke = await fetchSpecificApi(matchingPokemon.url);
        renderPokemonCard(specificPoke);
      } else {
        console.log("No matching Pokémon found.");
        renderPoke(currentPage);
      }
    } catch (error) {
      console.error("Error searching Pokémon:", error);
    }
  }

  function renderPagination() {
    pagination.innerHTML = ""; // Clear existing pagination

    // Create previous button
    const prevButton = document.createElement("li");
    prevButton.classList.add("page-item", "mx-1");
    if (currentPage === 1) prevButton.classList.add("disabled");
    prevButton.innerHTML = `
          <a class="page-link" href="#" aria-label="Previous">
            <span aria-hidden="true">&laquo;</span>
          </a>
        `;
    prevButton.addEventListener("click", (event) => {
      event.preventDefault();
      if (currentPage > 1) {
        currentPage--;
        renderPoke(currentPage);
      }
    });
    pagination.appendChild(prevButton);

    // Calculate the range of pages to be displayed
    const maxPagesToShow = 9;
    let startPage = Math.max(currentPage - Math.floor(maxPagesToShow / 2), 1);
    let endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(endPage - maxPagesToShow + 1, 1);
    }

    // Create page number buttons
    for (let i = startPage; i <= endPage; i++) {
      const pageButton = document.createElement("li");
      pageButton.classList.add("page-item", "mx-1");
      if (i === currentPage) pageButton.classList.add("active-page");
      pageButton.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
      pageButton.addEventListener("click", (event) => {
        event.preventDefault();
        currentPage = i;
        renderPoke(currentPage);
      });
      pagination.appendChild(pageButton);
    }

    // Create next button
    const nextButton = document.createElement("li");
    nextButton.classList.add("page-item", "mx-1");
    if (currentPage === totalPages) nextButton.classList.add("disabled");
    nextButton.innerHTML = `
          <a class="page-link" href="#" aria-label="Next">
            <span aria-hidden="true">&raquo;</span>
          </a>
        `;
    nextButton.addEventListener("click", (event) => {
      event.preventDefault();
      if (currentPage < totalPages) {
        currentPage++;
        renderPoke(currentPage);
      }
    });
    pagination.appendChild(nextButton);
  }

  searchButton.addEventListener("click", searchPoke);

  // Fetch all Pokémon data and then render the first page
  fetchAllPokemons().then((data) => {
    allPokemons = data;
    renderPoke(currentPage);
  });
});
