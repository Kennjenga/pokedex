document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const pokemonContainer = document.getElementById("pokecontainer");
  const pagination = document.getElementById("pagination");
  const typeFilter = document.getElementById("typeFilter");
  const modal = document.getElementById("pokemonModal");
  const modalDetails = document.getElementById("modalDetails");
  const closeModal = document.querySelector(".close");

  let currentPage = 1;
  const limit = 12;
  let totalPages = 1;
  let allPokemons = [];
  let filteredPokemons = [];

  const fetchAllPokemons = async () => {
    const limit = 200;
    let offset = 0;
    let allData = [];

    try {
      while (true) {
        const response = await fetch(
          `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`
        );
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        allData = [...allData, ...data.results];
        if (!data.next) break;
        offset += limit;
      }
    } catch (error) {
      console.error("Error fetching Pokedex data:", error);
    }

    return allData;
  };

  const fetchSpecificApi = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error("Error fetching Pokémon data:", error);
      return null;
    }
  };

  const renderPoke = async (page = 1) => {
    const offset = (page - 1) * limit;
    const paginatedPokemons = filteredPokemons.slice(offset, offset + limit);
    pokemonContainer.innerHTML = ""; // Clear existing cards

    const pokemonPromises = paginatedPokemons.map((pokemon) =>
      fetchSpecificApi(pokemon.url)
    );
    const specificPokemons = await Promise.all(pokemonPromises);
    specificPokemons.forEach((specificPoke) => renderPokemonCard(specificPoke));

    totalPages = Math.ceil(filteredPokemons.length / limit);
    renderPagination();
  };

  const renderPokemonCard = (pokemon) => {
    const card = document.createElement("div");
    const typeNames = pokemon.types
      .map((typeInfo) => typeInfo.type.name)
      .join(", ");

    card.innerHTML = `
      <div class="bg-white shadow-lg rounded-lg overflow-hidden flex sm:flex-col justify-center items-start px-3" id="card">
        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
        <div class="p-3">
          <h5 class="text-2xl font-bold capitalize text-white">${pokemon.name}</h5>
          <p class="text-white">Type: ${typeNames}</p>
          <button class="bg-green-500 px-2 py-1 mt-2 hover:bg-green-700 rounded" id="more-details-btn" data-url="${pokemon.url}">More Details</button>
        </div>
      </div>
    `;

    card
      .querySelector("#more-details-btn")
      .addEventListener("click", async () => {
        const specificPoke = await fetchSpecificApi(
          `https://pokeapi.co/api/v2/pokemon/${pokemon.name}`
        );
        displayPokemonDetails(specificPoke);
      });

    pokemonContainer.append(card);
  };

  const displayPokemonDetails = (pokemon) => {
    const abilities = pokemon.abilities
      .map((ability) => ability.ability.name)
      .join(", ");
    const stats = pokemon.stats
      .map(
        (stat) =>
          `<li  class="text-black">${stat.stat.name}: ${stat.base_stat}</li>`
      )
      .join("");

    modalDetails.innerHTML = `
      <div class="rounded-lg overflow-hidden p-5">
        <h3 class="text-3xl font-bold capitalize text-black">${
          pokemon.name
        }</h3>
        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
        <p class="text-black">Type: ${pokemon.types
          .map((typeInfo) => typeInfo.type.name)
          .join(", ")}</p>
        <p class="text-black">Abilities: ${abilities}</p>
        <ul class="text-black">Stats: ${stats}</ul>
      </div>
    `;
    modal.style.display = "block";
  };

  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === modal) modal.style.display = "none";
  });

  const fetchTypes = async (type) => {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
      const data = await response.json();
      return data.pokemon.map((p) => p.pokemon);
    } catch (error) {
      console.error("Error fetching type data:", error);
    }
  };

  const fetchspecificTypes = async () => {
    const type = typeFilter.value.toLowerCase();
    if (type === "all") {
      filteredPokemons = allPokemons;
    } else {
      filteredPokemons = await fetchTypes(type);
    }
    currentPage = 1;
    renderPoke(currentPage);
  };

  const searchPoke = async (event) => {
    event.preventDefault();
    const searchinput = searchInput.value.toLowerCase();
    const matchingPokemon = allPokemons.find(
      (pokemon) => pokemon.name.toLowerCase() === searchinput
    );

    pokemonContainer.innerHTML = ""; // Clear existing cards
    if (matchingPokemon) {
      const specificPoke = await fetchSpecificApi(matchingPokemon.url);
      renderPokemonCard(specificPoke);
    } else {
      pokemonContainer.innerHTML = `<div class="text-center text-red-500">No Pokémon found with the name "${searchinput}".</div>`;
      renderPoke(currentPage);
    }
  };

  const renderPagination = () => {
    pagination.innerHTML = ""; // Clear existing pagination

    const createPageItem = (page, label, disabled = false) => {
      const pageItem = document.createElement("li");
      pageItem.classList.add(
        "page-item",
        "hover:text-2xl",
        "hover:text-green-500",
        "mx-1",
        "max-w-5",
        "text-xl"
      );
      if (disabled) pageItem.classList.add("disabled");
      if (page === currentPage) pageItem.classList.add("active-page");

      pageItem.innerHTML = `<a class="page-link" href="#" aria-label="${label}">${label}</a>`;
      pageItem.addEventListener("click", (event) => {
        event.preventDefault();
        if (!disabled && page !== currentPage) {
          currentPage = page;
          renderPoke(currentPage);
        }
      });

      return pageItem;
    };

    pagination.append(
      createPageItem(currentPage - 1, "&laquo;", currentPage === 1)
    );

    const maxPagesToShow = 9;
    let startPage = Math.max(currentPage - Math.floor(maxPagesToShow / 2), 1);
    let endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(endPage - maxPagesToShow + 1, 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pagination.append(createPageItem(i, i));
    }

    pagination.append(
      createPageItem(currentPage + 1, "&raquo;", currentPage === totalPages)
    );
  };

  searchButton.addEventListener("click", searchPoke);
  typeFilter.addEventListener("change", fetchspecificTypes);

  fetchAllPokemons().then((data) => {
    allPokemons = data;
    filteredPokemons = allPokemons; // Initially, all Pokémon are displayed
    renderPoke(currentPage);
  });
});
