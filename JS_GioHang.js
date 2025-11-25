document.addEventListener("DOMContentLoaded", function () {
    const cartPanel = document.getElementById("cart-panel");
    const cartList = document.getElementById("cart-list");
    const cartTotal = document.getElementById("cart-total");
    const clearCart = document.getElementById("clear-cart");
    const closeCart = document.getElementById("close-cart");
    const cartCountEls = document.querySelectorAll(".cart-value");
    const sendRequestBtn = document.getElementById("send-request"); // Nút Thanh Toán

    // Lấy dữ liệu từ kho chung
    let cart = JSON.parse(localStorage.getItem("tweeCart")) || [];

    // --- CÁC HÀM HỖ TRỢ ---
    function formatCurrency(amount) {
        return parseInt(amount).toLocaleString('vi-VN') + 'đ';
    }

    function updateCartCount() {
        const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountEls.forEach(el => el.textContent = totalQty);
    }

    function updateCartUI() {
        if (!cartList || !cartTotal) return;

        cartList.innerHTML = "";
        let total = 0;

        if (cart.length === 0) {
            cartList.innerHTML = "<li style='text-align:center; padding:20px; color:gray;'>Giỏ hàng đang trống</li>";

            // [MỚI] KHÓA NÚT THANH TOÁN NẾU GIỎ TRỐNG
            if (sendRequestBtn) {
                sendRequestBtn.disabled = true; // Không cho bấm
                sendRequestBtn.style.opacity = "0.5"; // Làm mờ
                sendRequestBtn.style.cursor = "not-allowed"; // Đổi con trỏ chuột
                sendRequestBtn.innerText = "Giỏ hàng trống";
            }
        } else {
            // [MỚI] MỞ LẠI NÚT NẾU CÓ HÀNG
            if (sendRequestBtn) {
                sendRequestBtn.disabled = false;
                sendRequestBtn.style.opacity = "1";
                sendRequestBtn.style.cursor = "pointer";
                sendRequestBtn.innerText = "THANH TOÁN NGAY";
            }
        }

        cart.forEach((item, index) => {
            const li = document.createElement("li");
            li.style.display = "flex";
            li.style.alignItems = "center";
            li.style.justifyContent = "space-between";
            li.style.padding = "10px 0";
            li.style.borderBottom = "1px solid #eee";

            li.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px; flex:2;">
                    <img src="${item.img}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-weight:500; font-size:0.9rem;">${item.name}</span>
                        <span style="font-size:0.8rem; color:gray;">${formatCurrency(item.price)}</span>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:5px;">
                    <button class="decrease" data-index="${index}" style="width:24px;height:24px;border:1px solid #ddd;background:#fff;cursor:pointer;border-radius:4px;">-</button>
                    <span style="font-weight:bold; min-width:20px; text-align:center;">${item.quantity}</span>
                    <button class="increase" data-index="${index}" style="width:24px;height:24px;border:1px solid #ddd;background:#fff;cursor:pointer;border-radius:4px;">+</button>
                </div>
                <div style="flex:1; text-align:right; font-weight:bold; color:#d63384;">
                    ${formatCurrency(item.price * item.quantity)}
                </div>
            `;
            cartList.appendChild(li);
            total += item.price * item.quantity;
        });

        cartTotal.textContent = formatCurrency(total);
        updateCartCount();
        localStorage.setItem("tweeCart", JSON.stringify(cart));
    }

    // --- SỰ KIỆN ---
    if (cartList) {
        cartList.addEventListener("click", (e) => {
            const btn = e.target;
            const i = btn.dataset.index;
            if (btn.classList.contains("increase")) {
                cart[i].quantity++;
                updateCartUI();
            }
            if (btn.classList.contains("decrease")) {
                cart[i].quantity--;
                if (cart[i].quantity <= 0) {
                    if (confirm("Xóa sản phẩm này khỏi giỏ?")) cart.splice(i, 1);
                    else cart[i].quantity = 1;
                }
                updateCartUI();
            }
        });
    }

    if (clearCart) {
        clearCart.addEventListener("click", () => {
            if (cart.length > 0 && confirm("Xóa toàn bộ giỏ hàng?")) {
                cart = [];
                updateCartUI();
            }
        });
    }

    // --- MỞ MODAL THANH TOÁN ---
    if (sendRequestBtn) {
        sendRequestBtn.addEventListener("click", () => {
            if (cart.length === 0) return; // Chặn click nếu giỏ trống

            if (cartPanel) cartPanel.style.right = "-400px"; // Đóng panel

            const modalEl = document.getElementById('checkoutModal');
            if(modalEl) {
                const modal = new bootstrap.Modal(modalEl);
                modal.show();

                // Reset các sự kiện input cũ
                const phoneInput = modalEl.querySelector('#customerPhone');
                const paymentSelect = modalEl.querySelector('#paymentMethod');
                const bankingInfo = modalEl.querySelector('#bankingInfo');

                if(phoneInput) {
                    const newPhoneInput = phoneInput.cloneNode(true);
                    phoneInput.parentNode.replaceChild(newPhoneInput, phoneInput);
                    newPhoneInput.addEventListener('input', function(e) {
                        let val = e.target.value.replace(/[^0-9]/g, '');
                        if(val.length > 10) val = val.slice(0, 10);
                        e.target.value = val;
                    });
                }

                if(paymentSelect && bankingInfo) {
                    paymentSelect.value = 'cod'; // Reset về COD
                    bankingInfo.classList.add('d-none');

                    const newPaymentSelect = paymentSelect.cloneNode(true);
                    paymentSelect.parentNode.replaceChild(newPaymentSelect, paymentSelect);

                    newPaymentSelect.addEventListener('change', function(e) {
                        if(e.target.value === 'banking') bankingInfo.classList.remove('d-none');
                        else bankingInfo.classList.add('d-none');
                    });
                }
            }
        });
    }

    // --- XỬ LÝ NÚT XÁC NHẬN ĐƠN HÀNG ---
    const btnConfirm = document.querySelector('#checkoutModal #btnConfirmOrder');

    if (btnConfirm) {
        const newBtn = btnConfirm.cloneNode(true);
        btnConfirm.parentNode.replaceChild(newBtn, btnConfirm);

        newBtn.addEventListener('click', () => {
            const modalBody = document.querySelector('#checkoutModal .modal-body');
            const nameVal = modalBody.querySelector('#customerName').value.trim();
            const phoneVal = modalBody.querySelector('#customerPhone').value.trim();
            const addrVal = modalBody.querySelector('#customerAddress').value.trim();
            const payVal = modalBody.querySelector('#paymentMethod').value;
            if (!nameVal || !phoneVal || !addrVal) {
                alert("Vui lòng điền đủ thông tin!");
                return;
            }
            if (phoneVal.length !== 10 || !phoneVal.startsWith('0')) {
                alert("Số điện thoại không hợp lệ (phải có 10 số và bắt đầu bằng 0)");
                return;
            }

            const newOrder = {
                id: 'DH-WEB-' + Date.now(),
                customer: { name: nameVal, phone: phoneVal, address: addrVal },
                items: cart,
                total: cartTotal.textContent,
                paymentMethod: payVal,
                date: new Date().toLocaleString('vi-VN'),
                status: 'Chờ xử lý'
            };

            let orders = JSON.parse(localStorage.getItem('tweeOrders')) || [];
            orders.push(newOrder);
            localStorage.setItem('tweeOrders', JSON.stringify(orders));
            alert("Đặt hàng thành công! Mã đơn: " + newOrder.id);
            cart = [];
            updateCartUI();
            document.getElementById('checkoutForm').reset();
            const modalEl = document.getElementById('checkoutModal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) {
                modalInstance.hide();
            } else {
                new bootstrap.Modal(modalEl).hide();
            }

            setTimeout(() => {
                document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }, 500);
        });
    }
    // --- CÁC SỰ KIỆN UI KHÁC ---
    document.querySelectorAll(".cart-icon, .fa-bag-shopping").forEach(icon => {
        const wrapper = icon.closest('a') || icon;
        wrapper.addEventListener("click", (e) => {
            e.preventDefault();
            if (cartPanel) cartPanel.style.right = "0";
        });
    });

    if (closeCart) closeCart.addEventListener("click", () => { if (cartPanel) cartPanel.style.right = "-400px"; });

    document.addEventListener('click', (e) => {
        if (cartPanel && !cartPanel.contains(e.target) && !e.target.closest('.cart-icon') && !e.target.closest('.fa-bag-shopping') && !e.target.closest('#send-request')) {
            cartPanel.style.right = "-400px";
        }
    });

    window.addEventListener('storage', function(e) {
        if (e.key === 'tweeCart') {
            cart = JSON.parse(e.newValue) || [];
            updateCartUI();
        }
    });

    updateCartUI();
});