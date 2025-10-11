const coursesContainer = document.getElementById("courses-container");
const noCoursesMsg = document.getElementById("no-courses-msg");

function addUnarchiveButton(div, course) {
    const unarchiveBtn = document.createElement("button");
    unarchiveBtn.textContent = "Unarchive";
    unarchiveBtn.classList.add("unarchive-btn");
    div.querySelector(".card-content").appendChild(unarchiveBtn);

    unarchiveBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!confirm(`Unarchive course "${course.title}"? This will make it visible again to students.`)) return;
        try {
            const { error: unarchiveError } = await supabase
                .from("courses")
                .update({ Archived: false })
                .eq("id", course.id);

            if (unarchiveError) throw unarchiveError;

            alert(`Course "${course.title}" unarchived!`);
            
            // Update UI
            div.querySelector(".archive-badge")?.remove();
            unarchiveBtn.remove();
            addArchiveButton(div, course); // swap back to archive button
        } catch (err) {
            console.error("Error unarchiving course:", err);
            alert("Failed to unarchive course. See console for details.");
        }
    });
}

function addArchiveButton(div, course) {
    const archiveBtn = document.createElement("button");
    archiveBtn.textContent = "Archive";
    archiveBtn.classList.add("archive-btn");
    div.querySelector(".card-content").appendChild(archiveBtn);

    archiveBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!confirm(`Archive course "${course.title}"? This will hide it from students.`)) return;
        try {
            const { error: archiveError } = await supabase
                .from("courses")
                .update({Archived: true })
                .eq("id", course.id);

            if (archiveError) throw archiveError;

            alert(`Course "${course.title}" archived!`);

            const archivedBadge = document.createElement("span");
            archivedBadge.classList.add("archive-badge");
            archivedBadge.textContent = "Archived";
            div.querySelector(".card-content").appendChild(archivedBadge);

            archiveBtn.remove();
            addUnarchiveButton(div, course);
        } catch (err) {
            console.error("Error archiving course:", err);
            alert("Failed to archive course. See console for details.");
        }
    });
}

window.addEventListener("DOMContentLoaded", async () => {
    try {
        // Fetch all courses
        const { data: courses, error } = await supabase
            .from("courses")
            .select("*")
            .order("Archived", { ascending: true });
        if (error) throw error;

        // Clear container
        coursesContainer.innerHTML = "";

        if (!courses || courses.length === 0) {
            noCoursesMsg.style.display = "block";
            return;
        } else {
            noCoursesMsg.style.display = "none";
        }

        for (const course of courses) {
            const div = document.createElement("div");
            div.classList.add("course-card");
  
            let totalCredits = 0;
            try {
                const { data: lessons, error: lessonError } = await supabase
                .from("lessons")
                .select("creditPoints")
                .in("id", course.lesson_ids);
                
                if (lessonError) throw lessonError;
                
                if (lessons && lessons.length > 0) {
                    totalCredits = lessons.reduce((sum, l) => sum + (l.creditPoints || 0), 0);
                }
            } catch (err) {
                console.error(`Error fetching lessons for course ${course.id}:`, err);
            }

            const draftStatus = course["Draft Mode"] ? '<span class="draft-badge">Draft</span>' : '';
            div.innerHTML = `
                <div class="card-content">
                    ${draftStatus}
                     <h2 class="course-title">${course.title || "Untitled Course"}</h2>
                     <p class="course-id"><strong>ID:</strong> ${course.id}</p>
                     <p class="course-owner"><strong>Owner:</strong> ${course.owner}</p>
                     <p class="course-credits"><strong>Total Credit Points:</strong> ${totalCredits}</p>
                </div>
                 `;
            coursesContainer.appendChild(div);

            if (course["Draft Mode"] && !course["Archived"]) {
                const publishBtn = document.createElement("button");
                publishBtn.textContent = "Publish";
                publishBtn.classList.add("publish-btn");
                div.querySelector(".card-content").appendChild(publishBtn);

                publishBtn.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    if (confirm(`Publish course "${course.title}"? This will make it visible to students.`)) {
                        try {
                            const { error: publishError } = await supabase
                                .from("courses")
                                .update({ "Draft Mode": false })
                                .eq("id", course.id);
                            if (publishError) throw publishError;

                            alert(`Course "${course.title}" published!`);
                            publishBtn.remove();
                            div.querySelector(".draft-badge").remove();
                            addArchiveButton(div, course);
                        } catch (err) {
                            console.error("Error publishing course:", err);
                            alert("Failed to publish course. See console for details.");
                        }
                    }
                });
            }

            // 2. Published (not draft, not archived) → show archive button
            if (!course["Draft Mode"] && !course["Archived"]) {
                addArchiveButton(div, course);
            }

            // 3. Archived → just show badge
            if (course["Archived"]) {
                const archivedBadge = document.createElement("span");
                archivedBadge.classList.add("archive-badge");
                archivedBadge.textContent = "Archived";
                div.querySelector(".card-content").appendChild(archivedBadge);

                addUnarchiveButton(div, course);
            }

            // === Make whole card clickable (except menu buttons) ===
            div.addEventListener("click", () => {
                localStorage.setItem("viewCourseId", course.id);
                window.location.href = "../CourseDetails/course_detail.html";
            });

            const menuWrapper = document.createElement("div");
            menuWrapper.classList.add("menu-wrapper");

            // 3 dots button
            const menuBtn = document.createElement("button");
            menuBtn.classList.add("menu-btn");
            menuBtn.textContent = "⋮";

            // Dropdown menu
            const menu = document.createElement("div");
            menu.classList.add("dropdown-menu");

            menuBtn.addEventListener("click", (e) => {
                e.stopPropagation();  // prevent card click
                menu.classList.toggle("show");
            });

            // === Edit button (redire ct to create_course.html?id=course.id) ===
            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                window.location.href = `../CreateCourse/create_course.html?id=${course.id}`;
            });

            // === Delete button ===
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.addEventListener("click", async (e) => {
                e.stopPropagation();
                if (!confirm(`Are you sure you want to delete course "${course.id}"?`)) return;
                try {
                    const { error: deleteError } = await supabase
                        .from("courses")
                        .delete()
                        .eq("id", course.id);

                    if (deleteError) throw deleteError;

                    alert("Course deleted successfully!");
                    div.remove(); // remove from DOM immediately
                    if (coursesContainer.children.length === 0) {
                        noCoursesMsg.style.display = "block";
                    }
                } catch (err) {
                    console.error("Error deleting course:", err);
                    alert("Failed to delete course. See console for details.");
                }
            });

            // Add options into dropdown
            menu.appendChild(editBtn);
            menu.appendChild(deleteBtn);

            // Close dropdown if clicking outside
            document.addEventListener("click", (e) => {
                if (!menuWrapper.contains(e.target)) {
                    menu.classList.remove("show");
                }
            });

            menuWrapper.appendChild(menuBtn);
            menuWrapper.appendChild(menu);
            div.appendChild(menuWrapper);

            coursesContainer.appendChild(div);
        }
    
        
    } catch (err) {
        console.error("Error fetching courses:", err);
        coursesContainer.innerHTML = "<p>Error loading courses. See console.</p>";
    }
});
