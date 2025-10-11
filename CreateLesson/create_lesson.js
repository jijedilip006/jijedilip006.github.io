const lessonForm = document.getElementById("lessonForm");

// const readingList = document.getElementById("ReadingList");
const readingList = document.getElementById("ReadingList");
const readingContainer = document.createElement("div"); 
readingList.parentNode.insertBefore(readingContainer, readingList.nextSibling);

const assignmentList = document.getElementById("Assignments");
const assignmentContainer = document.createElement("div"); 
assignmentList.parentNode.insertBefore(assignmentContainer, assignmentList.nextSibling);

let assignments = [];
let readings = [];

assignmentList.addEventListener("keydown", function(eve) {
    if (eve.key === "Enter"){
        eve.preventDefault();
        const sel=window.getSelection()
        const textNode=sel.anchorNode;

        if (textNode.nodeType==3 && textNode.parentNode==assignmentList) {
            const val = textNode.textContent.trim();

            if (val) {
                addAssignment(val);
                assignments.push(val);
                textNode.textContent = "";
                setCursorToEnd(assignmentList)
            }
        }
    }
})

function addAssignment(text){
    const box2 = document.createElement("div");
    box2.classList.add("tag-box2");
    box2.textContent = text;
    box2.setAttribute('contenteditable','false')

    const removeBtn2 = document.createElement("button");
    removeBtn2.textContent = "x";
    removeBtn2.onclick = () => {
        box2.remove();
        assignments = assignments.filter(item => item !== text);
    };

    box2.appendChild(removeBtn2);
    assignmentList.appendChild(box2);
}

// Handle adding readings
readingList.addEventListener("keydown", function(e){
    if (e.key === "Enter"){
        e.preventDefault();
        const selection=window.getSelection()
        const textNode=selection.anchorNode;
        if (textNode.nodeType==3 && textNode.parentNode == readingList) {
            const value = textNode.textContent.trim();
            if (value) {
                addReadingItem(value);
                readings.push(value); 
                textNode.textContent = "";
                setCursorToEnd(readingList)
            }
        }
    }
})

window.addEventListener("DOMContentLoaded", async () => {
    const prereqContainer = document.getElementById("prerequisite");
    const editLessonId = localStorage.getItem("editLessonId"); // declare first
    const saveLink = document.querySelector(".form-header-left a"); // "Save" link in header
    const createBtn = lessonForm.querySelector("button[type='submit']"); // bottom Create Lesson button

    try {
        // Fetch all lessons from Supabase
        const { data: lessons, error } = await supabase
          .from("lessons")
          .select("id, title");
    
        if (error) throw error;

        lessons.forEach((lesson) => {
            if (editLessonId && lesson.id === editLessonId) return; // skip self

            const checkboxId = `prereq-${lesson.id}`; // unique id
            
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = checkboxId;
            checkbox.value = lesson.id;
            
            const label = document.createElement("label");
            label.htmlFor = checkboxId; // link label to checkbox
            label.textContent = lesson.title;
            
            const wrapper = document.createElement("div"); // keep layout clean
            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);
            
            prereqContainer.appendChild(wrapper);
        });
        
        const ownerSelect = document.getElementById("owner");

        // First, get the logged-in user
        const user = JSON.parse(localStorage.getItem("loggedInUser"));
        let loggedInFullName = '';
        if (user && user.role === "instructor") {
            loggedInFullName = `${user.firstName} ${user.lastName}`;
            // Add logged-in user as the first/default option
            const option = document.createElement("option");
            option.value = loggedInFullName;
            option.textContent = loggedInFullName;
            option.selected = true;
            ownerSelect.appendChild(option);
        }

        // Load all other instructors from DB
        try {
            const { data: instructors, error: instError } = await supabase
                .from("users")
                .select("firstName, lastName, role")
                .eq("role", "instructor");
        
            if (instError) {
                console.error("Error loading instructors:", instError);
            } else if (instructors) {
                instructors.forEach(i => {
                    const fullName = `${i.firstName} ${i.lastName}`;
                    // Skip the logged-in instructor
                    if (fullName !== loggedInFullName) {
                        const opt = document.createElement("option");
                        opt.value = fullName;
                        opt.textContent = fullName;
                        ownerSelect.appendChild(opt);
                    }
                });
            }
        } catch (err) {
            console.error("Unexpected error loading instructors:", err);
        }

         // Load the lesson for editing
        if (editLessonId) {
            const { data: lesson, error: fetchError } = await supabase
            .from("lessons")
            .select("*")
            .eq("id", editLessonId)
            .single();
            
            if (fetchError) throw fetchError;
            console.log("Editing lesson:", lesson); // check what comes back
            
            if (lesson) {
                // Fill text inputs
                document.getElementById("ID").value = lesson.id|| "";
                document.getElementById("Title").value = lesson.title|| "";
                document.getElementById("Description").value = lesson.description|| "";
                document.getElementById("objectives").value = lesson.objectives|| "";
                document.getElementById("hours-per-week").value = lesson.hours|| "";
                document.getElementById("owner").value = lesson.owner|| "";
                document.getElementById("creditPoints").value = lesson.creditPoints|| "";

                 // Fill reading list & assignments
                assignments = lesson.assignments || [];
                readings = lesson.readingList || [];
                 
                readings.forEach(item => addReadingItem(item));
                assignments.forEach(item => addAssignment(item));
                 
                 // Restore selected prerequisites (jsonb array)
                 if (lesson.prerequisites && Array.isArray(lesson.prerequisites)) {
                    lesson.prerequisites.forEach(id => {
                        const checkbox = document.querySelector(`#prerequisite input[value="${id}"]`);
                        if (checkbox) checkbox.checked = true;
                    });
                }
               // Change submit button text
        document.querySelector("button[type='submit']").textContent = "Update Lesson";
        }
    }
    } catch (err) {
    console.error("Error loading lessons:", err);
    }

    async function handleSave(isDraft) {
        const prereqContainer = document.getElementById("prerequisite");
        const selectedPrereqs = [
            ...prereqContainer.querySelectorAll("input[type='checkbox']:checked")
        ].map(cb => cb.value);

        const lessonData = {
            id: document.getElementById("ID").value,
            title: document.getElementById("Title").value,
            description: document.getElementById("Description").value,
            objectives: document.getElementById("objectives").value,
            prerequisites: selectedPrereqs,
            hours: document.getElementById("hours-per-week").value,
            owner: document.getElementById("owner").value,
            creditPoints: document.getElementById("creditPoints").value,
            assignments: assignments,
            readingList: readings,
            "Draft Mode": isDraft   // 👈 add draft flag here
        };

        try {
            const { data: existing } = await supabase
                .from("lessons")
                .select("id")
                .eq("id", lessonData.id)
                .single();

            if (existing) {
                const { error } = await supabase
                    .from("lessons")
                    .update(lessonData)
                    .eq("id", lessonData.id);
                if (error) throw error;
                alert(isDraft ? "Lesson saved as draft!" : "Lesson updated!");
            } else {
                const { error } = await supabase
                    .from("lessons")
                    .insert([lessonData]);
                if (error) throw error;
                alert(isDraft ? "Lesson saved as draft!" : "Lesson created!");
            }

            window.location.href = "../InstructorLessonsPage/lesson_page.html";
        } catch (err) {
            console.error("Error saving lesson:", err);
            alert("Failed to save lesson. See console.");
        }
    }

    // save link = Draft
    saveLink.addEventListener("click", (e) => {
        e.preventDefault();
        handleSave(true); // 👈 Draft Mode true
    });

    // bottom Create button = Publish
    createBtn.addEventListener("click", (e) => {
        e.preventDefault();
        handleSave(false); // 👈 Draft Mode false
    });
});

