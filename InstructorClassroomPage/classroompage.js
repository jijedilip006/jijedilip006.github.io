const createClassroomButton = document.getElementById("createClassroomBtn");
const classroomsContainer = document.getElementById("classroom-container");

// Fetch all classrooms
async function fetchClassrooms() {
  const { data, error } = await supabase.from("classrooms").select("*");
  if (error) {
    console.error("Error fetching classrooms:", error);
    return [];
  }
  return data;
}

// Display classrooms in the container
async function displayClassrooms() {
  const classrooms = await fetchClassrooms();
  const noClassroomMsg = document.getElementById("no-classroom-msg")
  classroomsContainer.innerHTML = "";

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
