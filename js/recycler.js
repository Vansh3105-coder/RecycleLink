
let currentRecyclerUser = null;
let currentRecycler = null;

async function initializeRecycler() {
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

  if (profileError || profile.role !== "recycler") {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
    return;
  }

  currentRecyclerUser = user;

  document.getElementById("welcomeHeading").textContent =
    `Welcome, ${profile.full_name}`;

  const { data: recycler, error: recyclerError } = await supabaseClient
    .from("recyclers")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (recyclerError) {
    document.getElementById("verificationNotice").textContent =
      "Facility information could not be loaded.";
    console.error(recyclerError);
    return;
  }

  currentRecycler = recycler;

  document.getElementById("verificationNotice").textContent =
    `Facility verification status: ${recycler.verification_status.toUpperCase()}. ` +
    "This status is displayed transparently to collectors.";

  await loadMarketplace();
  await loadMyOffers();
}

async function loadMarketplace() {
  const container = document.getElementById("marketplace");

  const { data: listings, error } = await supabaseClient
    .from("waste_listings")
    .select("*")
    .eq("status", "available")
    .order("created_at", { ascending: false });

  if (error) {
    container.textContent = error.message;
    return;
  }

  if (!listings || listings.length === 0) {
    container.textContent = "No available waste listings right now.";
    return;
  }

  container.replaceChildren();

  listings.forEach(listing => {
    const card = document.createElement("article");
    card.className = "marketplace-card";

    const title = document.createElement("h3");
    title.textContent = listing.material;

    const quantity = document.createElement("p");
    quantity.textContent = `Quantity: ${listing.quantity_kg} kg`;

    const location = document.createElement("p");
    location.textContent = `Location: ${listing.location}`;

    const description = document.createElement("p");
    description.textContent = listing.description || "No description provided.";

    const form = document.createElement("form");
    form.className = "offer-form";

    const priceLabel = document.createElement("label");
    priceLabel.textContent = "Your offer (₹)";

    const priceInput = document.createElement("input");
    priceInput.type = "number";
    priceInput.min = "0.01";
    priceInput.step = "0.01";
    priceInput.placeholder = "Enter your total offer";
    priceInput.required = true;

    const messageLabel = document.createElement("label");
    messageLabel.textContent = "Message (optional)";

    const messageInput = document.createElement("input");
    messageInput.type = "text";
    messageInput.placeholder = "Add a message to the collector";

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.textContent = "Submit Offer";

    const feedback = document.createElement("p");
    feedback.setAttribute("role", "status");

    form.append(
      priceLabel,
      priceInput,
      messageLabel,
      messageInput,
      submitButton,
      feedback
    );

    form.addEventListener("submit", async event => {
      event.preventDefault();

      const price = Number(priceInput.value);

      if (!Number.isFinite(price) || price <= 0) {
        feedback.textContent = "Enter a valid offer amount.";
        feedback.className = "error-message";
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";

      try {
        const { error: offerError } = await supabaseClient
          .from("offers")
          .insert({
            listing_id: listing.id,
            recycler_id: currentRecycler.id,
            offered_price: price,
            message: messageInput.value.trim()
          });

        if (offerError) throw offerError;

        feedback.textContent = "Offer submitted successfully!";
        feedback.className = "success-message";

        form.reset();
        await loadMyOffers();

      } catch (error) {
        console.error(error);
        feedback.textContent = error.message;
        feedback.className = "error-message";

      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Offer";
      }
    });

    card.append(title, quantity, location, description, form);
    container.appendChild(card);
  });
}

async function loadMyOffers() {
  const container = document.getElementById("myOffers");

  const { data: offers, error } = await supabaseClient
    .from("offers")
    .select("id, offered_price, status, message, created_at, listing_id")
    .eq("recycler_id", currentRecycler.id)
    .order("created_at", { ascending: false });

  if (error) {
    container.textContent = error.message;
    return;
  }

  if (!offers || offers.length === 0) {
    container.textContent = "You haven't submitted any offers yet.";
    return;
  }

  container.replaceChildren();

  offers.forEach(offer => {
    const card = document.createElement("article");
    card.className = "offer-card";

    const price = document.createElement("p");
    price.textContent = `Offer: ₹${offer.offered_price}`;

    const status = document.createElement("p");
    status.textContent = `Status: ${offer.status}`;

    const message = document.createElement("p");
    message.textContent = `Message: ${offer.message || "No message"}`;

    card.append(price, status, message);
    container.appendChild(card);
  });
}

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
});

initializeRecycler();
