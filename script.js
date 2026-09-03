/* =========================================================
   GAMBLINGSITE - FRONTEND JAVASCRIPT
Razorpay Live Payment Integration + Dashboard Interactions
   ========================================================= */

const API_BASE_URL = "https://gamblingsite.onrender.com";
const DEMO_USER_ID = "demo-user-001";


document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTS
       ===================================================== */

    const addFundsBtn = document.getElementById("addFundsBtn");
    const fundsModal = document.getElementById("fundsModal");
    const closeFundsModal = document.getElementById("closeFundsModal");
    const demoAddBtn = document.getElementById("demoAddBtn");
    const demoAmount = document.getElementById("demoAmount");

    const withdrawBtn = document.getElementById("withdrawBtn");

    const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
    const mobileOverlay = document.querySelector(".mobile-overlay");

    const navLinks = document.querySelectorAll(".nav-link");

    /* =====================================================
       MODAL FUNCTIONS
       ===================================================== */

    function openFundsModal() {
        if (!fundsModal) {
            console.error("❌ fundsModal not found");
            return;
        }

        fundsModal.classList.add("show");
        document.body.classList.add("modal-open");

        if (demoAmount) {
            demoAmount.focus();
            demoAmount.select();
        }
    }


    function closeFundsModalFunction() {
        if (!fundsModal) return;

        fundsModal.classList.remove("show");
        document.body.classList.remove("modal-open");
    }


    /* =====================================================
       ADD FUNDS BUTTON
       ===================================================== */

    if (addFundsBtn) {

        addFundsBtn.addEventListener("click", (event) => {
            event.preventDefault();
            openFundsModal();
        });

        console.log("✅ Add Funds button connected");

    } else {

        console.error(
            "❌ Add Funds button not found. Check id='addFundsBtn'"
        );

    }


    /* =====================================================
       CLOSE MODAL
       ===================================================== */

    if (closeFundsModal) {

        closeFundsModal.addEventListener("click", () => {
            closeFundsModalFunction();
        });

    }


    /* =====================================================
       CLOSE MODAL WHEN CLICKING OUTSIDE
       ===================================================== */

    if (fundsModal) {

        fundsModal.addEventListener("click", (event) => {

            if (event.target === fundsModal) {
                closeFundsModalFunction();
            }

        });

    }


    /* =====================================================
       ESCAPE KEY CLOSE
       ===================================================== */

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {
            closeFundsModalFunction();
        }

    });


    /* =====================================================
       RAZORPAY PAYMENT
       ===================================================== */

    if (demoAddBtn) {

        demoAddBtn.addEventListener("click", async () => {

            /* ---------------------------------------------
               GET AMOUNT
               --------------------------------------------- */

            const amount = Number(
                demoAmount ? demoAmount.value : 0
            );


            /* ---------------------------------------------
               VALIDATE AMOUNT
               --------------------------------------------- */

            if (!Number.isFinite(amount)) {

                showToast(
                    "Invalid amount",
                    "Please enter a valid amount."
                );

                return;
            }


            if (amount < 10) {

                showToast(
                    "Minimum amount is ₹10",
                    "Please enter at least ₹10."
                );

                return;
            }


            if (amount > 100000) {

                showToast(
                    "Maximum amount is ₹100,000",
                    "Please enter a smaller amount."
                );

                return;
            }


            /* ---------------------------------------------
               CHECK RAZORPAY SCRIPT
               --------------------------------------------- */

            if (typeof Razorpay === "undefined") {

                showToast(
                    "Payment gateway unavailable",
                    "Razorpay could not be loaded. Refresh the page and try again."
                );

                console.error(
                    "❌ Razorpay Checkout script not loaded"
                );

                return;
            }


            /* ---------------------------------------------
               DISABLE BUTTON
               --------------------------------------------- */

            const originalText = demoAddBtn.innerText;

            demoAddBtn.disabled = true;
            demoAddBtn.innerText = "Creating payment...";


            try {

                /* =========================================
                   STEP 1
                   CREATE ORDER ON BACKEND
                   ========================================= */

                const createResponse = await fetch(
                    `${API_BASE_URL}/api/deposit/create`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            amount: amount,
                            userId: DEMO_USER_ID
                        })
                    }
                );


                const createData = await createResponse.json();


                if (!createResponse.ok || !createData.success) {

                    throw new Error(
                        createData.message ||
                        "Unable to create payment order."
                    );

                }


                console.log(
                    "✅ Razorpay order created:",
                    createData
                );


                /* =========================================
                   STEP 2
                   RAZORPAY CHECKOUT OPTIONS
                   ========================================= */

                const options = {

                    key: createData.keyId,

                    amount: createData.amount,

                    currency: createData.currency || "INR",

                    name: "GamblingSite",

                    description: "Add Funds",

                    order_id: createData.orderId,


                    prefill: {
                        name: "Demo User",
                        email: "demo@example.com"
                    },


                    notes: {
                        userId: DEMO_USER_ID
                    },


                    theme: {
                        color: "#111827"
                    },


                    /* =====================================
                       SUCCESS HANDLER
                       ===================================== */

                    handler: async function (response) {

                        console.log(
                            "✅ Razorpay payment completed:",
                            response
                        );


                        try {

                            /* =============================
                               STEP 3
                               VERIFY PAYMENT ON SERVER
                               ============================= */

                            const verifyResponse = await fetch(
                                `${API_BASE_URL}/api/deposit/verify`,
                                {
                                    method: "POST",

                                    headers: {
                                        "Content-Type": "application/json"
                                    },

                                    body: JSON.stringify({

                                        userId: DEMO_USER_ID,

                                        razorpay_order_id:
                                            response.razorpay_order_id,

                                        razorpay_payment_id:
                                            response.razorpay_payment_id,

                                        razorpay_signature:
                                            response.razorpay_signature

                                    })
                                }
                            );


                            const verifyData =
                                await verifyResponse.json();


                            if (
                                !verifyResponse.ok ||
                                !verifyData.success
                            ) {

                                throw new Error(
                                    verifyData.message ||
                                    "Payment verification failed."
                                );

                            }


                            /* =============================
                               PAYMENT VERIFIED
                               ============================= */

                            closeFundsModalFunction();


                            showToast(
                                "Payment successful",
                                `₹${amount.toFixed(2)} payment verified successfully.`
                            );


                            console.log(
                                "✅ Payment verified:",
                                verifyData
                            );


                        } catch (error) {

                            console.error(
                                "❌ Verification error:",
                                error
                            );


                            showToast(
                                "Verification failed",
                                error.message ||
                                "Payment could not be verified."
                            );

                        }

                    },


                    /* =====================================
                       PAYMENT FAILED
                       ===================================== */

                    modal: {

                        ondismiss: function () {

                            demoAddBtn.disabled = false;
                            demoAddBtn.innerText = originalText;

                            console.log(
                                "Payment window closed"
                            );

                        }

                    }

                };


                /* =========================================
                   OPEN RAZORPAY CHECKOUT
                   ========================================= */

                const razorpay = new Razorpay(options);


                razorpay.on(
                    "payment.failed",
                    function (response) {

                        console.error(
                            "❌ Razorpay payment failed:",
                            response.error
                        );


                        showToast(
                            "Payment failed",
                            response.error?.description ||
                            "The payment was not completed."
                        );


                        demoAddBtn.disabled = false;
                        demoAddBtn.innerText = originalText;

                    }
                );


                razorpay.open();


                /* Restore button state */
                demoAddBtn.disabled = false;
                demoAddBtn.innerText = originalText;


            } catch (error) {

                console.error(
                    "❌ Payment creation error:",
                    error
                );


                showToast(
                    "Payment error",
                    error.message ||
                    "Something went wrong while starting the payment."
                );


                demoAddBtn.disabled = false;
                demoAddBtn.innerText = originalText;

            }

        });

    } else {

        console.error(
            "❌ demoAddBtn not found in HTML"
        );

    }


    /* =====================================================
       WITHDRAW BUTTON
       ===================================================== */

    if (withdrawBtn) {

        withdrawBtn.addEventListener("click", async () => {

            const amountText = prompt(
                "Enter withdrawal amount in ₹:"
            );


            if (amountText === null) {
                return;
            }


            const amount = Number(amountText);


            if (!Number.isFinite(amount) || amount <= 0) {

                showToast(
                    "Invalid amount",
                    "Please enter a valid withdrawal amount."
                );

                return;
            }


            if (amount < 10) {

                showToast(
                    "Minimum withdrawal is ₹10",
                    "Please enter at least ₹10."
                );

                return;
            }


            if (amount > 100000) {

                showToast(
                    "Maximum withdrawal is ₹100,000",
                    "Please enter a smaller amount."
                );

                return;
            }


            try {

                withdrawBtn.disabled = true;
                withdrawBtn.innerText = "Processing...";


                const response = await fetch(
                    `${API_BASE_URL}/api/withdrawal/create`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            amount: amount,
                            userId: DEMO_USER_ID
                        })
                    }
                );


                const data = await response.json();


                if (!response.ok || !data.success) {

                    throw new Error(
                        data.message ||
                        "Withdrawal request failed."
                    );

                }


                showToast(
                    "Withdrawal request submitted",
                    `₹${amount.toFixed(2)} withdrawal request created.`
                );


                console.log(
                    "✅ Withdrawal request:",
                    data
                );


            } catch (error) {

                console.error(
                    "❌ Withdrawal error:",
                    error
                );


                showToast(
                    "Withdrawal failed",
                    error.message ||
                    "Unable to create withdrawal request."
                );

            } finally {

                withdrawBtn.disabled = false;
                withdrawBtn.innerText = "Withdraw";

            }

        });

    }


    /* =====================================================
       MOBILE MENU
       ===================================================== */

    if (mobileMenuBtn) {

        mobileMenuBtn.addEventListener("click", () => {

            document.body.classList.toggle(
                "mobile-menu-open"
            );

        });

    }


    if (mobileOverlay) {

        mobileOverlay.addEventListener("click", () => {

            document.body.classList.remove(
                "mobile-menu-open"
            );

        });

    }


    /* =====================================================
       NAVIGATION LINKS
       ===================================================== */

    navLinks.forEach((link) => {

        link.addEventListener("click", () => {

            navLinks.forEach((item) => {
                item.classList.remove("active");
            });


            link.classList.add("active");


            document.body.classList.remove(
                "mobile-menu-open"
            );

        });

    });


    /* =====================================================
       GENERAL BUTTON ANIMATION
       ===================================================== */

    const buttons = document.querySelectorAll(
        "button:not([disabled])"
    );


    buttons.forEach((button) => {

        button.addEventListener("mousedown", () => {
            button.classList.add("pressed");
        });


        button.addEventListener("mouseup", () => {
            button.classList.remove("pressed");
        });


        button.addEventListener("mouseleave", () => {
            button.classList.remove("pressed");
        });

    });


    /* =====================================================
       INITIAL CONSOLE MESSAGE
       ===================================================== */

    console.log(
        "🚀 GamblingSite frontend loaded successfully."
    );

    console.log(
        "🔗 Backend:",
        API_BASE_URL
    );

});


