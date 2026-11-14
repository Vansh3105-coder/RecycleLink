
const listingForm = document.getElementById("listingForm");

let currentUser = null;

async function initializeCollector() {
  const { data: { user }, error } = await supabaseClient.auth.getUser();

  if (error || !user) {
    window.location.href = "login.html";
    return;
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profileError || profile.role !== "collector") {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  document.querySelector("h1").textContent =
    `Welcome, ${profile.full_name}`;

  await loadListings();
}

async function loadListings() {
  const { data, error } = await supabaseClient
    .from("waste_listings")
    .select("*")
    .eq("collector_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    document.getElementById("myListings").textContent = error.message;
    return;
  }

  const listings = data || [];

  document.getElementById("totalListings").textContent = listings.length;

  document.getElementById("activeListings").textContent =
    listings.filter(item => item.status === "available").length;

  document.getElementById("completedListings").textContent =
    listings.filter(item => item.status === "completed").length;

  const container = document.getElementById("myListings");

  if (listings.length === 0) {
    container.innerHTML = "<p>You haven't posted any listings yet.</p>";
    return;
  }

  container.replaceChildren();

  listings.forEach(item => {
    const card = document.createElement("article");
    card.className = "listing-card";

    const title = document.createElement("h3");
    title.textContent = item.material;

    const quantity = document.createElement("p");
    quantity.textContent = `Quantity: ${item.quantity_kg} kg`;

    const location = document.createElement("p");
    location.textContent = `Location: ${item.location}`;

    const status = document.createElement("span");
    status.className = "status-tag";
    status.textContent = item.status;

    card.append(title, quantity, location, status);
    container.appendChild(card);
  });
}

if (listingForm) {
  listingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const button = document.getElementById("listingBtn");
    const message = document.getElementById("listingMessage");

    button.disabled = true;
    button.textContent = "Publishing...";
    message.textContent = "";

    try {
      const material = document.getElementById("material").value;
      const quantity = Number(document.getElementById("quantity").value);
      const location = document.getElementById("listingLocation").value.trim();
      const description = document.getElementById("description").value.trim();

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error("Enter a valid quantity.");
      }

      const { error } = await supabaseClient
        .from("waste_listings")
        .insert({
          collector_id: currentUser.id,
          material,
          quantity_kg: quantity,
          location,
          description
        });

      if (error) throw error;

      message.textContent = "Your waste listing was published!";
      message.className = "success-message";

      listingForm.reset();
      await loadListings();

    } catch (error) {
      console.error(error);
      message.textContent = error.message;
      message.className = "error-message";

    } finally {
      button.disabled = false;
      button.textContent = "Publish Listing";
    }
  });
}

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
});

initializeCollector();
