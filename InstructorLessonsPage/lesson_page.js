const createLessonButton = document.getElementById("createLessonBtn");
const lessonsContainer = document.getElementById("lessons-container");

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
      // Enable dark mode
      body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      // Disable dark mode
      body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  });
});

async function fetchLessons() {
    const { data, error } = await supabase.from("lessons").select("*");
    if (error) {
      console.error("Error fetching lessons:", error);
      return [];
    }
    return data;
  }

function addArchiveButton(div, item, tableName) {
    const archiveBtn = document.createElement("button");
    archiveBtn.textContent = "Archive";
    archiveBtn.classList.add("archive-btn");
    div.appendChild(archiveBtn);

    archiveBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!confirm(`Archive ${tableName.slice(0, -1)} "${item.title}"?`)) return;
        try {
            const { error } = await supabase
                .from(tableName)
                .update({ Archived: true })
                .eq("id", item.id);
            if (error) throw error;

            alert(`${tableName.slice(0, -1)} "${item.title}" archived!`);
            const archivedBadge = document.createElement("span");
            archivedBadge.classList.add("archive-badge");
            archivedBadge.textContent = "Archived";
            div.appendChild(archivedBadge);
            archiveBtn.remove();
            addUnarchiveButton(div, item, tableName);
        } catch (err) {
            console.error("Error archiving:", err);
        }
    });
}

function addUnarchiveButton(div, item, tableName) {
    const unarchiveBtn = document.createElement("button");
    unarchiveBtn.textContent = "Unarchive";
    unarchiveBtn.classList.add("unarchive-btn");
    div.appendChild(unarchiveBtn);

    unarchiveBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!confirm(`Unarchive ${tableName.slice(0, -1)} "${item.title}"?`)) return;
        try {
            const { error } = await supabase
                .from(tableName)
                .update({ Archived: false })
                .eq("id", item.id);
            if (error) throw error;

            alert(`${tableName.slice(0, -1)} "${item.title}" unarchived!`);
            div.querySelector(".archive-badge")?.remove();
            unarchiveBtn.remove();
            addArchiveButton(div, item, tableName);
        } catch (err) {
            console.error("Error unarchiving:", err);
        }
    });
}


async function displayLessons(){
    const lessons = await fetchLessons();

    lessons.sort((a, b) => {
        if (a.Archived === b.Archived) return 0;
        return a.Archived ? 1 : -1; // Archived → later
    });
    
    lessonsContainer.innerHTML = "";

    if (lessons.length > 0) {
        lessons.forEach((lesson) => {
            //lessons.forEach((lesson, index) => {
            const lessonDiv = document.createElement("div");
            lessonDiv.classList.add("lesson-card");

            const draftStatus = lesson["Draft Mode"] ? '<span class="draft-badge">Draft</span>' : '';
            lessonDiv.innerHTML = `
                <div class="dots-container">
                    <button class="dots-btn">&#x22EE;</button>
                    <div class="menu-content">
                        <button class="edit-btn" data-id="${lesson.id}">Edit</button>
                        <button class="delete-btn" data-id="${lesson.id}">Delete</button>
                    </div>
                </div>
                <div class="lesson-header">
                    ${draftStatus}
                    <span class="lesson-id-title">${lesson.id}</span>
                </div>
                <p><strong>Credit Points:</strong> ${lesson.creditPoints}</p>
                <p><strong>Owner:</strong> ${lesson.owner}</p>
            `;
            // Make entire card clickable except the menu buttons
            lessonDiv.addEventListener("click", (e) => {
                if (!e.target.closest(".dots-container")) {
                    localStorage.setItem("viewLessonId", lesson.id);
                    localStorage.setItem("cameFrom", "lessonList");
                    window.location.href = "../LessonDetails/lesson_detail.html";
                }
            });

        lessonsContainer.appendChild(lessonDiv);

        if (lesson["Draft Mode"] && !lesson["Archived"]) {
            const publishBtn = document.createElement("button");
            publishBtn.textContent = "Publish";
            publishBtn.classList.add("publish-btn");
            lessonDiv.appendChild(publishBtn);

            publishBtn.addEventListener("click", async (e) => {
                e.stopPropagation();
                if (confirm(`Publish lesson "${lesson.title}"? This will make it visible.`)) {
                    try {
                        const { error: publishError } = await supabase
                            .from("lessons")
                            .update({ "Draft Mode": false })
                            .eq("id", lesson.id);
                        if (publishError) throw publishError;

                        alert(`Lesson "${lesson.title}" published!`);
                        publishBtn.remove();
                        lessonDiv.querySelector(".draft-badge")?.remove();
                        addArchiveButton(lessonDiv, lesson, "lessons");
                    } catch (err) {
                        console.error("Error publishing lesson:", err);
                        alert("Failed to publish lesson. See console for details.");
                    }
                }
            });
        }

        if (!lesson["Draft Mode"] && !lesson["Archived"]) {
            addArchiveButton(lessonDiv, lesson, "lessons");
        }

        if (lesson["Archived"]) {
                const archivedBadge = document.createElement("span");
                archivedBadge.classList.add("archive-badge");
                archivedBadge.textContent = "Archived";
                lessonDiv.appendChild(archivedBadge);

                addUnarchiveButton(lessonDiv, lesson, "lessons");
            }
        });

    }else {
        lessonsContainer.innerHTML = "<p>No lessons yet. Click below to create one.</p>";
    }
    
}

document.addEventListener("click", async(e) => {
    // Toggle dropdown menu
    if (e.target.classList.contains("dots-btn")) {
        const menu = e.target.nextElementSibling; 
        menu.style.display = menu.style.display === "flex" ? "none" : "flex";
    } else {
        document.querySelectorAll(".menu-content").forEach(menu => menu.style.display = "none");
    }


    if (e.target.classList.contains("delete-btn")) {
        const lessonId = e.target.getAttribute("data-id");
        const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
        if (error) {
            console.error("Error deleting lesson:", error);
        } else {
            await displayLessons();
        }
    }


    if (e.target.classList.contains("edit-btn")){
        const lessonId = e.target.getAttribute("data-id");
        localStorage.setItem("editLessonId", lessonId); // use consistent key
        window.location.href = "../CreateLesson/create_lesson.html";
    }
});

displayLessons();

createLessonButton.addEventListener("click", () => {
    localStorage.removeItem('editLessonId')
    window.location.href = "../CreateLesson/create_lesson.html";
});