// course.js (your separate JS file)
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

window.addEventListener("DOMContentLoaded", async () => {
    const courseForm = document.getElementById("courseForm");
    if (!courseForm) return; // exit if form not on this page

    const ownerInput = document.getElementById("owner");
    const lessonContainer = document.getElementById("lesson");

    const params = new URLSearchParams(window.location.search);
    const editId = params.get("id");

    const saveAndCloseButton = document.getElementById("save-and-close");
    const createCourseButton = document.getElementById("create-course");


    // Load lessons dynamically
    try {
        const { data: lessons, error } = await supabase
            .from("lessons")
            .select("id, title");
        if (error) throw error;

        lessonContainer.innerHTML = "";
        if (!lessons || lessons.length === 0) {
            lessonContainer.innerHTML = "<p>No lessons available</p>";
        } else {
            lessons.forEach(lesson => {
                const wrapper = document.createElement("div");
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.id = `lesson-${lesson.id}`;
                checkbox.value = lesson.id;

                const label = document.createElement("label");
                label.htmlFor = checkbox.id;
                label.textContent = lesson.title;

                wrapper.appendChild(checkbox);
                wrapper.appendChild(label);
                lessonContainer.appendChild(wrapper);
            });
        }

        if (editId) {
            const { data: course, error: courseError } = await supabase
                .from("courses")
                .select("*")
                .eq("id", editId)
                .single();

            if (courseError) {
                console.error("Error loading course:", courseError);
            } else if (course) {
                document.getElementById("ID").value = course.id;
                document.getElementById("title").value = course.title || "";  
                document.getElementById("owner").value = course.owner;
                document.getElementById("description").value = course.description || "";

                const submitBtn = courseForm.querySelector("button[type='submit']");
                if (submitBtn) submitBtn.textContent = "Update Course";

                // Check lessons from DB
                course.lesson_ids?.forEach(id => {
                    const cb = document.querySelector(`#lesson input[value="${id}"]`);
                    if (cb) cb.checked = true;
                });
            }
        }

        try {
            const { data: instructors, error: instError } = await supabase
                .from("users")
                .select("firstName, lastName, role")
                .eq("role", "instructor");

            const ownerSelect = document.getElementById("owner");
            ownerSelect.innerHTML = '<option value="">-- Select owner --</option>';

            if (instError) {
                console.error("Error loading instructors:", instError);
            } else if (instructors && instructors.length > 0) {
                instructors.forEach(i => {
                    const opt = document.createElement("option");
                    opt.value = `${i.firstName} ${i.lastName}`;
                    opt.textContent = `${i.firstName} ${i.lastName}`;
                    ownerSelect.appendChild(opt);
                });
            } else {
                ownerSelect.innerHTML = '<option value="">No instructors found</option>';
            }
        } catch (err) {
            console.error("Error loading owners:", err);
        }
    
    } catch (err) {
        console.error("Error loading lessons:", err);
    }


    // Handle Save & Close button
    async function handleSave(isDraft) {
        const selectedLessons = [...lessonContainer.querySelectorAll("input[type='checkbox']:checked")]
            .map(cb => cb.value);

        //  Validate: at least one lesson must be selected
        if (selectedLessons.length === 0) {
            alert("Error: Please select at least one lesson for the course.");
            return; // stop submission
        }

        const courseData = {
            id: document.getElementById("ID").value,
            title: document.getElementById("title").value,
            owner: ownerInput.value,
            lesson_ids: selectedLessons,
            description: document.getElementById("description").value,
            "Draft Mode": isDraft
        };
        try {
            if (editId) {
                const { error } = await supabase
                    .from("courses")
                    .update(courseData)
                    .eq("id", editId);
                if (error) throw error;
                alert("Course updated successfully!");
            }else {
                const { data: existing } = await supabase
                    .from("courses")
                    .select("id")
                    .eq("id", courseData.id)
                    .single();

                if (existing) {
                    alert("Course ID already exists.");
                    return;
                }

                const { error } = await supabase.from("courses").insert([courseData]);
                if (error) throw error;

                if (!isDraft) {
                    alert("Course created successfully!");
                }else {
                    alert("Course saved as draft.");
                }
            }

            window.location.href = "../AdminCoursesPage/admin_course_page.html";
        } catch (err) {
            console.error("Error creating course:", err);
            alert("Failed to create course. See console for details.");
        }
    }

    saveAndCloseButton.addEventListener("click", (e) => {
        e.preventDefault();
        handleSave(true); // is a draft
    });
    createCourseButton.addEventListener("click", (e) => {
        e.preventDefault();
        handleSave(false); // not a draft
    });

});