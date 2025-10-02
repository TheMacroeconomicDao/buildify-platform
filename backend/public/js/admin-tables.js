// Простые улучшения для таблиц в админке Laravel Orchid

document.addEventListener("DOMContentLoaded", function () {
    // Применяем базовые улучшения к таблицам
    const tables = document.querySelectorAll(".table");
    tables.forEach((table) => {
        // Принудительно устанавливаем автоматическую ширину
        table.style.tableLayout = "auto";
        table.style.width = "100%";

        // Убираем все ограничения ширины с колонок (кроме первой)
        const headers = table.querySelectorAll("th");
        const allCells = table.querySelectorAll("td");

        headers.forEach((header, index) => {
            if (index > 0) {
                // Не трогаем первую колонку (ID)
                header.style.width = "auto";
                header.style.minWidth = "auto";
                header.style.maxWidth = "none";
            }
        });

        allCells.forEach((cell, index) => {
            // Определяем индекс колонки
            const row = cell.parentElement;
            const cellIndex = Array.from(row.children).indexOf(cell);

            if (cellIndex > 0) {
                // Не трогаем первую колонку (ID)
                cell.style.width = "auto";
                cell.style.minWidth = "auto";
                cell.style.maxWidth = "none";
                cell.style.whiteSpace = "normal";
                cell.style.wordWrap = "break-word";
            }
        });
    });

    // Улучшаем отображение длинного текста
    const textCells = document.querySelectorAll(".table td:not(:first-child)");
    textCells.forEach((cell) => {
        const text = cell.textContent.trim();

        // Добавляем тултип для длинного текста
        if (text.length > 50) {
            cell.setAttribute("title", text);
        }
    });

    // Hover эффекты для строк
    const tableRows = document.querySelectorAll(".table tbody tr");
    tableRows.forEach((row) => {
        row.addEventListener("click", function (e) {
            // Не выделяем строку если кликнули по кнопке или ссылке
            if (
                e.target.tagName === "BUTTON" ||
                e.target.tagName === "A" ||
                e.target.closest("button") ||
                e.target.closest("a")
            ) {
                return;
            }

            // Убираем выделение с других строк
            tableRows.forEach((r) => r.classList.remove("table-active"));

            // Выделяем текущую строку
            this.classList.add("table-active");
        });
    });

    // Улучшаем пагинацию
    const paginationLinks = document.querySelectorAll(".pagination .page-link");
    paginationLinks.forEach((link) => {
        link.addEventListener("mouseenter", function () {
            if (!this.closest(".page-item").classList.contains("active")) {
                this.style.transform = "translateY(-1px)";
                this.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
            }
        });
        link.addEventListener("mouseleave", function () {
            this.style.transform = "";
            this.style.boxShadow = "";
        });
    });

    // Анимация загрузки для форм
    const forms = document.querySelectorAll('form[data-controller="form"]');
    forms.forEach((form) => {
        form.addEventListener("submit", function () {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML =
                    '<span class="spinner-border spinner-border-sm me-2"></span>Загрузка...';
                submitBtn.disabled = true;
            }
        });
    });

    // Улучшаем отображение статусов
    const statusCells = document.querySelectorAll('td[data-column="status"]');
    statusCells.forEach((cell) => {
        const status = cell.textContent.trim();
        const statusMap = {
            0: { text: "Активный", class: "badge bg-success" },
            1: { text: "Неактивный", class: "badge bg-danger" },
            2: { text: "Ожидание", class: "badge bg-warning" },
            3: { text: "Завершен", class: "badge bg-info" },
            active: { text: "Активный", class: "badge bg-success" },
            inactive: { text: "Неактивный", class: "badge bg-danger" },
            pending: { text: "Ожидание", class: "badge bg-warning" },
            completed: { text: "Завершен", class: "badge bg-info" },
        };

        if (statusMap[status.toLowerCase()]) {
            const statusInfo = statusMap[status.toLowerCase()];
            cell.innerHTML = `<span class="${statusInfo.class}">${statusInfo.text}</span>`;
        }
    });

    console.log("Admin tables simple enhancements loaded successfully");
});
