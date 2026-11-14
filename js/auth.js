
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  const roleSelect = document.getElementById("role");
  const recyclerFields = document.getElementById("recyclerFields");
  const facilityName = document.getElementById("facilityName");
  const facilityAddress = document.getElementById("facilityAddress");
  const materialsSelect = document.getElementById("materials");

  const message = document.getElementById("registerMessage");
  const registerBtn = document.getElementById("registerBtn");

  // Show/hide recycler fields
  function updateRoleFields() {
    const isRecycler = roleSelect.value === "recycler";

    recyclerFields.classList.toggle("hidden", !isRecycler);

    facilityName.required = isRecycler;
    facilityAddress.required = isRecycler;
    materialsSelect.required = isRecycler;
  }

  roleSelect.addEventListener("change", updateRoleFields);
  updateRoleFields();

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    message.textContent = "";
    message.className = "";

    registerBtn.disabled = true;
    registerBtn.textContent = "Creating account...";

    const role = roleSelect.value;
    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const location = document.getElementById("location").value.trim();
    const password = document.getElementById("password").value;

    try {
      // Create Supabase Auth account
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            phone,
            location
          }
        }
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("Account creation failed. Please try again.");
      }

      // Recycler facility information
      if (role === "recycler") {
        if (!data.session) {
          throw new Error(
            "Account created, but email confirmation is required. Disable email confirmation in Supabase or confirm your email before continuing."
          );
        }

        const selectedMaterials = Array.from(
          materialsSelect.selectedOptions
        ).map(option => option.value);

        const { error: recyclerError } = await supabaseClient
          .from("recyclers")
          .insert({
            user_id: data.user.id,
            facility_name: facilityName.value.trim(),
            facility_address: facilityAddress.value.trim(),
            accepted_materials: selectedMaterials
          });

        if (recyclerError) throw recyclerError;
      }

      message.textContent = data.session
        ? "Account created successfully! Redirecting..."
        : "Account created! Please confirm your email before logging in.";

      message.className = "success-message";

      if (data.session) {
        setTimeout(() => {
          window.location.href = "login.html";
        }, 1200);
      } else {
        registerBtn.textContent = "Account Created";
      }

    } catch (error) {
      console.error("Registration error:", error);

      message.textContent = error.message || "Something went wrong.";
      message.className = "error-message";

    } finally {
      if (!message.classList.contains("success-message") ||
          !message.textContent.includes("Please confirm")) {
        registerBtn.disabled = false;
        registerBtn.textContent = "Create Account";
      }
    }
  });
}

// LOGIN SYSTEM
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  const loginMessage = document.getElementById("loginMessage");
  const loginBtn = document.getElementById("loginBtn");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";
    loginMessage.textContent = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      // Authenticate user
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Fetch user's profile and role
      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("full_name, role")
        .eq("id", data.user.id)
        .single();

      if (profileError) throw profileError;

      loginMessage.textContent = "Login successful! Redirecting...";
      loginMessage.className = "success-message";

      if (profile.role === "collector") {
        window.location.href = "collector.html";
      } else if (profile.role === "recycler") {
        window.location.href = "recycler.html";
      } else {
        throw new Error("Your account has an invalid role.");
      }

    } catch (error) {
      console.error("Login error:", error);

      loginMessage.textContent = error.message || "Login failed.";
      loginMessage.className = "error-message";

      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
    }
  });
}
