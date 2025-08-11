// DOM elements 
const resultsEl = document.getElementById('results');
const detailsEl = document.getElementById('recipeDetails');
const favListEl = document.getElementById('favoritesList');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const paginationEl = document.querySelector('.pagination');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

let currentPage = 1, recipesCache = [], lastQuery = "";

// Central API function 
const API_BASE = "https://www.themealdb.com/api/json/v1/1/";

async function fetchFromAPI(endpoint, params ) {
  const url = new URL(API_BASE + endpoint);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  try {
    const res = await fetch(url);
    const data = await res.json();
    return data;

  } catch (err) {
    console.error(`API error at ${url}:`, err);
    throw err;
  }
}

// Search triggers (click + Enter) 

function triggerSearch() {
  const term = searchInput.value.trim();
  if (!term) return alert("Type something to search");
  lastQuery = term;
  currentPage = 1;
  getRecipes(term);
}

searchBtn.addEventListener('click', triggerSearch);
searchInput.addEventListener('keypress', e => e.key === "Enter" && triggerSearch());


// Fetch recipes

async function getRecipes(query) {
  let data;

  if (query.includes(',')) {
    const ingredients = query.split(',').map(s => s.trim()).filter(Boolean).join(',');
    data = await fetchFromAPI("filter.php", { i: ingredients }); // API #1
  
  } else {
    data = await fetchFromAPI("search.php", { s: query }); // API #2
  }

  if (!data.meals) {
    resultsEl.innerHTML = `<p>No recipes found.</p>`;
    paginationEl.style.display = "none";
    recipesCache = [];
    return;
 
  }
  recipesCache = data.meals;
  showPage();
}


//  Pagination 

function showPage() {
  const perPage = 6;
  const totalPages = Math.ceil(recipesCache.length / perPage);
  paginationEl.style.display = totalPages > 1 ? "flex" : "none";
  currentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const pageItems = recipesCache.slice((currentPage - 1) * perPage, currentPage * perPage);
  renderCards(pageItems);

  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;
}
prevBtn.onclick = () => (currentPage--, showPage());
nextBtn.onclick = () => (currentPage++, showPage());


// Render recipe cards

function renderCards(list) {
  resultsEl.innerHTML = "";
  detailsEl.style.display = "none";

  list.forEach(meal => {
    const card = document.createElement("div");
    card.className = "recipe";
    card.innerHTML = `
      <img src="${meal.strMealThumb || ''}" alt="${meal.strMeal || ''}">
      <h3>${meal.strMeal || 'No title'}</h3>
    `;
    const btn = document.createElement("button");
    btn.textContent = "View Details";
    btn.onclick = () => loadDetails(meal.idMeal);
    card.appendChild(btn);
    resultsEl.appendChild(card);
  });
}



// Load and show View Details
async function loadDetails(id) {
  const data = await fetchFromAPI("lookup.php", { i: id }); // API #3
  if (data.meals && data.meals[0]) buildDetails(data.meals[0]);
}


function buildDetails(meal) {
  const ingredients = Array.from({ length: 20 }, (_, i) => {
    const ing = meal[`strIngredient${i + 1}`]?.trim();
    const measure = meal[`strMeasure${i + 1}`]?.trim();
    return ing ? `${ing}${measure ? ` - ${measure}` : ''}` : null;
  }).filter(Boolean);

  detailsEl.innerHTML = `
    <h2>${meal.strMeal}</h2>
    <img src="${meal.strMealThumb}" style="max-width:100%">
    <h3>Ingredients:</h3>
    <ul>${ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
    <h3>Instructions:</h3>
    <p>${meal.strInstructions || ''}</p>
  `;

  const favBtn = document.createElement("button");
  favBtn.textContent = "Add to Favorites";
  favBtn.onclick = () => addFavorite(meal.idMeal, meal.strMeal, meal.strMealThumb);
  detailsEl.appendChild(favBtn);

  detailsEl.style.display = "block";
  detailsEl.scrollIntoView({ behavior: "smooth" });
}


//Favorites
function addFavorite(id, name, image) {
  const favs = JSON.parse(localStorage.getItem("favorites")) || [];
  if (favs.some(f => f.id == id))
     return alert ("Already in favorites");
  favs.push({ id, name, image });
  localStorage.setItem("favorites", JSON.stringify(favs));
  renderFavorites();
}

function removeFavorite(id) {
  const favs = (JSON.parse(localStorage.getItem("favorites")) || []).filter(f => f.id != id);
  localStorage.setItem("favorites", JSON.stringify(favs));
  renderFavorites();
}

function renderFavorites() {
  const favs = JSON.parse(localStorage.getItem("favorites")) || [];
  favListEl.innerHTML = favs.length ? "" : "No favorites yet.";
  favs.forEach(f => {
    const div = document.createElement("div");
    div.className = "fav-item";
    div.innerHTML = `
      <div class="fav-left">
        <img src="${f.image}" width="50" alt="${f.name}">
        <span>${f.name}</span>
      </div>
    `;
    const btn = document.createElement("button");
    btn.textContent = "Remove";
    btn.onclick = () => removeFavorite(f.id);
    div.appendChild(btn);
    favListEl.appendChild(div);
  });
}

// Init 
window.onload = renderFavorites;

// Dark mode toggle with animation + localStorage
const themeToggle = document.getElementById('themeToggle');
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark');
  themeToggle.textContent = "☀️";
}
themeToggle.addEventListener('click', () => {
  const dark = document.body.classList.toggle('dark');
  themeToggle.textContent = dark ? "☀️" : "🌙";
  localStorage.setItem('theme', dark ? 'dark' : 'light');
  themeToggle.classList.add('spin');
  setTimeout(() => themeToggle.classList.remove('spin'), 500);
});
