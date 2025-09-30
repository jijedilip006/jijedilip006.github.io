const createLessonButton = document.getElementById("createLessonBtn");
const lessonsContainer = document.getElementById("lessons-container");

async function fetchLessons() {
    const { data, error } = await supabase.from("lessons").select("*");
    if (error) {
      console.error("Error fetching lessons:", error);
      return [];
    }
    return data;
  }

async function displayLessons(){
    const lessons = await fetchLessons();
    lessonsContainer.innerHTML = "";

    if (lessons.length > 0) {
        lessons.forEach((lesson) => {
            //lessons.forEach((lesson, index) => {
                const lessonDiv = document.createElement("div");
                lessonDiv.classList.add("lesson-card");
                lessonDiv.innerHTML = `
        <div class="dots-container">
            <button class="dots-btn">&#x22EE;</button>
            <div class="menu-content">
                <button class="edit-btn" data-id="${lesson.id}">Edit</button>
                <button class="delete-btn" data-id="${lesson.id}">Delete</button>
            </div>
        </div>
        <div class="lesson-header">
            <span class="lesson-id-title">${lesson.id} - ${lesson.title}</span>
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