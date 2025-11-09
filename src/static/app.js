document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML: list of pills (no bullets) with delete icon
        let participantsHtml = "";
        if (details.participants && details.participants.length > 0) {
          participantsHtml = "<ul>";
          details.participants.forEach((p) => {
            // include a delete button (×) with data attributes for activity and email
            participantsHtml += `
              <li class="participant-item" data-email="${p}" data-activity="${name}">
                <span class="participant-email">${p}</span>
                <button class="delete-participant" title="Unregister">&times;</button>
              </li>`;
          });
          participantsHtml += "</ul>";
        } else {
          participantsHtml = `<p class="no-participants"><em>No participants yet</em></p>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-list">
            <strong>Participants:</strong>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

  // Event delegation: handle delete clicks from this activity card
  // We'll rely on a single listener on activitiesList (set up below) to handle deletes

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the new participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();

  // Global click handler for delete buttons (event delegation)
  activitiesList.addEventListener("click", async (event) => {
    const btn = event.target.closest(".delete-participant");
    if (!btn) return;

    // Find the parent li to get attributes
    const li = btn.closest(".participant-item");
    if (!li) return;

    const email = li.getAttribute("data-email");
    const activity = li.getAttribute("data-activity");

    if (!email || !activity) return;

    // Ask for confirmation
    const confirmMsg = `Unregister ${email} from ${activity}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const resp = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await resp.json();
      if (resp.ok) {
        // Refresh activities list to show change
        fetchActivities();
      } else {
        // Show error message
        messageDiv.textContent = result.detail || result.message || "Failed to unregister";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
        setTimeout(() => messageDiv.classList.add("hidden"), 5000);
      }
    } catch (err) {
      console.error("Error unregistering participant:", err);
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    }
  });
});