/* =========================================================
   TOAST NOTIFICATION
   ========================================================= */

function showToast(title, message) {

    let toastContainer =
        document.getElementById("toastContainer");


    /* ---------------------------------------------
       CREATE TOAST CONTAINER IF NEEDED
       --------------------------------------------- */

    if (!toastContainer) {

        toastContainer = document.createElement("div");

        toastContainer.id = "toastContainer";

        toastContainer.style.position = "fixed";
        toastContainer.style.right = "20px";
        toastContainer.style.bottom = "20px";
        toastContainer.style.zIndex = "10000";
        toastContainer.style.display = "flex";
        toastContainer.style.flexDirection = "column";
        toastContainer.style.gap = "12px";

        document.body.appendChild(
            toastContainer
        );

    }


    /* ---------------------------------------------
       CREATE TOAST
       --------------------------------------------- */

    const toast =
        document.createElement("div");


    toast.className = "custom-toast";


    toast.innerHTML = `
        <div class="toast-title">
            ${escapeHtml(title)}
        </div>

        <div class="toast-message">
            ${escapeHtml(message)}
        </div>
    `;


    /* ---------------------------------------------
       INLINE FALLBACK STYLING
       --------------------------------------------- */

    toast.style.background = "#111827";
    toast.style.color = "#ffffff";
    toast.style.padding = "14px 18px";
    toast.style.borderRadius = "12px";
    toast.style.minWidth = "260px";
    toast.style.maxWidth = "360px";
    toast.style.boxShadow =
        "0 10px 30px rgba(0,0,0,0.25)";

    toast.style.fontFamily =
        "Arial, sans-serif";


    const titleElement =
        toast.querySelector(".toast-title");


    const messageElement =
        toast.querySelector(".toast-message");


    if (titleElement) {

        titleElement.style.fontWeight = "700";
        titleElement.style.marginBottom = "4px";

    }


    if (messageElement) {

        messageElement.style.fontSize = "13px";
        messageElement.style.opacity = "0.8";

    }


    toastContainer.appendChild(toast);


    /* ---------------------------------------------
       AUTO REMOVE
       --------------------------------------------- */

    setTimeout(() => {

        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        toast.style.transition =
            "all 0.25s ease";


        setTimeout(() => {

            toast.remove();

        }, 250);

    }, 3500);

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   BACKEND HEALTH CHECK
   ========================================================= */

async function checkBackendHealth() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/health`
        );


        const data =
            await response.json();


        if (data.success) {

            console.log(
                "🟢 Backend is healthy",
                data
            );

        } else {

            console.warn(
                "🟡 Backend responded but is not healthy."
            );

        }

    } catch (error) {

        console.error(
            "🔴 Backend health check failed:",
            error
        );

    }

}


checkBackendHealth();
