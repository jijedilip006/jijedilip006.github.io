const createClassroomButton = document.getElementById("createClassroomBtn");
const classroomsContainer = document.getElementById("classroom-container");

// Fetch all classrooms
async function fetchClassrooms() {
  const { data, error } = await supabase.from("classrooms").select("*").order("Archived", { ascending: true });
  if (error) {
    console.error("Error fetching classrooms:", error);
    return [];
  }
  return data;
}

function addArchiveButton(div, classroom) {
    const archiveBtn = document.createElement("button");
    archiveBtn.textContent = "Archive";
    archiveBtn.classList.add("archive-btn");
    div.appendChild(archiveBtn);

    archiveBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!confirm(`Archive classroom "${classroom.title}"?`)) return;
        try {
            const { error } = await supabase
                .from("classrooms")
                .update({ Archived: true })
                .eq("id", classroom.id);
            if (error) throw error;

            alert(`Classroom "${classroom.title}" archived!`);
            archiveBtn.remove();

            const badge = document.createElement("span");
            badge.classList.add("archive-badge");
            badge.textContent = "Archived";
            div.appendChild(badge);

            addUnarchiveButton(div, classroom);
        } catch (err) {
            console.error("Error archiving classroom:", err);
            alert("Failed to archive classroom. See console.");
        }
    });
}

// Add Unarchive button
function addUnarchiveButton(div, classroom) {
    const unarchiveBtn = document.createElement("button");
    unarchiveBtn.textContent = "Unarchive";
    unarchiveBtn.classList.add("unarchive-btn");
    div.appendChild(unarchiveBtn);

    unarchiveBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!confirm(`Unarchive classroom "${classroom.title}"?`)) return;
        try {
            const { error } = await supabase
                .from("classrooms")
                .update({ Archived: false })
                .eq("id", classroom.id);
            if (error) throw error;

            alert(`Classroom "${classroom.title}" unarchived!`);
            unarchiveBtn.remove();
            div.querySelector(".archive-badge")?.remove();
            addArchiveButton(div, classroom);
        } catch (err) {
            console.error("Error unarchiving classroom:", err);
            alert("Failed to unarchive classroom. See console.");
        }
    });
}


// Display classrooms in the container
async function displayClassrooms() {
  const classrooms = await fetchClassrooms();
  const noClassroomMsg = document.getElementById("no-classroom-msg")
  classroomsContainer.innerHTML = "";

  classrooms.sort((a, b) => {
    if (a.Archived === b.Archived) return 0;
    return a.Archived ? 1 : -1; // Archived true → push to bottom
  });

  if (classrooms.length > 0) {
    noClassroomMsg.style.display = "none";
    classrooms.forEach((classroom) => {
      const classroomDiv = document.createElement("div");
      classroomDiv.classList.add("card");

      classroomDiv.innerHTML = `
        <div class="dots-container">
          <button class="dots-btn">&#x22EE;</button>
          <div class="menu-content">
            <button class="edit-btn" data-id="${classroom.id}">Edit</button>
            <button class="delete-btn" data-id="${classroom.id}">Delete</button>
          </div>
        </div>
        <div class="classroom-header">
          <span class="classroom-id-title">${classroom.classroom_id}</span>
        </div>
        <p><strong>ID:</strong> ${classroom.classroom_id}</p>
        <p><strong>Title:</strong> ${classroom.title}</p>
        <p><strong>Owner:</strong> ${classroom.owner}</p>
        <p><strong>Start Date:</strong> ${classroom.start_date}</p>
        <p><strong>Duration:</strong> ${classroom.duration} week${classroom.duration > 1 ? "s" : ""}</p>
      `;

      // === Draft → Publish button ===
      if (classroom["Draft Mode"] && !classroom["Archived"]) {
        const draftBadge = document.createElement("span");
        draftBadge.classList.add("draft-badge");
        draftBadge.textContent = "Draft";
        classroomDiv.appendChild(draftBadge);

        const publishBtn = document.createElement("button");
        publishBtn.textContent = "Publish";
        publishBtn.classList.add("publish-btn");
        classroomDiv.appendChild(publishBtn);

        publishBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (!confirm(`Publish classroom "${classroom.title}"?`)) return;
          try {
            const { error } = await supabase
              .from("classrooms")
              .update({ "Draft Mode": false })
              .eq("id", classroom.id);
            if (error) throw error;

            alert(`Classroom "${classroom.title}" published!`);
            publishBtn.remove();
            draftBadge.remove();
            addArchiveButton(classroomDiv, classroom);
          } catch (err) {
            console.error("Error publishing classroom:", err);
            alert("Failed to publish classroom. See console.");
          }
        });
      }

      // === Published → Archive button ===
      if (!classroom["Draft Mode"] && !classroom["Archived"]) {
        addArchiveButton(classroomDiv, classroom);
      }

      // === Archived → show badge + Unarchive button ===
      if (classroom["Archived"]) {
        const archivedBadge = document.createElement("span");
        archivedBadge.classList.add("archive-badge");
        archivedBadge.textContent = "Archived";
        classroomDiv.appendChild(archivedBadge);
        addUnarchiveButton(classroomDiv, classroom);
      }

      classroomDiv.addEventListener("click", (e) => {
        // Ignore clicks on dots/edit/delete buttons
        if (
          e.target.classList.contains("dots-btn") ||
          e.target.classList.contains("edit-btn") ||
          e.target.classList.contains("delete-btn")
        ) {
          return;
        }
        localStorage.setItem("viewClassroomId", classroom.classroom_id);
        window.location.href = "../ClassroomDetails/classroom_detail.html";
      });

      classroomsContainer.appendChild(classroomDiv);
    });
  } else {
    noClassroomMsg.style.display = "block";
  }
}

// Handle clicks (dots menu, edit, delete)
document.addEventListener("click", async (e) => {
  
  if (e.target.classList.contains("dots-btn")) {
    const menu = e.target.nextElementSibling;
    menu.style.display = menu.style.display === "flex" ? "none" : "flex";
  } else {
    document.querySelectorAll(".menu-content").forEach(menu => menu.style.display = "none");
  }

  // Delete classroom
  if (e.target.classList.contains("delete-btn")) {
    const classroomId = e.target.getAttribute("data-id");
    const { error } = await supabase.from("classrooms").delete().eq("id", classroomId);
    if (error) {
      console.error("Error deleting classroom:", error);
    } else {
      await displayClassrooms();
    }
  }

  // Edit classroom
  if (e.target.classList.contains("edit-btn")) {
    const classroomId = e.target.getAttribute("data-id");
    window.location.href = `../ClassroomPage/classroom_page.html?id=${classroomId}`;
  }
});

// Initial load
displayClassrooms();
