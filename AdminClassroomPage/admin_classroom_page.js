// admin_classroom_page.js

const createClassroomButton = document.getElementById("createClassroomBtn");
const classroomsContainer = document.getElementById("classroom-container");

// ----------------------
// Theme toggle (same)
// ----------------------
document.addEventListener("DOMContentLoaded", () => {
  const themeCheckbox = document.querySelector(".theme-toggle input");
  const body = document.body;

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    body.classList.add("dark-mode");
    themeCheckbox.checked = true;
  }

  themeCheckbox.addEventListener("change", () => {
    if (themeCheckbox.checked) {
      body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  });
});

// ----------------------
// Fetch all classrooms (Admin sees ALL)
// ----------------------
async function fetchClassrooms() {
  const { data, error } = await supabase
    .from("classrooms")
    .select("*")
    .order("Archived", { ascending: true });

  if (error) {
    console.error("Error fetching classrooms:", error);
    return [];
  }
  return data;
}

// ----------------------
// Helper buttons
// ----------------------
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
      await displayClassrooms();
    } catch (err) {
      console.error("Error archiving classroom:", err);
      alert("Failed to archive classroom.");
    }
  });
}

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
      await displayClassrooms();
    } catch (err) {
      console.error("Error unarchiving classroom:", err);
      alert("Failed to unarchive classroom.");
    }
  });
}

// ----------------------
// Display classrooms
// ----------------------
async function displayClassrooms() {
  const classrooms = await fetchClassrooms();
  const noClassroomMsg = document.getElementById("no-classroom-msg");
  classroomsContainer.innerHTML = "";

  classrooms.sort((a, b) => {
    if (a.Archived === b.Archived) return 0;
    return a.Archived ? 1 : -1;
  });

  if (classrooms.length === 0) {
    noClassroomMsg.style.display = "block";
    return;
  }

  noClassroomMsg.style.display = "none";

  classrooms.forEach((classroom) => {
    const classroomDiv = document.createElement("div");
    classroomDiv.classList.add("card");

    // Extract course list (JSON array)
    let courseListDisplay = "No courses assigned";
    if (Array.isArray(classroom.course_list) && classroom.course_list.length > 0) {
      courseListDisplay = classroom.course_list.join(", ");
    }

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
      <p><strong>Courses:</strong> ${courseListDisplay}</p>
      <p><strong>Start Date:</strong> ${classroom.start_date}</p>
      <p><strong>Duration:</strong> ${classroom.duration} week${
      classroom.duration > 1 ? "s" : ""
    }</p>
    `;

    // Draft / Publish / Archive
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
          await displayClassrooms();
        } catch (err) {
          console.error("Error publishing classroom:", err);
        }
      });
    }

    if (!classroom["Draft Mode"] && !classroom["Archived"]) {
      addArchiveButton(classroomDiv, classroom);
    }

    if (classroom["Archived"]) {
      const badge = document.createElement("span");
      badge.classList.add("archive-badge");
      badge.textContent = "Archived";
      classroomDiv.appendChild(badge);
      addUnarchiveButton(classroomDiv, classroom);
    }

    // View classroom details
    classroomDiv.addEventListener("click", (e) => {
      if (
        e.target.classList.contains("dots-btn") ||
        e.target.classList.contains("edit-btn") ||
        e.target.classList.contains("delete-btn")
      )
        return;

      localStorage.setItem("viewClassroomId", classroom.classroom_id);
      window.location.href = "../ClassroomDetails/classroom_detail.html";
    });

    classroomsContainer.appendChild(classroomDiv);
  });
}

// ----------------------
// Handle clicks (menu, edit, delete)
// ----------------------
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("dots-btn")) {
    const menu = e.target.nextElementSibling;
    menu.style.display = menu.style.display === "flex" ? "none" : "flex";
  } else {
    document
      .querySelectorAll(".menu-content")
      .forEach((menu) => (menu.style.display = "none"));
  }

  // Delete classroom
  if (e.target.classList.contains("delete-btn")) {
    const classroomId = e.target.getAttribute("data-id");
    if (!confirm("Delete this classroom permanently?")) return;
    const { error } = await supabase.from("classrooms").delete().eq("id", classroomId);
    if (error) console.error("Error deleting classroom:", error);
    else await displayClassrooms();
  }

  // Edit classroom
  if (e.target.classList.contains("edit-btn")) {
    const classroomId = e.target.getAttribute("data-id");
    window.location.href = `../AdminCreateClass/admin_classroom.html?id=${classroomId}`;
  }
});

// ----------------------
// Initial load
// ----------------------
displayClassrooms();
