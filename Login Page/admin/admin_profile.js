document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
  
    // Only admins can access this page
    if (!user || user.role !== "admin") {
      window.location.href = "../login.html";
      return;
    }
  
    // Fill in admin profile info
    const profileInfo = document.querySelector(".profile-info");
    profileInfo.innerHTML = `
      <p><strong>First Name:</strong> ${user.firstName}</p>
      <p><strong>Last Name:</strong> ${user.lastName}</p>
      <p><strong>Email Address:</strong> ${user.email}</p>
    `;
  
    try {

      const { data: classrooms, error: classroomsError } = await supabase
        .from("classrooms")
        .select("classroom_id, title, owner");
  
      if (classroomsError) throw classroomsError;

      // Update classroom count
      document.querySelector(".classrooms-card h2").textContent =
      `Active Classrooms: ${classrooms?.length || 0}`;

  
      // Fill classroom table
      const classroomTableBody = document.querySelector(".classrooms-card table tbody");
      classrooms?.forEach((c) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${c.classroom_id}</td>
            <td>${c.title || "-"}</td>
            <td>${c.owner || "-"}</td>
        `;
        classroomTableBody.appendChild(row);
        });
  
      // 3. Get instructors list
      const { data: instructors, error: instructorsError } = await supabase
        .from("users")
        .select("firstName, lastName, email, role")
        .eq("role", "instructor");
  
      if (instructorsError) throw instructorsError;
  
      const table = document.querySelector(".instructors-card table");
      instructors.forEach((inst) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${inst.firstName} ${inst.lastName}</td>
          <td>${inst.email}</td>
        `;
        table.appendChild(row);
      });
  
    } catch (err) {
      console.error("Error loading admin profile:", err);
    }
  
    // Back button
    document.querySelector(".back-btn").addEventListener("click", () => {
      window.history.back();
    });
  });
  