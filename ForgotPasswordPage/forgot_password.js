// forgot_password.js

const form = document.getElementById('forgotPasswordForm');
const emailInput = document.getElementById('resetEmail');
const passwordInput = document.getElementById('resetPassword');
const confirmInput = document.getElementById('confirmPassword');

const emailMsg = document.getElementById('emailMessage');
const passwordMsg = document.getElementById('passwordMessage');
const confirmMsg = document.getElementById('confirmMessage');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^[A-Z](?=.*[!@#$%^&*(),.?":{}|<>]).{7,}$/;

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

 // === LIVE VALIDATION ===
 emailInput.addEventListener('input', () => {
  if (emailPattern.test(emailInput.value)) {
    emailMsg.textContent = '✔ Valid email';
    emailMsg.className = 'message success';
  } else {
    emailMsg.textContent = '✖ Please enter a valid email address';
    emailMsg.className = 'message error';
  }
});

passwordInput.addEventListener('input', () => {
  if (passwordPattern.test(passwordInput.value)) {
    passwordMsg.textContent = '✔ Strong password';
    passwordMsg.className = 'message success';
  } else {
    passwordMsg.textContent =
      '✖ Password must start with a capital letter, include a special character, and be at least 8 characters long';
    passwordMsg.className = 'message error';
  }
});

confirmInput.addEventListener('input', () => {
  if (confirmInput.value === passwordInput.value && confirmInput.value !== '') {
    confirmMsg.textContent = '✔ Passwords match';
    confirmMsg.className = 'message success';
  } else {
    confirmMsg.textContent = '✖ Passwords do not match';
    confirmMsg.className = 'message error';
  }
});


form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('resetEmail').value;
  const newPassword = document.getElementById('resetPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  // Final validation before submitting
  if (!emailPattern.test(email)) {
    emailMsg.textContent = '✖ Invalid email format';
    emailMsg.className = 'message error';
    return;
  }

  if (!passwordPattern.test(newPassword)) {
    passwordMsg.textContent = '✖ Weak password';
    passwordMsg.className = 'message error';
    return;
  }

  if (newPassword !== confirmPassword) {
    confirmMsg.textContent = '✖ Passwords do not match';
    confirmMsg.className = 'message error';
    return;
  }


  try {
    // Check if the email exists
    const { data: users, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);

    if (selectError) throw selectError;

    if (!users || users.length === 0) {
      alert('Email not found.');
      return;
    }

    // Update the password in Supabase
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('email', email);

    if (updateError) throw updateError;

    alert(`Password has been reset!`);
    form.reset();
    // Redirect to login page after short delay
    setTimeout(() => {
      window.location.href = '../Login page/login.html';
    }, 100);

  } catch (err) {
    console.error(err);
    alert('An error occurred. Please try again.');
  }
});
