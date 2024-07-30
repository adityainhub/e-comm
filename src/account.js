// Header adjustment for <768px
const toggle = document.querySelector(".toggle");
const menu = document.querySelector(".nav-menu");

function toggleMenu() {
  if (menu.classList.contains("active")) {
    menu.classList.remove("active");
    // add hamburger icon
    toggle.innerHTML = `<i class="fa fa-bars"></i>`;
  } else {
    menu.classList.add("active");
    // add X icon
    toggle.innerHTML = `<i class="fa fa-times"></i>`;
  }
}

toggle.addEventListener("click", toggleMenu, false);

// Function to handle registration form submission
const handleRegister = async () => {
  try {
    // Initialize an object to store form data
    const formDataJSON = {};

    // Extract data from input fields
    formDataJSON.firstName = document.querySelector(
      'input[name="firstName"]'
    ).value;
    formDataJSON.lastName = document.querySelector(
      'input[name="lastName"]'
    ).value;
    formDataJSON.dob = document.querySelector('input[name="dob"]').value;
    formDataJSON.email = document.querySelector('input[name="email"]').value;
    formDataJSON.phoneNumber = document.querySelector(
      'input[name="phoneNumber"]'
    ).value;
    formDataJSON.username = document.querySelector(
      'input[name="username"]'
    ).value;
    formDataJSON.password = document.querySelector(
      'input[name="password"]'
    ).value;
    formDataJSON.chestSize = document.getElementById("chestSize").value;
    formDataJSON.waistSize = document.getElementById("waistSize").value;
    formDataJSON.shoeSize = document.getElementById("shoeSize").value;
    formDataJSON.termsAgreement =
      document.getElementById("termsCheckbox").checked;

    // Send POST request to the server
    const response = await fetch("http://localhost:3000/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formDataJSON),
    });

    if (!response.ok) {
      throw new Error("Registration failed");
    }

    const data = await response.json();
    // Registration successful, display success message
    document.getElementById("registerForm").style.display = "none";
    document.getElementById("successMessage").style.display = "block";
  } catch (error) {
    // Registration failed, handle the error
    console.error("Error:", error);
    alert("Registration failed. Please try again.");
  }
};

// Event listener for the registration form submission
document
  .getElementById("registerForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent default form submission
    await handleRegister(); // Call the function to handle registration
  });

// Function to handle login form submission
const handleLogin = async () => {
  try {
    // Initialize an object to store form data

    // Extract data from input fields
    let username = document.getElementById("usernameLogin").value;
    let password = document.getElementById("passwordLogin").value;

    // Send GET request to the server for login
    const response = await fetch(
      `http://localhost:3000/login?username=${username}&password=${password}`
    );

    if (!response.ok) {
      throw new Error("Login failed");
    }

    const data = await response.json();

    // Save the JWT in local storage
    localStorage.setItem("jwtToken", data.token);

    window.location.href = "profile.html"; // Update the URL as needed
  } catch (error) {
    // Login failed, handle the error
    console.error("Error:", error);
    alert("Login failed. Please try again.");
  }
};

// Event listener for the login form submission
document
  .getElementById("loginForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent default form submission
    await handleLogin(); // Call the function to handle login
  });
