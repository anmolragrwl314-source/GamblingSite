/* =========================================
   BETYA DEMO DASHBOARD
   Main JavaScript
========================================= */
const API_BASE_URL = "https://gamblingsite.onrender.com";

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================
       ELEMENTS
    ========================================= */

    const sidebar = document.getElementById("sidebar");
    const menuButton = document.getElementById("menuButton");
    const closeSidebar = document.getElementById("closeSidebar");
    const mobileOverlay = document.getElementById("mobileOverlay");

    const profileButton = document.getElementById("profileButton");
    const profileDropdown = document.getElementById("profileDropdown");

    const notificationBtn =
        document.getElementById("notificationBtn");

    const logoutBtn =
        document.getElementById("logoutBtn");

    const dropdownLogout =
        document.getElementById("dropdownLogout");

    const addFundsBtn =
        document.getElementById("addFundsBtn");

    const fundsModal =
        document.getElementById("fundsModal");

    const closeFundsModal =
        document.getElementById("closeFundsModal");

    const demoAddBtn =
        document.getElementById("demoAddBtn");

    const demoAmount =
        document.getElementById("demoAmount");

    const securityToggle =
        document.getElementById("securityToggle");

    const toast =
        document.getElementById("toast");

    const toastTitle =
        document.getElementById("toastTitle");

    const toastMessage =
        document.getElementById("toastMessage");


    /* =========================================
       MOBILE SIDEBAR
    ========================================= */

    function openSidebar() {

        if (!sidebar) return;

        sidebar.classList.add("open");

        if (mobileOverlay) {
            mobileOverlay.classList.add("show");
        }

        document.body.style.overflow = "hidden";
    }


    function closeMobileSidebar() {

        if (!sidebar) return;

        sidebar.classList.remove("open");

        if (mobileOverlay) {
            mobileOverlay.classList.remove("show");
        }

        document.body.style.overflow = "";
    }


    if (menuButton) {
        menuButton.addEventListener("click", openSidebar);
    }


    if (closeSidebar) {
        closeSidebar.addEventListener(
            "click",
            closeMobileSidebar
        );
    }


    if (mobileOverlay) {
        mobileOverlay.addEventListener(
            "click",
            closeMobileSidebar
        );
    }


    /* =========================================
       CLOSE SIDEBAR AFTER NAVIGATION
    ========================================== */

    document.querySelectorAll(".nav-item").forEach(item => {

        item.addEventListener("click", event => {

            event.preventDefault();

            document.querySelectorAll(".nav-item")
                .forEach(nav => nav.classList.remove("active"));

            item.classList.add("active");

            if (window.innerWidth <= 760) {
                closeMobileSidebar();
            }

            const pageName =
                item.querySelector("span:last-child")?.textContent
                || "Page";

            showToast(
                "Navigation",
                `${pageName} selected`
            );
        });

    });


    /* =========================================
       PROFILE DROPDOWN
    ========================================== */

    if (profileButton && profileDropdown) {

        profileButton.addEventListener("click", event => {

            event.stopPropagation();

            profileDropdown.classList.toggle("show");

        });

    }


    document.addEventListener("click", event => {

        if (
            profileDropdown &&
            !profileDropdown.contains(event.target) &&
            !profileButton?.contains(event.target)
        ) {

            profileDropdown.classList.remove("show");

        }

    });


    /* =========================================
       NOTIFICATION
    ========================================== */

    if (notificationBtn) {

        notificationBtn.addEventListener("click", () => {

            showToast(
                "Notifications",
                "You have 3 new account updates."
            );

        });

    }


    /* =========================================
       ADD FUNDS MODAL
    ========================================== */

    function openFundsModal() {

        if (!fundsModal) return;

        fundsModal.classList.add("show");

        document.body.style.overflow = "hidden";

        setTimeout(() => {

            if (demoAmount) {
                demoAmount.focus();
                demoAmount.select();
            }

        }, 150);
    }


    function closeFundsModalFunction() {

        if (!fundsModal) return;

        fundsModal.classList.remove("show");

        document.body.style.overflow = "";
    }


    if (addFundsBtn) {

        addFundsBtn.addEventListener(
            "click",
            openFundsModal
        );

    }


    if (closeFundsModal) {

        closeFundsModal.addEventListener(
            "click",
            closeFundsModalFunction
        );

    }


    if (fundsModal) {

        fundsModal.addEventListener("click", event => {

            if (event.target === fundsModal) {
                closeFundsModalFunction();
            }

        });

    }


    /* =========================================
       DEMO BALANCE
    ========================================== */

    if (demoAddBtn) {

        demoAddBtn.addEventListener("click", () => {

            const amount =
                parseFloat(demoAmount?.value);

            if (!amount || amount <= 0) {

                showToast(
                    "Invalid amount",
                    "Please enter a valid demo amount."
                );

                return;
            }


            /*
                This is only a front-end demo.

                We update the displayed balance locally.
                No real payment or transaction happens.
            */

            const balanceValue =
                document.querySelector(".balance-value");

            if (balanceValue) {

                const newBalance =
                    2480.50 + amount;

                const formatted =
                    newBalance.toLocaleString(
                        "en-US",
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }
                    );

                balanceValue.innerHTML =
                    `$${formatted}`;

            }


            closeFundsModalFunction();

            showToast(
                "Demo funds added",
                `$${amount.toFixed(2)} added to your demo balance.`
            );

        });

    }


    /* =========================================
       SECURITY TOGGLE
    ========================================== */

    if (securityToggle) {

        securityToggle.addEventListener("click", () => {

            const isActive =
                securityToggle.classList.contains("active");

            if (isActive) {

                securityToggle.classList.remove("active");

                showToast(
                    "2FA disabled",
                    "Two-factor authentication is now off in this demo."
                );

            } else {

                securityToggle.classList.add("active");

                showToast(
                    "2FA enabled",
                    "Two-factor authentication is enabled."
                );

            }

        });

    }


    /* =========================================
       LOGOUT
    ========================================== */

    function handleLogout() {

        showToast(
            "Demo logout",
            "You have been logged out of the demo."
        );

    }


    if (logoutBtn) {
        logoutBtn.addEventListener(
            "click",
            handleLogout
        );
    }


    if (dropdownLogout) {

        dropdownLogout.addEventListener(
            "click",
            handleLogout
        );

    }


    /* =========================================
       VIEW ALL
    ========================================== */

    document.querySelectorAll(".view-all-btn")
        .forEach(button => {

            button.addEventListener("click", () => {

                showToast(
                    "Activity",
                    "Full activity history opened in demo mode."
                );

            });

        });


    /* =========================================
       MANAGE PROFILE
    ========================================== */

    document.querySelectorAll(".outline-full-btn")
        .forEach(button => {

            button.addEventListener("click", () => {

                showToast(
                    "Profile",
                    "Profile management opened in demo mode."
                );

            });

        });


    /* =========================================
       RESPONSIBLE PLAY
    ========================================== */

    const responsibleButton =
        document.querySelector(
            ".responsible-banner button"
        );

    if (responsibleButton) {

        responsibleButton.addEventListener(
            "click",
            () => {

                showToast(
                    "Responsible use",
                    "Remember to set limits and take breaks."
                );

            }
        );

    }


    /* =========================================
       TOAST SYSTEM
    ========================================== */

    let toastTimer;


    function showToast(title, message) {

        if (!toast) return;

        if (toastTitle) {
            toastTitle.textContent = title;
        }

        if (toastMessage) {
            toastMessage.textContent = message;
        }

        toast.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {

            toast.classList.remove("show");

        }, 3200);

    }


    /* =========================================
       ESC KEY
    ========================================== */

    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {

            closeMobileSidebar();

            if (profileDropdown) {
                profileDropdown.classList.remove("show");
            }

            closeFundsModalFunction();

        }

    });


    /* =========================================
       WINDOW RESIZE
    ========================================== */

    window.addEventListener("resize", () => {

        if (window.innerWidth > 760) {

            if (sidebar) {
                sidebar.classList.remove("open");
            }

            if (mobileOverlay) {
                mobileOverlay.classList.remove("show");
            }

            document.body.style.overflow = "";

        }

    });


    /* =========================================
       SIMPLE CARD HOVER EFFECT
    ========================================== */

    document.querySelectorAll(".stat-card")
        .forEach(card => {

            card.addEventListener(
                "mouseenter",
                () => {
                    card.style.transition =
                        "transform 0.25s ease, box-shadow 0.25s ease";
                }
            );

        });


    /* =========================================
       PAGE LOADED
    ========================================== */

    setTimeout(() => {

        console.log(
            "Betya demo dashboard loaded successfully."
        );

    }, 100);

});
async function checkBackendConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    console.log("✅ Backend connected:", data);
  } catch (error) {
    console.error("❌ Backend connection failed:", error);
  }
}

checkBackendConnection();
