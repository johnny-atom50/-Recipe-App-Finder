/*  DOM Elements  */

const resultsEl = document.getElementById('results');
const detailsEl = document.getElementById('recipeDetails');
const favListEl = document.getElementById('favoritesList');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const paginationEl = document.querySelector('.pagination');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

let currentPage = 1, recipesCache = [], lastQuery = "";


/*  API Base URL */

const API_BASE = "https://www.themealdb.com/api/json/v1/1/";


/*  Fetch Data from API  */

async function fetchFromAPI(endpoint, params) {
  const url = new URL(API_BASE + endpoint);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const res = await fetch(url);
  return await res.json();
}


/*  Search Trigger */

function triggerSearch() {
  const term = searchInput.value.trim();
  if (!term) return alert("Type something to search");
  lastQuery = term;
  currentPage = 1;
  getRecipes(term);
}
searchBtn.addEventListener('click', triggerSearch);
searchInput.addEventListener('keypress', e => e.key === "Enter" && triggerSearch());


/*   Get Recipes from API  */

async function getRecipes(query) {
  let data;
  if (query.includes(',')) {
    const ingredients = query.split(',').map(s => s.trim()).join(',');
    data = await fetchFromAPI("filter.php", { i: ingredients });
  } else {
    data = await fetchFromAPI("search.php", { s: query });
  }
  if (!data.meals) {
    resultsEl.innerHTML = `<p>No recipes found.</p>`;
    paginationEl.style.display = "none";
    return;
  }
  recipesCache = data.meals;
  showPage();
}


/*  Show Paginated Results   */

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


/*   Render Recipe Cards   */

function renderCards(list) {
  resultsEl.innerHTML = "";
  detailsEl.style.display = "none";
  list.forEach(meal => {
    const card = document.createElement("div");
    card.className = "recipe";
    card.innerHTML = `
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
      <h3>${meal.strMeal}</h3>
    `;
    const btn = document.createElement("button");
    btn.textContent = "View Details";
    btn.onclick = () => loadDetails(meal.idMeal);
    card.appendChild(btn);
    resultsEl.appendChild(card);
  });
}


/*   Load Recipe Details   */

async function loadDetails(id) {
  const data = await fetchFromAPI("lookup.php", { i: id });
  if (data.meals && data.meals[0]) buildDetails(data.meals[0]);
}


/*  Build Recipe Details View */

function buildDetails(meal) {
  const ingredients = Array.from({ length: 20 }, (_, i) => {
    const ing = meal[`strIngredient${i + 1}`]?.trim();
    const measure = meal[`strMeasure${i + 1}`]?.trim();
    return ing ? `${ing}${measure ? ` - ${measure}` : ''}` : null;
  }).filter(Boolean);


  // Split instructions into numbered steps
  
  const instructionsSteps = (meal.strInstructions || '')
    .split(/\r?\n/)
    .filter(line => line.trim());

  const numberedInstructions = `
    <ol>
      ${instructionsSteps.map(step => `<li>${step}</li>`).join('')}
    </ol>
  `;

  detailsEl.innerHTML = `
    <h2>${meal.strMeal}</h2>
    <img src="${meal.strMealThumb}" style="max-width:100%">
    <div class="text-left">
      <h3>Ingredients:</h3>
      <ul>${ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
      <h3>Instructions:</h3>
      ${numberedInstructions}
    </div>
  `;

  const favBtn = document.createElement("button");
  favBtn.textContent = "Add to Favorites";
  favBtn.onclick = () => addFavorite(meal.idMeal, meal.strMeal, meal.strMealThumb);
  detailsEl.appendChild(favBtn);

  detailsEl.style.display = "block";
  detailsEl.classList.remove("fade-in");
  void detailsEl.offsetWidth; // restart animation
  detailsEl.classList.add("fade-in");
  detailsEl.scrollIntoView({ behavior: "smooth" });
}


/* Favorites Management */
function addFavorite(id, name, image) {
  const favs = JSON.parse(localStorage.getItem("favorites")) || [];
  if (favs.some(f => f.id == id)) return alert("Already in favorites");
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

  favListEl.classList.remove("fade-in");
  void favListEl.offsetWidth; // restart animation
  favListEl.classList.add("fade-in");
}


/*  Initialize Favorites   */
window.onload = renderFavorites;


/*   Theme Toggle (Dark/Light)   */
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