function addReadingItem(text){
    const box = document.createElement("div");
    box.classList.add("tag-box");
    box.textContent = text;
    box.setAttribute('contenteditable','false')

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "|   x";
    removeBtn.onclick = () => {
        box.remove();
        readings = readings.filter(item => item !== text);
    };

    box.appendChild(removeBtn);
    readingList.appendChild(box);
}

lessonForm.addEventListener("submit", async function(event){

    event.preventDefault();
    // Collect selected prerequisites (checkbox version)
    const prereqContainer = document.getElementById("prerequisite");
    const selectedPrereqs = [
        ...prereqContainer.querySelectorAll("input[type='checkbox']:checked")
    ].map(cb => cb.value);

    const lessonData = {
        id: document.getElementById("ID").value,
        title: document.getElementById("Title").value,
        description: document.getElementById("Description").value,
        objectives: document.getElementById("objectives").value,
        prerequisites: selectedPrereqs, // or store as array
        hours: document.getElementById("hours-per-week").value,
        owner: document.getElementById("owner").value,
        creditPoints: document.getElementById("creditPoints").value,
        assignments: assignments,
        readingList: readings
    };
    try {
        const editLessonId = localStorage.getItem("editLessonId");

        if (editLessonId) {
            // Update existing lesson
            const { error } = await supabase
                .from("lessons")
                .update(lessonData)
                .eq("id", editLessonId);

            if (error) throw error;
        } else {
            // Insert new lesson
            const { error } = await supabase
                .from("lessons")
                .insert([lessonData]);

            if (error) throw error;
        }
        alert("Lesson saved successfully!");
        window.location.href = "../InstructorLessonsPage/lesson_page.html";

    } catch (err) {
        console.error("Error saving lesson:", err);
        alert("Failed to save lesson. See console for details.");
    }
    
});

function setCursorToEnd(element) {
    const range = document.createRange();
    const selection = window.getSelection();

    // Selects the contents of the entire element
    range.selectNodeContents(element);

    // Collapses the range to the end, moving the cursor to the end of the content
    range.collapse(false);

    // Removes any existing selections
    selection.removeAllRanges();

    // Adds the new range, placing the cursor at the end
    selection.addRange(range);
}
